package com.chat.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "group_messages",
        indexes = {
                @Index(
                        name = "idx_group_message_history",
                        columnList = "group_id, id"
                )
        }
)
public class GroupMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private ChatGroup group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "sender",
            referencedColumnName = "username",
            nullable = false
    )
    private Account sender;

    @Column(nullable = false, length = 4000)
    private String body;

    @Column(nullable = false, updatable = false)
    private Instant sentAt;

    protected GroupMessage() {}

    public GroupMessage(
            ChatGroup group,
            Account sender,
            String body
    ) {
        this.group = group;
        this.sender = sender;
        this.body = body;
        this.sentAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) {
            sentAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public ChatGroup getGroup() {
        return group;
    }

    public Account getSender() {
        return sender;
    }

    public String getBody() {
        return body;
    }

    public Instant getSentAt() {
        return sentAt;
    }
}
