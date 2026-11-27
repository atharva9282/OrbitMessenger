import { useCallback, useEffect, useRef, useState } from "react";
import { api, websocketUrl, logout } from "./api";
import { chatService } from "./services/chat";
import { groupService } from "./services/group";
import AuthScreen from "./components/auth/AuthScreen";
import Brand from "./components/common/Brand";
import Sidebar from "./components/layout/Sidebar";
import InboxPane from "./components/conversations/InboxPane";
import ChatWindow from "./components/chat/ChatWindow";
import CreateGroupModal from "./components/groups/CreateGroupModal";
import GroupDetails from "./components/groups/GroupDetails";
import "./App.css";
import "./theme.css";

function appendUnique(messages, incoming) {
  if (messages.some((message) => String(message.id) === String(incoming.id))) return messages;
  return [...messages, incoming].sort((a, b) => Number(a.id) - Number(b.id));
}

export default function App() {
  const [me, setMe] = useState(undefined);
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [canLoadOlder, setCanLoadOlder] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [error, setError] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connection, setConnection] = useState("connecting");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [detailsGroupId, setDetailsGroupId] = useState(null);
  const activeRef = useRef(null);
  const requestRef = useRef(0);

  const handleAuthError = useCallback((err) => {
    if (err.status === 401) {
      activeRef.current = null;
      setMe(null);
      setActive(null);
      setMessages([]);
    } else setError(err.message || "Something went wrong.");
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const [direct, groups] = await Promise.all([chatService.conversations(), groupService.list()]);
      setConversations([
        ...direct.map((item) => ({ ...item, type: "DIRECT", id: `dm:${item.person.username}`, title: item.person.displayName, peerUsername: item.person.username })),
        ...groups.map((group) => ({ type: "GROUP", id: `group:${group.id}`, groupId: group.id, title: group.name, memberCount: group.memberCount, group, chatMessage: group.lastMessage })),
      ]);
      setError("");
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoadingConversations(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    let mounted = true;
    api("/api/me")
      .then((person) => {
        if (mounted) setMe(person);
      })
      .catch((err) => {
        if (mounted) {
          if (err.status === 401) setMe(null);
          else {
            setError(err.message);
            setMe(null);
          }
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!me) return undefined;
    let mounted = true;
    Promise.all([chatService.conversations(), groupService.list()])
      .then(([items, groups]) => {
        if (mounted) {
          setConversations([
            ...items.map((item) => ({ ...item, type: "DIRECT", id: `dm:${item.person.username}`, title: item.person.displayName, peerUsername: item.person.username })),
            ...groups.map((group) => ({ type: "GROUP", id: `group:${group.id}`, groupId: group.id, title: group.name, memberCount: group.memberCount, group, chatMessage: group.lastMessage })),
          ]);
          setError("");
        }
      })
      .catch((err) => {
        if (mounted) handleAuthError(err);
      })
      .finally(() => {
        if (mounted) setLoadingConversations(false);
      });
    return () => {
      mounted = false;
    };
  }, [me, handleAuthError]);

  useEffect(() => {
    if (!me) return undefined;
    let stopped = false;
    let reconnectTimer;
    let socket;
    const connect = () => {
      if (stopped) return;
      setConnection("connecting");
      socket = new WebSocket(websocketUrl());
      socket.onopen = () => setConnection("online");
      socket.onmessage = (event) => {
        try {
          const incoming = JSON.parse(event.data);
          if (incoming.type === "GROUP_MESSAGE") {
            const groupMessage = incoming.message;
            setConversations((current) => current.map((item) => item.type === "GROUP" && String(item.groupId) === String(incoming.groupId)
              ? { ...item, chatMessage: groupMessage, group: { ...item.group, lastMessage: groupMessage } }
              : item));
            if (activeRef.current?.type === "GROUP" && String(activeRef.current.groupId) === String(incoming.groupId))
              setMessages((current) => appendUnique(current, groupMessage));
            return;
          }
          const peer =
            incoming.sender === me.username
              ? incoming.recipient
              : incoming.sender;
          void loadConversations();
          setConversations((current) => {
            const found = current.find((item) => item.type === "DIRECT" && item.person.username === peer);
            if (found)
              return [
                { ...found, chatMessage: incoming },
                ...current.filter((item) => item.type !== "DIRECT" || item.person.username !== peer),
              ];
            return current;
          });
          if (activeRef.current?.type === "DIRECT" && (
            [incoming.sender, incoming.recipient].includes(
              activeRef.current?.person?.username,
            )
          )) {
            setMessages((current) => appendUnique(current, incoming));
          }
        } catch {
          setError("Received a message the app could not read.");
        }
      };
      socket.onclose = () => {
        setConnection("offline");
        if (!stopped) reconnectTimer = window.setTimeout(connect, 2500);
      };
      socket.onerror = () => socket.close();
    };
    connect();
    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [me, loadConversations]);

  useEffect(() => {
    const query = search.trim();
    if (!me || query.length < 1) return undefined;
    let alive = true;
    const timer = window.setTimeout(
      () =>
        chatService
          .searchUsers(query)
          .then((result) => {
            if (alive) setPeople(result);
          })
          .catch(handleAuthError)
          .finally(() => {
            if (alive) setSearching(false);
          }),
      250,
    );
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [search, me, handleAuthError]);

  const openPerson = async (selection) => {
    const requestId = ++requestRef.current;
    const conversation = selection.type === "GROUP" ? selection : { ...selection, type: "DIRECT", id: `dm:${selection.username}`, title: selection.displayName, person: selection };
    activeRef.current = conversation;
    setActive(conversation);
    setMobileChat(true);
    setShowSearch(false);
    setSearch("");
    setPeople([]);
    setLoadingMessages(true);
    setCanLoadOlder(true);
    setMessages([]);
    setSendError("");
    try {
      const history = conversation.type === "GROUP" ? await groupService.history(conversation.groupId) : await chatService.history(conversation.person.username);
      if (requestRef.current === requestId) setMessages(history);
    } catch (err) {
      handleAuthError(err);
    } finally {
      if (requestRef.current === requestId)
        setLoadingMessages(false);
    }
  };

  const sendMessage = async (body) => {
    if (!active || sending) return false;
    const selectionId = active.id;
    setSending(true);
    setSendError("");
    try {
      const savedMessage = active.type === "GROUP" ? await groupService.send(active.groupId, body) : await chatService.send(active.person.username, body);
      if (activeRef.current?.id === selectionId)
        setMessages((current) => appendUnique(current, savedMessage));
      setConversations((current) => current.map((item) => item.id === selectionId ? { ...item, chatMessage: savedMessage, group: item.group ? { ...item.group, lastMessage: savedMessage } : item.group } : item));
      return true;
    } catch (err) {
      if (err.status === 401) handleAuthError(err);
      else
        setSendError(
          err.message || "Message could not be sent. Please try again.",
        );
      return false;
    } finally {
      setSending(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!active || loadingOlder || !messages.length) return;
    const selection = active;
    const requestId = requestRef.current;
    setLoadingOlder(true);
    try {
      const oldestId = messages[0].id;
      const older = selection.type === "GROUP"
        ? await groupService.history(selection.groupId, oldestId)
        : await chatService.history(selection.person.username, oldestId);
      if (requestRef.current === requestId && activeRef.current?.id === selection.id) {
        setMessages((current) => [...older.filter((message) => !current.some((item) => String(item.id) === String(message.id))), ...current]);
        if (older.length < 50) setCanLoadOlder(false);
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoadingOlder(false);
    }
  };

  const findPerson = () => {
    setShowSearch(true);
    document.querySelector(".search-input")?.focus();
  };
  const updateSearch = (value) => {
    setSearch(value);
    setSearching(Boolean(value.trim()));
    if (!value.trim()) setPeople([]);
  };
  const onLogout = async () => {
    try {
      await logout();
    } catch {
      /* Clear local identity if the server session already expired. */
    }
    activeRef.current = null;
    requestRef.current += 1;
    setMe(null);
    setActive(null);
    setMessages([]);
    setConversations([]);
  };
  const connectionLabel =
    connection === "online"
      ? "Live connection"
      : connection === "connecting"
        ? "Connecting…"
        : "Reconnecting…";

  const createGroup = async (name, usernames) => {
    const group = await groupService.create(name, usernames);
    const normalized = { type: "GROUP", id: `group:${group.id}`, groupId: group.id, title: group.name, memberCount: group.memberCount, group, chatMessage: group.lastMessage };
    setConversations((items) => [normalized, ...items.filter((item) => item.id !== normalized.id)]);
    setShowCreateGroup(false);
    setError("Group created successfully.");
    await openPerson(normalized);
    return group;
  };

  if (me === undefined)
    return (
      <div className="boot-screen">
        <Brand />
        <span className="spinner" />
      </div>
    );
  if (!me)
    return (
      <AuthScreen
        onAuthenticated={(person) => {
          setMe(person);
          setLoadingConversations(true);
        }}
      />
    );

  return (
    <main className={`app-shell ${mobileChat ? "mobile-chat-open" : ""}`}>
      <Sidebar
        person={me}
        onLogout={onLogout}
        onFind={findPerson}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
      />
      <InboxPane
        person={me}
        conversations={conversations}
        filter={filter}
        onFilter={setFilter}
        active={active}
        search={search}
        onSearch={updateSearch}
        showSearch={showSearch}
        onShowSearch={() => setShowSearch(true)}
        people={people}
        searching={searching}
        onSelectPerson={openPerson}
        onCreateGroup={() => setShowCreateGroup(true)}
        onRefresh={loadConversations}
        loading={loadingConversations}
        onFind={findPerson}
        onGroupDetails={setDetailsGroupId}
        connection={connection}
        connectionLabel={connectionLabel}
        className={mobileChat ? "mobile-hidden" : ""}
      />
      <ChatWindow
        className={mobileChat ? "mobile-visible" : ""}
        active={active}
        me={me}
        messages={messages}
        loading={loadingMessages}
        loadingOlder={loadingOlder}
        canLoadOlder={canLoadOlder}
        sending={sending}
        sendError={sendError}
        onSend={sendMessage}
        onLoadOlder={loadOlderMessages}
        onBack={() => setMobileChat(false)}
        connection={connection}
        onFind={findPerson}
        onGroupDetails={setDetailsGroupId}
      />
      {error && (
        <div className={`toast ${error === "Group created successfully." ? "toast-success" : ""}`} role="status">
          <span>{error === "Group created successfully." ? "✓" : "!"}</span>
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreate={createGroup} onSearchUsers={chatService.searchUsers} />}
      {detailsGroupId != null && <GroupDetails groupId={detailsGroupId} onClose={() => setDetailsGroupId(null)} getDetails={(id, members) => members ? groupService.members(id) : groupService.details(id)} />}
    </main>
  );
}
