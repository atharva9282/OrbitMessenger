package com.chat.backend.dto;

public record GroupMessageEvent(
        String type,
        Long groupId,
        GroupMessageResponse message
) {
}
