package com.chat.backend.controller;

import com.chat.backend.dto.*;
import com.chat.backend.service.GroupService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GroupResponse createGroup(@RequestBody CreateGroupRequest request, Principal principal)
    {
        return groupService.createGroup(request, principal.getName());
    }

    @GetMapping
    public List<GroupResponse> getMyGroups(Principal principal)
    {
        return groupService.getMyGroups(principal.getName());
    }

    @GetMapping("/{groupId}")
    public GroupResponse getGroupDetails(@PathVariable Long groupId, Principal principal)
    {
        return groupService.getGroupDetails(groupId, principal.getName());
    }

    @GetMapping("/{groupId}/members")
    public List<GroupMemberResponse> getGroupMembers(@PathVariable Long groupId, Principal principal)
    {
        return groupService.getGroupMembers(groupId, principal.getName());
    }

    @PostMapping("/{groupId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public GroupMessageResponse sendMessage(@PathVariable Long groupId, @RequestBody GroupMessageRequest request, Principal principal)
    {
        return groupService.sendMessage(principal.getName(), request, groupId);
    }

    @GetMapping("/{groupId}/messages")
    public List<GroupMessageResponse> getAllMessages(@PathVariable Long groupId, @RequestParam(defaultValue = "9223372036854775807") long before, Principal principal)
    {
        return groupService.getAllMessages(groupId, before, principal.getName());
    }
}
