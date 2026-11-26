package com.chat.backend.service;

import com.chat.backend.dto.Conversation;
import com.chat.backend.dto.OutgoingMessage;
import com.chat.backend.dto.Person;
import com.chat.backend.dto.Registration;
import com.chat.backend.entity.Account;
import com.chat.backend.entity.ChatMessage;
import com.chat.backend.repo.AccountRepository;
import com.chat.backend.repo.ChatMessageRepository;
import com.chat.backend.websocket.LiveUpdates;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Service
public class ChatService {

    private final AccountRepository accounts;
    private final ChatMessageRepository messages;
    private final PasswordEncoder encoder;
    private final LiveUpdates updates;

    public ChatService(AccountRepository accounts, ChatMessageRepository messages, PasswordEncoder encoder, LiveUpdates updates) {
        this.accounts = accounts;
        this.messages = messages;
        this.encoder = encoder;
        this.updates = updates;
    }

    public Person register(Registration data)
    {
        Account account = new Account(data.getUsername(), data.getDisplayName(), encoder.encode(data.getPassword()));
        accounts.saveAndFlush(account);

        return new Person(account.username, account.displayName);
    }

    public Person getPerson(String username)
    {
        Account account = accounts.findById(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return new Person(account.username, account.displayName);
    }

    public List<Person> search(String query, String currentUsername)
    {
        String prefix = query.trim().toLowerCase(Locale.ROOT);
        List<Person> people = new ArrayList<>();
        if(!prefix.matches("[a-z0-9_]{1,24}"))
        {
            return people;
        }

        for(Account account: accounts.findTop20ByUsernameStartingWithAndUsernameNotOrderByUsername(prefix, currentUsername)){
            people.add(new Person(account.username, account.displayName));
        }

        return people;
    }

    public List<Conversation> getMyConversations(String currentUsername)
    {
        List<Conversation> conversations = new ArrayList<>();
        for(ChatMessage chatMessage: messages.conversations(currentUsername)){
            String peer = chatMessage.sender.equals(currentUsername) ? chatMessage.recipient : chatMessage.sender;
            conversations.add(new Conversation(getPerson(peer), chatMessage));
        }

        return conversations;
    }

    public List<ChatMessage> history(String currentUsername, String peer, long before)
    {
        List<ChatMessage> res = new ArrayList<>(messages.history(currentUsername, peer, before, PageRequest.of(0, 50)));
        Collections.reverse(res);
        return res;
    }

    public ChatMessage send(OutgoingMessage data, String currentUsername)
    {
        String recipient = data.getRecipient();
        String body = data.getBody();
        if(recipient==null || recipient.isBlank())
        {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "choose a recipient");
        }
        ChatMessage message = messages.saveAndFlush(new ChatMessage(currentUsername, recipient, body));
        updates.publish(message);
        return message;
    }

}
