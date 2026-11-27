package com.chat.backend.config;

import com.chat.backend.entity.Account;
import com.chat.backend.repo.AccountRepository;
import com.chat.backend.websocket.LiveUpdates;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

@Configuration
public class SecurityConfig {


    @Bean
    PasswordEncoder encoder()
    {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService user(AccountRepository accountRepository)
    {
        return username -> {
            Account account = accountRepository.findById(username)
                    .orElseThrow(()->new UsernameNotFoundException("Invalid Credentials"));
            return User.withUsername(account.getUsername())
                    .password(account.getPasswordHash()).roles("USER")
                    .build();
        };
    }

    @Bean
    public SecurityFilterChain security(HttpSecurity http, LiveUpdates live) throws Exception {
        return http
                .httpBasic(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/csrf", "/api/register", "/api/login", "/error").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .formLogin(f -> f
                        .loginProcessingUrl("/api/login")
                        .successHandler((request, response, authentication) ->
                                response.setStatus(204))
                        .failureHandler((request, response, exception) ->
                                response.setStatus(401)))
                .logout(l -> l
                        .logoutUrl("/api/logout")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            if (authentication != null) {
                                live.closeUser(authentication.getName());
                            }
                            response.setStatus(204);
                        })
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID"))
                .build();
    }



}
