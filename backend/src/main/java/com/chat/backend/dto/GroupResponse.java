package com.chat.backend.dto;

import java.time.Instant;
import java.util.List;

public record GroupResponse(
        Long id,
        String name,
        String createdBy,
        Instant createdAt,
        int memberCount,
        List<GroupMemberResponse> members,
        GroupMessageResponse lastMessage
) {
}
