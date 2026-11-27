package com.chat.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "chat_groups")
public class ChatGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "created_by",
            referencedColumnName = "username",
            nullable = false
    )
    private Account createdBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected ChatGroup(){}

    public ChatGroup(String name, Account createdBy) {
        this.name = name;
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate(){
        if(createdAt == null){
            createdAt = Instant.now();
        }
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCreatedBy(Account createdBy) {
        this.createdBy = createdBy;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Account getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
