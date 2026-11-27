import { useCallback, useState } from "react";
import Sidebar from "./Sidebar";
import InboxPane from "../conversations/InboxPane";
import ChatWindow from "../chat/ChatWindow";
import CreateGroupModal from "../groups/CreateGroupModal";
import GroupDetails from "../groups/GroupDetails";
import { chatService } from "../../services/chat";
import useConversations, { normalizeConversation } from "../../hooks/useConversations";
import useMessages from "../../hooks/useMessages";
import useWebSocket from "../../hooks/useWebSocket";
import useGroup from "../../hooks/useGroup";

export default function AppLayout({ user, onLogout, error, onError, onDismissError }) {
  const [filter, setFilter] = useState("ALL");
  const [showSearch, setShowSearch] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsId, setDetailsId] = useState(null);
  const conversations = useConversations(user, onError);
  const messages = useMessages(onError, conversations.updatePreview);
  const receiveConversationEvent = conversations.receiveMessage;
  const receiveActiveMessage = messages.receiveMessage;
  const setSearch = conversations.setSearch;
  const openMessageConversation = messages.open;
  const { createGroup, getDetails, getMembers } = useGroup();
  const handleSocketEvent = useCallback((event) => {
    receiveConversationEvent(event);
    receiveActiveMessage(event.type === "GROUP_MESSAGE" ? event.message : event, event.groupId);
  }, [receiveConversationEvent, receiveActiveMessage]);
  const connection = useWebSocket(user, handleSocketEvent);

  const findPerson = useCallback(() => {
    setShowSearch(true);
    window.setTimeout(() => document.querySelector(".search-input")?.focus(), 0);
  }, []);
  const closeDetails = useCallback(() => setDetailsId(null), []);

  const openConversation = useCallback(async (selection) => {
    setShowSearch(false);
    setSearch("");
    setMobileChat(true);
    await openMessageConversation(normalizeConversation(selection));
  }, [setSearch, openMessageConversation]);

  const create = async (name, usernames) => {
    try {
      const group = await createGroup(name, usernames);
      const conversation = conversations.addGroup(group);
      setCreateOpen(false);
      onError({ message: "Group created successfully.", success: true });
      await openConversation(conversation);
    } catch (err) {
      onError(err);
      throw err;
    }
  };

  const signOut = async () => {
    messages.clear();
    await onLogout();
  };

  return (
    <main className={`app-shell ${mobileChat ? "mobile-chat-open" : ""}`}>
      <Sidebar person={user} onLogout={signOut} onFind={findPerson} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((value) => !value)} />
      <InboxPane
        person={user} conversations={conversations.items} filter={filter} onFilter={setFilter}
        active={messages.active} search={conversations.search} onSearch={conversations.updateSearch}
        showSearch={showSearch} onShowSearch={() => setShowSearch(true)} people={conversations.people}
        searching={conversations.searching} onSelectPerson={openConversation}
        onCreateGroup={() => setCreateOpen(true)} onRefresh={conversations.refresh}
        loading={conversations.loading} onFind={findPerson} connection={connection}
        connectionLabel={connection === "online" ? "Live connection" : connection === "connecting" ? "Connecting…" : "Reconnecting…"}
        className={mobileChat ? "mobile-hidden" : ""}
      />
      <ChatWindow
        className={mobileChat ? "mobile-visible" : ""} active={messages.active} me={user}
        messages={messages.messages} loading={messages.loading} loadingOlder={messages.loadingOlder}
        canLoadOlder={messages.canLoadOlder} sending={messages.sending} sendError={messages.error}
        onSend={messages.send} onLoadOlder={messages.loadOlder} onBack={() => setMobileChat(false)}
        connection={connection} onFind={findPerson} onGroupDetails={setDetailsId}
      />
      {error && <div className={`toast ${error.success ? "toast-success" : ""}`} role="status"><span>{error.success ? "✓" : "!"}</span>{error.message}<button onClick={onDismissError} aria-label="Dismiss">×</button></div>}
      {createOpen && <CreateGroupModal onClose={() => setCreateOpen(false)} onCreate={create} onSearchUsers={chatService.searchUsers} />}
      {detailsId != null && <GroupDetails key={detailsId} groupId={detailsId} onClose={closeDetails} getDetails={getDetails} getMembers={getMembers} />}
    </main>
  );
}
