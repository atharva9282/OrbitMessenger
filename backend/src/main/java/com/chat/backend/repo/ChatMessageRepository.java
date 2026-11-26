package com.chat.backend.repo;

import com.chat.backend.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("select m from ChatMessage m where ((m.sender=:me and m.recipient=:peer) or (m.sender=:peer and m.recipient=:me)) and m.id<:before order by m.id desc")
    List<ChatMessage> history(String me, String peer, long before, Pageable page);

    @Query("""
    select m from ChatMessage m 
    where m.id in (
        select max(c.id) from ChatMessage c 
        where c.sender = :me or c.recipient = :me 
        group by case when c.sender = :me then c.recipient else c.sender end
    ) 
    order by m.id desc
    """)
    List<ChatMessage> conversations(@Param("me") String me);




}
