import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Avatar from "../common/Avatar";

const timeLabel = (value) => {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
};
const fullDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
};

function EmptyChat({ onFind, group = false }) {
  return (
    <div className="empty-chat">
      <div className="empty-illustration">
        <div className="empty-orbit orbit-a" />
        <div className="empty-orbit orbit-b" />
        <div className="empty-center">o</div>
        <span className="empty-star star-a">✳</span>
        <span className="empty-star star-b">✦</span>
      </div>
      <span className="eyebrow">YOUR SPACE, YOUR PACE</span>
      <h2>
        Every good conversation
        <br />
        starts somewhere.
      </h2>
      <p>
        {group
          ? "Your group is ready. Send the first message to get the conversation going."
          : "Find someone by username and bring them into your orbit."}
      </p>
      {!group && (
        <button className="primary-button" onClick={onFind}>
          Find someone <span>↗</span>
        </button>
      )}
    </div>
  );
}

function MessageList({
  messages,
  ownUsername,
  loading,
  loadingOlder,
  canLoadOlder,
  onLoadOlder,
  onFind,
  group,
}) {
  const endRef = useRef(null);
  const messageEdges = useRef({ first: null, last: null, height: 0 });
  useLayoutEffect(() => {
    if (loading || !messages.length) return;
    const first = String(messages[0].id);
    const last = String(messages[messages.length - 1].id);
    const container = endRef.current?.closest(".message-scroll");
    const old = messageEdges.current;
    if (
      old.last === last &&
      old.first !== null &&
      old.first !== first &&
      container
    ) {
      container.scrollTop += container.scrollHeight - old.height;
    } else if (old.last !== last) {
      endRef.current?.scrollIntoView({
        behavior: old.last === null ? "auto" : "smooth",
        block: "end",
      });
    }
    messageEdges.current = {
      first,
      last,
      height: container?.scrollHeight || 0,
    };
  }, [messages, loading]);
  useEffect(() => {
    if (!group || !import.meta.env.DEV || window.localStorage.getItem("orbit:debug-group-messages") !== "1") return;
    console.debug("[Orbit group rendering]", {
      authenticatedUsername: ownUsername,
      rows: messages.slice(0, 5).map((message) => {
        const sender = typeof message.sender === "string" ? message.sender.trim() : String(message.sender?.username ?? message.senderUsername ?? "").trim();
        return { id: message.id, sender: message.sender, senderType: typeof message.sender, own: Boolean(sender && String(ownUsername ?? "").trim() && sender === String(ownUsername).trim()), keys: Object.keys(message) };
      }),
    });
  }, [group, messages, ownUsername]);
  if (loading)
    return (
      <div className="message-loading">
        <span className="spinner spinner-dark" /> Finding your conversation…
      </div>
    );
  if (!messages.length) return <EmptyChat onFind={onFind} group={group} />;
  return (
    <div className="message-list">
      {canLoadOlder && messages.length >= 50 && (
        <button
          className="load-older-button"
          onClick={onLoadOlder}
          disabled={loadingOlder}
        >
          {loadingOlder ? "Loading…" : "Load older messages"}
        </button>
      )}
      {messages.map((message, index) => {
        const senderUsername = typeof message.sender === "string"
          ? message.sender.trim()
          : String(message.sender?.username ?? message.senderUsername ?? "").trim();
        const own = Boolean(senderUsername && String(ownUsername ?? "").trim() && senderUsername === String(ownUsername).trim());
        const previous = messages[index - 1];
        const showDate =
          !previous || fullDate(previous.sentAt) !== fullDate(message.sentAt);

        const isNewSenderGroup =
          !previous || String(previous.sender?.username ?? previous.sender ?? previous.senderUsername ?? "").trim() !== senderUsername || showDate;

        return (
          <div className="message-row" key={message.id}>
            {showDate && (
              <div className="date-divider">
                <span>{fullDate(message.sentAt)}</span>
              </div>
            )}
            {group && isNewSenderGroup && (
              <div className={`group-sender ${own ? "group-sender-own" : ""}`}>
                {own ? "You" : message.senderDisplayName || message.sender}
              </div>
            )}
            <article
              className={`message ${own ? "message-own" : "message-in"}`}
            >
              <div className="message-bubble">
                {message.body}
                <time>{timeLabel(message.sentAt)}</time>
              </div>
            </article>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

function MessageComposer({ onSend, sending, error }) {
  const [body, setBody] = useState("");
  const inputRef = useRef(null);
  const submit = async (event) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    const sent = await onSend(text);
    if (sent) {
      setBody("");
      inputRef.current?.focus();
    }
  };
  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };
  return (
    <div className="composer-area">
      <form className="message-composer" onSubmit={submit}>
        <textarea
          ref={inputRef}
          rows="1"
          maxLength="4000"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a message…"
          aria-label="Write a message"
        />
        <button
          className="send-button"
          type="submit"
          disabled={sending || !body.trim()}
          aria-label="Send message"
        >
          {sending ? <span className="spinner" /> : "↑"}
        </button>
      </form>
      {error && (
        <div className="composer-error" role="alert">
          {error}
        </div>
      )}
      <div className="composer-caption">
        Enter to send · Shift + Enter for a new line
      </div>
    </div>
  );
}

export default function ChatWindow({
  active,
  me,
  messages,
  loading,
  loadingOlder,
  canLoadOlder,
  sending,
  sendError,
  onSend,
  onLoadOlder,
  onBack,
  connection,
  onFind,
  onGroupDetails,
  className = "",
}) {
  if (!active)
    return (
      <section className={`chat-pane ${className}`}>
        <div className="welcome-pane">
          <div className="welcome-top">
            <span className="welcome-date">A QUIETER KIND OF CONNECTION</span>
            <span className={`connection-indicator ${connection}`}>
              <i />
              {connection === "online"
                ? "Live connection"
                : connection === "connecting"
                  ? "Connecting…"
                  : "Reconnecting…"}
            </span>
          </div>
          <div className="welcome-center">
            <div className="welcome-art">
              <div className="welcome-loop loop-one" />
              <div className="welcome-loop loop-two" />
              <div className="welcome-loop loop-three" />
              <div className="welcome-monogram">o</div>
              <span className="welcome-dot dot-one" />
              <span className="welcome-dot dot-two" />
              <span className="welcome-dot dot-three" />
            </div>
            <span className="eyebrow">WELCOME TO YOUR ORBIT</span>
            <h2>
              A little less noise.
              <br />A lot more <em>meaning.</em>
            </h2>
            <p>
              Your conversations are waiting to happen.
              <br />
              Search for someone to get started.
            </p>
            <button className="primary-button" onClick={onFind}>
              Find someone <span>↗</span>
            </button>
          </div>
          <div className="welcome-footer">
            <span>YOUR SPACE, YOUR PACE</span>
            <span>01 — 01</span>
          </div>
        </div>
      </section>
    );
  return (
    <section className={`chat-pane ${className}`}>
      <header className="chat-header">
        <button
          className="back-button"
          onClick={onBack}
          aria-label="Back to inbox"
        >
          ←
        </button>
        <Avatar
          name={
            active.type === "GROUP"
              ? active.title
              : active.person?.displayName || active.displayName
          }
          username={
            active.type === "GROUP"
              ? `group-${active.groupId}`
              : active.person?.username || active.username
          }
        />
        <div className="chat-person">
          <strong>
            {active.type === "GROUP"
              ? active.title
              : active.person?.displayName || active.displayName}
          </strong>
          <span>
            {active.type === "GROUP"
              ? `${active.memberCount} members`
              : `@${active.person?.username || active.username}`}
          </span>
        </div>
        {active.type === "GROUP" && (
          <button
            className="group-details-button"
            onClick={() => onGroupDetails(active.groupId)}
          >
            Details
          </button>
        )}
        <div className="header-status">
          <span
            className={`live-dot ${connection === "online" ? "" : "dim"}`}
          />
          {connection === "online"
            ? "Live connection"
            : connection === "connecting"
              ? "Connecting…"
              : "Reconnecting…"}
        </div>
      </header>
      <div className="thread-meta">
        <span className="thread-line" />
        <span>
          {active.type === "GROUP"
            ? `MESSAGES IN ${active.title.toUpperCase()}`
            : `YOUR CONVERSATION WITH ${(active.person?.displayName || active.displayName).toUpperCase()}`}
        </span>
        <span className="thread-line" />
      </div>
      <div className="message-scroll">
        <MessageList
          key={active.id}
          messages={messages}
          ownUsername={me.username}
          loading={loading}
          onFind={onFind}
          group={active.type === "GROUP" || active.groupId != null || String(active.id || "").startsWith("group:")}
          loadingOlder={loadingOlder}
          canLoadOlder={canLoadOlder}
          onLoadOlder={onLoadOlder}
        />
      </div>
      <MessageComposer
        key={active.id || active.username}
        onSend={onSend}
        sending={sending}
        error={sendError}
      />
    </section>
  );
}
