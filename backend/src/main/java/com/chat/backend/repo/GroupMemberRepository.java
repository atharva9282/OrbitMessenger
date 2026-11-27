package com.chat.backend.repo;

import com.chat.backend.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long>{

    List<GroupMember> findByGroup_IdOrderByJoinedAtAsc(Long groupId);

    boolean existsByGroup_IdAndAccount_Username(Long groupId, String username);

    Optional<GroupMember> findByGroup_IdAndAccount_Username(Long groupId, String username);

    List<GroupMember> findByAccount_UsernameOrderByJoinedAtDesc(String username);

    long countByGroup_Id(Long groupId);
}
