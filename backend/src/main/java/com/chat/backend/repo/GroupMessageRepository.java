package com.chat.backend.repo;

import com.chat.backend.entity.GroupMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupMessageRepository extends JpaRepository<GroupMessage, Long> {

    @Query("""
        SELECT m
        FROM GroupMessage m
        WHERE m.group.id = :groupId
          AND m.id < :before
        ORDER BY m.id DESC
    """)
    List<GroupMessage> findHistory(
            @Param("groupId") Long groupId,
            @Param("before") long before,
            Pageable pageable
    );

    Optional<GroupMessage> findTopByGroup_IdOrderByIdDesc(Long groupId);

    long countByGroup_Id(Long groupId);
}
