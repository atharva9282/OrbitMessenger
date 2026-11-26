package com.chat.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    @Column(length = 24)
    public String username;

    @Version
    public Long version;

    @Column(nullable = false, length = 50)
    public String displayName;

    @Column(nullable = false, length = 70)
    public String passwordHash;

    protected Account(){

    }

    public Account(String username, String displayName, String passwordHash) {
        this.username = username;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
    }
}
