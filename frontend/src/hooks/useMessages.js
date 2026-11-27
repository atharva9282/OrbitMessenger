import { useCallback, useRef, useState } from "react";
import { chatService } from "../services/chat";
import { groupService } from "../services/group";

function mergeMessages(first, second) {
  const unique = new Map();
  [...first, ...second].forEach((message) => unique.set(String(message.id), message));
  return [...unique.values()].sort((a, b) => Number(a.id) - Number(b.id));
}

export default function useMessages(handleError, updatePreview) {
  const [active, setActive] = useState(null);
  const activeRef = useRef(null);
  const requestRef = useRef(0);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [canLoadOlder, setCanLoadOlder] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const open = useCallback(async (conversation) => {
    const normalized = conversation.type === "DIRECT" || conversation.type === "GROUP"
      ? conversation
      : { ...conversation, type: "DIRECT", id: `dm:${conversation.username}`, title: conversation.displayName, person: conversation };
    const requestId = ++requestRef.current;
    activeRef.current = normalized;
    setActive(normalized);
    setMessages([]);
    setError("");
    setCanLoadOlder(true);
    setLoading(true);
    try {
      const history = normalized.type === "GROUP"
        ? await groupService.history(normalized.groupId)
        : await chatService.history(normalized.person.username);
      if (requestRef.current === requestId) setMessages((current) => mergeMessages(history, current));
    } catch (err) { handleError(err); }
    finally { if (requestRef.current === requestId) setLoading(false); }
  }, [handleError]);

  const receiveMessage = useCallback((message, groupId) => {
    const current = activeRef.current;
    if (!current) return;
    const matches = current.type === "GROUP"
      ? String(current.groupId) === String(groupId)
      : [message.sender, message.recipient].includes(current.person.username);
    if (matches) setMessages((items) => mergeMessages(items, [message]));
  }, []);

  const send = useCallback(async (body) => {
    const conversation = activeRef.current;
    if (!conversation || sending) return false;
    setSending(true);
    setError("");
    try {
      const message = conversation.type === "GROUP"
        ? await groupService.send(conversation.groupId, body)
        : await chatService.send(conversation.person.username, body);
      if (activeRef.current?.id === conversation.id) setMessages((current) => mergeMessages(current, [message]));
      updatePreview(conversation.id, message);
      return true;
    } catch (err) {
      if (err.status === 401) handleError(err);
      else setError(err.message || "Message could not be sent. Please try again.");
      return false;
    } finally { setSending(false); }
  }, [handleError, sending, updatePreview]);

  const loadOlder = useCallback(async () => {
    const conversation = activeRef.current;
    if (!conversation || loadingOlder || !messages.length) return;
    const requestId = requestRef.current;
    setLoadingOlder(true);
    try {
      const before = messages[0].id;
      const older = conversation.type === "GROUP"
        ? await groupService.history(conversation.groupId, before)
        : await chatService.history(conversation.person.username, before);
      if (requestRef.current === requestId && activeRef.current?.id === conversation.id) {
        setMessages((current) => mergeMessages(older, current));
        if (older.length < 50) setCanLoadOlder(false);
      }
    } catch (err) { handleError(err); }
    finally { setLoadingOlder(false); }
  }, [handleError, loadingOlder, messages]);

  const clear = useCallback(() => {
    requestRef.current += 1;
    activeRef.current = null;
    setActive(null);
    setMessages([]);
  }, []);

  return { active, messages, loading, loadingOlder, canLoadOlder, sending, error, open, send, loadOlder, receiveMessage, clear };
}
