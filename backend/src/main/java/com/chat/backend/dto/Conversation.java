package com.chat.backend.dto;

import com.chat.backend.entity.ChatMessage;

public class Conversation {

    private Person person;
    private ChatMessage chatMessage;

    public Conversation(){

    }

    public Conversation(Person person, ChatMessage chatMessage) {
        this.person = person;
        this.chatMessage = chatMessage;
    }

    public Person getPerson() {
        return person;
    }

    public void setPerson(Person person) {
        this.person = person;
    }

    public ChatMessage getChatMessage() {
        return chatMessage;
    }

    public void setChatMessage(ChatMessage chatMessage) {
        this.chatMessage = chatMessage;
    }
}
