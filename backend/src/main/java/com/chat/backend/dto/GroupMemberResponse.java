package com.chat.backend.dto;

import com.chat.backend.entity.GroupRole;

import java.time.Instant;

public record GroupMemberResponse(
        String username,
        String displayName,
        GroupRole role,
        Instant joinedAt
) {
}
