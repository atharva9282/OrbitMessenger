package com.chat.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class ApiErrors {

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> status(ResponseStatusException e)
    {
        return ResponseEntity.status(e.getStatusCode())
                .body(Map.of("error: ", e.getMessage() == null ? "Request failed" : e.getReason()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> conflict()
    {
        return ResponseEntity.status(409)
                .body(Map.of("error: ", "That username is already taken"));
    }

}
