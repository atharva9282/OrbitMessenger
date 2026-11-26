package com.chat.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_sender_recipient_id", columnList = "sender, recipient, id"),
        @Index(name = "idx_recipient_id", columnList = "recipient, id"),
})
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, length = 25)
    public String sender;

    @Column(nullable = false, length = 25)
    public String recipient;

    @Column(nullable = false, length = 4000)
    public String body;

    public Instant sentAt;

    protected ChatMessage(){}

    public ChatMessage(String sender, String recipient, String body) {
        this.sender = sender;
        this.recipient = recipient;
        this.body = body;
        this.sentAt = Instant.now();
    }
}
