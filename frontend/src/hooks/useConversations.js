import { useCallback, useEffect, useState } from "react";
import { chatService } from "../services/chat";
import { groupService } from "../services/group";

function normalize(direct, groups) {
  return [
    ...direct.map((item) => ({ ...item, type: "DIRECT", id: `dm:${item.person.username}`, title: item.person.displayName, peerUsername: item.person.username })),
    ...groups.map((group) => ({ type: "GROUP", id: `group:${group.id}`, groupId: group.id, title: group.name, memberCount: group.memberCount, group, chatMessage: group.lastMessage })),
  ];
}

export function normalizeConversation(selection) {
  return selection.type === "GROUP"
    ? selection
    : { ...selection, type: "DIRECT", id: `dm:${selection.username}`, title: selection.displayName, person: selection };
}

export default function useConversations(user, handleError) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState([]);
  const [searching, setSearching] = useState(false);
  const updateSearch = useCallback((value) => {
    setSearch(value);
    setSearching(Boolean(value.trim()));
    if (!value.trim()) setPeople([]);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [direct, groups] = await Promise.all([chatService.conversations(), groupService.list()]);
      setItems(normalize(direct, groups));
    } catch (err) { handleError(err); }
    finally { setLoading(false); }
  }, [user, handleError]);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    Promise.all([chatService.conversations(), groupService.list()])
      .then(([direct, groups]) => alive && setItems(normalize(direct, groups)))
      .catch((err) => alive && handleError(err))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [user, handleError]);

  useEffect(() => {
    const query = search.trim();
    if (!query) return undefined;
    let alive = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      chatService.searchUsers(query)
        .then((result) => alive && setPeople(result))
        .catch((err) => alive && handleError(err))
        .finally(() => alive && setSearching(false));
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [search, user, handleError]);

  const receiveMessage = useCallback((event) => {
    if (event.type === "GROUP_MESSAGE") {
      const { groupId, message } = event;
      setItems((current) => current.map((item) => item.type === "GROUP" && String(item.groupId) === String(groupId)
        ? { ...item, chatMessage: message, group: { ...item.group, lastMessage: message } }
        : item));
      return;
    }
    const peer = event.sender === user?.username ? event.recipient : event.sender;
    void refresh();
    setItems((current) => {
      const found = current.find((item) => item.type === "DIRECT" && item.person.username === peer);
      if (!found) return current;
      return [{ ...found, chatMessage: event }, ...current.filter((item) => item.id !== found.id)];
    });
  }, [refresh, user]);

  const addGroup = useCallback((group) => {
    const [normalized] = normalize([], [group]);
    setItems((current) => [normalized, ...current.filter((item) => item.id !== normalized.id)]);
    return normalized;
  }, []);

  const updatePreview = useCallback((conversationId, message) => {
    setItems((current) => current.map((item) => item.id === conversationId
      ? { ...item, chatMessage: message, group: item.group ? { ...item.group, lastMessage: message } : item.group }
      : item));
  }, []);

  return { items, setItems, loading, refresh, search, setSearch, updateSearch, people, searching, receiveMessage, addGroup, updatePreview };
}
