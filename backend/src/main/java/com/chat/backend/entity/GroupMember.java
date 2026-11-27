package com.chat.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "group_members",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_group_member",
                        columnNames = {"group_id", "username"}
                )
        },
        indexes = {
                @Index(name = "idx_group_member_group", columnList = "group_id"),
                @Index(name = "idx_group_member_user", columnList = "username")
        }
)
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private ChatGroup group ;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "username",
            referencedColumnName = "username",
            nullable = false
    )
    private Account account;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private GroupRole role;

    @Column(nullable = false, updatable = false)
    private Instant joinedAt;

    protected GroupMember() {}

    public GroupMember(ChatGroup chatGroup, Account account, GroupRole role) {
        this.group = chatGroup;
        this.account = account;
        this.role = role;
        this.joinedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (joinedAt == null) {
            joinedAt = Instant.now();
        }
    }

    public void setRole(GroupRole role) {
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public ChatGroup getGroup() {
        return group;
    }

    public Account getAccount() {
        return account;
    }

    public GroupRole getRole() {
        return role;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }
}
