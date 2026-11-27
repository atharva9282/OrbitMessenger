package com.chat.backend.websocket;

import com.chat.backend.dto.GroupMessageEvent;
import com.chat.backend.dto.GroupMessageResponse;
import com.chat.backend.entity.ChatMessage;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class LiveUpdates extends TextWebSocketHandler {

    private final ConcurrentMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper mapper;

    public LiveUpdates(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        if(session.getPrincipal()==null){
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        sessions.put(session.getId(), new ConcurrentWebSocketSessionDecorator(session, 5000, 65536));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session.getId());
    }

    public void publish(ChatMessage message)
    {
        var payload = new TextMessage(mapper.writeValueAsString(message));
        sessions.forEach((id, session) -> {
            if(!validSession(session)){
                sessions.remove(id);
                try {
                    session.close(CloseStatus.POLICY_VIOLATION);
                } catch (IOException e) {}
                return;
            }
            var name = session.getPrincipal().getName();
            if(name.equals(message.sender) || name.equals(message.recipient))
            {
                try {
                    session.sendMessage(payload);
                } catch (IOException e) {
                    sessions.remove(id);
                    try {
                        session.close();
                    } catch (IOException er) {}
                }
            }
        });

    }

    public void publishGroup(Long groupId, GroupMessageResponse message, Set<String> memberUsernames)
    {
        GroupMessageEvent event = new GroupMessageEvent("GROUP_MESSAGE", groupId, message);

        var payload = new TextMessage(mapper.writeValueAsString(event));

        sessions.forEach((id, session)->{
                    if(!validSession(session)){
                        sessions.remove(id);
                        try{
                            session.close(CloseStatus.POLICY_VIOLATION);
                        } catch (IOException e) {}

                        return;
                    }

                    var principal = session.getPrincipal();
                    if (principal == null || !memberUsernames.contains(principal.getName())) {
                        return;
                    }

                    try {
                        session.sendMessage(payload);
                    } catch (IOException e) {
                        sessions.remove(id);
                        try {
                            session.close();
                        } catch (IOException ignored) {}
                    }


                });
    }

    public boolean validSession(WebSocketSession socketSession)
    {
        try{
            var session = (HttpSession) socketSession.getAttributes().get("httpSession");
            return session!=null && (session.getMaxInactiveInterval()<=0 ||
                    System.currentTimeMillis() - session.getLastAccessedTime() < session.getMaxInactiveInterval()*1000L);
        }
        catch (IllegalStateException e)
        {
            return false;
        }
    }

    public void closeUser(String username)
    {
        sessions.forEach((id, session) -> {
            if(session.getPrincipal().getName().equals(username)){
                sessions.remove(id);
                try {
                    session.close(CloseStatus.NORMAL);
                } catch (IOException e) {}
            }
        });
    }
}
