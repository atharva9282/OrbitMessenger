package com.chat.backend.service;

import com.chat.backend.dto.*;
import com.chat.backend.entity.*;
import com.chat.backend.repo.AccountRepository;
import com.chat.backend.repo.ChatGroupRepository;
import com.chat.backend.repo.GroupMemberRepository;
import com.chat.backend.repo.GroupMessageRepository;
import com.chat.backend.websocket.LiveUpdates;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toList;

@Service
public class GroupService {

    private final ChatGroupRepository chatGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final AccountRepository accountRepository;
    private final GroupMessageRepository groupMessageRepository;
    private final LiveUpdates updates;

    public GroupService(ChatGroupRepository chatGroupRepository, GroupMemberRepository groupMemberRepository, AccountRepository accountRepository, GroupMessageRepository groupMessageRepository, LiveUpdates updates) {
        this.chatGroupRepository = chatGroupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.accountRepository = accountRepository;
        this.groupMessageRepository = groupMessageRepository;
        this.updates = updates;
    }

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request, String username)
    {
        if (request.getName() == null || request.getName().isBlank())
        {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Group name is required");
        }

        String groupName = request.getName().trim();

        if (groupName.length() > 60)
        {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Group name cannot exceed 60 characters");
        }

        if (request.getMemberUsernames() == null || request.getMemberUsernames().isEmpty())
        {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one member");
        }

        Account account = accountRepository.findById(username)
                .orElseThrow(()-> new UsernameNotFoundException("Invalid Credentials"));
        ChatGroup group = new ChatGroup(groupName, account);
        ChatGroup createdGroup = chatGroupRepository.saveAndFlush(group);
        List<GroupMemberResponse> memberResponses = new ArrayList<>();
        request.getMemberUsernames().forEach(
                user-> {
                    Account memberAccount = accountRepository.findById(user).orElseThrow(()-> new UsernameNotFoundException("Invalid Credentials"));
                    GroupMember groupMember = groupMemberRepository.saveAndFlush(
                            new GroupMember(createdGroup, memberAccount, GroupRole.MEMBER)
                    );
                    memberResponses.add(new GroupMemberResponse(memberAccount.getUsername(), memberAccount.getDisplayName(), GroupRole.MEMBER, groupMember.getJoinedAt()));
                }
        );
        GroupMember creatorMember = groupMemberRepository.saveAndFlush(new GroupMember(createdGroup, account, GroupRole.ADMIN));
        memberResponses.add(new GroupMemberResponse(account.getUsername(), account.getDisplayName(), GroupRole.ADMIN, creatorMember.getJoinedAt()));

        return new GroupResponse(
                createdGroup.getId(),
                createdGroup.getName(),
                createdGroup.getCreatedBy().getUsername(),
                createdGroup.getCreatedAt(),
                request.getMemberUsernames().size()+1,
                memberResponses,
                null
        );
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getMyGroups(String username)
    {
        List<GroupMember> memberships = groupMemberRepository.findByAccount_UsernameOrderByJoinedAtDesc(username);

        List<GroupResponse> responses = new ArrayList<>();
        for(GroupMember member: memberships)
        {
            ChatGroup chatGroup = member.getGroup();
            List<GroupMember> groupMembers = groupMemberRepository.findByGroup_IdOrderByJoinedAtAsc(chatGroup.getId());

            List<GroupMemberResponse> memberResponses = groupMembers.stream()
                            .map((m) ->
                                new GroupMemberResponse(
                                        m.getAccount().getUsername(),
                                        m.getAccount().getDisplayName(),
                                        m.getRole(),
                                        m.getJoinedAt()
                                )
                            ).toList();

            Optional<GroupMessage> latest = groupMessageRepository.findTopByGroup_IdOrderByIdDesc(chatGroup.getId());

            GroupMessageResponse lastMessage = latest
                            .map(m->
                                new GroupMessageResponse(
                                        m.getId(),
                                        m.getSender().getUsername(),
                                        m.getSender().getDisplayName(),
                                        m.getBody(),
                                        m.getSentAt()
                                )
                            ).orElse(null);

            responses.add(new GroupResponse(
                    chatGroup.getId(),
                    chatGroup.getName(),
                    chatGroup.getCreatedBy().getUsername(),
                    chatGroup.getCreatedAt(),
                    groupMembers.size(),
                    memberResponses,
                    lastMessage
            ));
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroupDetails(Long groupId, String username)
    {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(()-> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid group id"));

        boolean isMember = groupMemberRepository.existsByGroup_IdAndAccount_Username(groupId, username);

        if (!isMember)
        {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }

        List<GroupMemberResponse> memberResponses = groupMemberRepository.findByGroup_IdOrderByJoinedAtAsc(groupId).stream()
            .map(m-> new GroupMemberResponse(
                    m.getAccount().getUsername(),
                    m.getAccount().getDisplayName(),
                    m.getRole(),
                    m.getJoinedAt()
            )).toList();

        GroupMessageResponse lastMessage = groupMessageRepository.findTopByGroup_IdOrderByIdDesc(groupId)
                .map(m-> new GroupMessageResponse(
                        m.getId(),
                        m.getSender().getUsername(),
                        m.getSender().getDisplayName(),
                        m.getBody(),
                        m.getSentAt()
                )).orElse(null);

        return new GroupResponse(
                group.getId(),
                group.getName(),
                group.getCreatedBy().getUsername(),
                group.getCreatedAt(),
                memberResponses.size(),
                memberResponses,
                lastMessage
        );
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> getGroupMembers(Long groupId, String username)
    {
        boolean isMember = groupMemberRepository.existsByGroup_IdAndAccount_Username(groupId, username);
        if (!isMember)
        {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }

        return groupMemberRepository.findByGroup_IdOrderByJoinedAtAsc(groupId).stream()
                .map(m-> new GroupMemberResponse(
                        m.getAccount().getUsername(),
                        m.getAccount().getDisplayName(),
                        m.getRole(),
                        m.getJoinedAt()
                )).toList();
    }

    @Transactional
    public GroupMessageResponse sendMessage(String username, GroupMessageRequest request, Long groupId)
    {
        if (request == null || request.body() == null || request.body().isBlank())
        {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message body cannot be empty");
        }

        if (request.body().length() > 4000)
        {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot exceed 4000 characters");
        }

        boolean isMember = groupMemberRepository.existsByGroup_IdAndAccount_Username(groupId, username);
        if (!isMember)
        {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }

        Account sender = accountRepository.findById(username)
                .orElseThrow(()-> new UsernameNotFoundException("Invalid credentials"));
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        GroupMessage message = groupMessageRepository.saveAndFlush(new GroupMessage(group, sender, request.body()));

        GroupMessageResponse response = new GroupMessageResponse(
                message.getId(),
                message.getSender().getUsername(),
                message.getSender().getDisplayName(),
                message.getBody(),
                message.getSentAt()
        );

        Set<String> memberUsernames = groupMemberRepository.findByGroup_IdOrderByJoinedAtAsc(groupId).stream()
                .map(m->m.getAccount().getUsername())
                .collect(Collectors.toSet());

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {

                    @Override
                    public void afterCommit() {
                        updates.publishGroup(groupId, response, memberUsernames);
                    }
                }
        );

        return response;
    }

    @Transactional(readOnly = true)
    public List<GroupMessageResponse> getAllMessages(Long groupId, long before, String username)
    {
        boolean isMember = groupMemberRepository.existsByGroup_IdAndAccount_Username(groupId, username);
        if (!isMember)
        {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }
        if (before <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid message cursor");
        }

        List<GroupMessage> messages = groupMessageRepository.findHistory(groupId, before, PageRequest.of(0,50));
        Collections.reverse(messages);

        return messages.stream()
                .map(m->new GroupMessageResponse(
                        m.getId(),
                        m.getSender().getUsername(),
                        m.getSender().getDisplayName(),
                        m.getBody(),
                        m.getSentAt()
                )).toList();

    }

}
