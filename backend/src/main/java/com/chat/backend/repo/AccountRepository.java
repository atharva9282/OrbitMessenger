package com.chat.backend.repo;

import com.chat.backend.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountRepository extends JpaRepository<Account, String> {

    List<Account> findTop20ByUsernameStartingWithAndUsernameNotOrderByUsername(String prefix, String exclude);
}
