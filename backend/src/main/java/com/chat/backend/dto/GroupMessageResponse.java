package com.chat.backend.dto;

import java.time.Instant;

public record GroupMessageResponse(
        Long id,
        String sender,
        String senderDisplayName,
        String body,
        Instant sentAt
) {
}
