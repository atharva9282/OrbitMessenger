package com.chat.backend.controller;

import com.chat.backend.dto.Conversation;
import com.chat.backend.dto.OutgoingMessage;
import com.chat.backend.dto.Person;
import com.chat.backend.dto.Registration;
import com.chat.backend.entity.ChatMessage;
import com.chat.backend.service.ChatService;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token)
    {
        return Map.of("token: ", token.getToken(), "headerName: ",token.getHeaderName());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Person register(@RequestBody Registration data)
    {
        return chatService.register(data);
    }

    @GetMapping("/me")
    public Person me(Principal principal)
    {
        return chatService.getPerson(principal.getName());
    }

    @GetMapping("/users")
    public List<Person> search(@RequestParam String q, Principal principal)
    {
        return chatService.search(q, principal.getName());
    }

    @GetMapping("/conversations")
    public List<Conversation> conversations(Principal principal)
    {
        return chatService.getMyConversations(principal.getName());
    }

    @GetMapping("/message/{peer}")
    public List<ChatMessage> history(Principal principal, @PathVariable String peer, @RequestParam long before)
    {
        return chatService.history(principal.getName(), peer, before);
    }

    @PostMapping("/message")
    public ChatMessage send(@RequestBody OutgoingMessage data, Principal principal)
    {
        return chatService.send(data, principal.getName());
    }
}
