package com.chat.backend.dto;

public class OutgoingMessage {

    private String recipient;
    private String body;

    public OutgoingMessage(){}

    public OutgoingMessage(String recipient, String body) {
        this.recipient = recipient;
        this.body = body;
    }

    public String getRecipient() {
        return recipient;
    }

    public void setRecipient(String recipient) {
        this.recipient = recipient;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }
}
