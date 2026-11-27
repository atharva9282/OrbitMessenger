import Avatar from "../common/Avatar";

const timeLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
};

function ConversationRow({ item, ownUsername, selected, onSelect }) {
  const isGroup = item.type === "GROUP";
  const sender = item.chatMessage?.senderDisplayName || item.chatMessage?.sender;
  return (
    <button
      className={`conversation-row ${isGroup ? "group-row" : ""} ${selected ? "active" : ""}`}
      onClick={() => onSelect(isGroup ? item : item.person)}
    >
      <Avatar name={isGroup ? item.title : item.person.displayName} username={isGroup ? `group-${item.groupId}` : item.person.username} />
      <span className="conversation-copy">
        <span className="conversation-name">{item.title || item.person.displayName}{isGroup && <small className="group-count">{item.memberCount} members</small>}</span>
        <span className="conversation-preview">
          {item.chatMessage ? `${isGroup && sender ? `${sender}: ` : ""}${item.chatMessage.body}` : "Start a conversation"}
        </span>
      </span>
      <span className="conversation-meta">
        <time>{timeLabel(item.chatMessage?.sentAt)}</time>
        {!isGroup && item.chatMessage?.sender === ownUsername && (
          <span className="message-check">✓</span>
        )}
      </span>
    </button>
  );
}

export default function InboxPane({
  person,
  conversations,
  filter = "ALL",
  onFilter = () => {},
  active,
  search,
  onSearch,
  showSearch,
  onShowSearch,
  people,
  searching,
  onSelectPerson,
  onRefresh,
  loading,
  onFind,
  onCreateGroup,
  connection,
  connectionLabel,
  className = "",
}) {
  const filtered = conversations.filter((item) => (filter === "ALL" || item.type === filter) && `${item.title || item.person?.displayName || ""} ${item.person?.username || ""} ${item.chatMessage?.body || ""}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => new Date(b.chatMessage?.sentAt || b.group?.createdAt || 0) - new Date(a.chatMessage?.sentAt || a.group?.createdAt || 0));
  return (
    <section className={`inbox-pane ${className}`}>
      <div className="inbox-top">
        <div className="inbox-title-row">
          <div>
            <div className="eyebrow">YOUR MESSAGES</div>
            <h1>
              Inbox<span className="title-period">.</span>
            </h1>
          </div>
          <button
            className="icon-button compose-action"
            title="Find people"
            aria-label="Find people"
            onClick={onFind}
          >
            ＋
          </button>
          <button className="create-group-action" onClick={onCreateGroup}>＋ <span>Create group</span></button>
        </div>
        <div className="user-greeting">
          <Avatar
            name={person.displayName}
            username={person.username}
            size="avatar-tiny"
          />
          <span>
            Here for you, <strong>{person.displayName.split(" ")[0]}</strong>
          </span>
          <span className="live-dot" />
        </div>
        <div className="search-wrap">
          <span className="search-glyph">⌕</span>
          <input
            className="search-input"
            aria-label="Search chats or people"
            placeholder="Search conversations or people"
            value={search}
            onFocus={onShowSearch}
            onChange={(event) => onSearch(event.target.value)}
          />
          {search && (
            <button
              className="clear-search"
              aria-label="Clear search"
              onClick={() => {
                onSearch("");
                onShowSearch(false);
              }}
            >
              ×
            </button>
          )}
        </div>
        {showSearch && search.trim() && (
          <div className="search-results">
            <div className="section-label">PEOPLE</div>
            {searching ? (
              <div className="search-note">
                <span className="spinner spinner-dark" /> Looking around…
              </div>
            ) : people.length ? (
              people.map((found) => (
                <button
                  className="person-result"
                  key={found.username}
                  onClick={() => onSelectPerson(found)}
                >
                  <Avatar
                    name={found.displayName}
                    username={found.username}
                    size="avatar-small"
                  />
                  <span>
                    <strong>{found.displayName}</strong>
                    <small>@{found.username}</small>
                  </span>
                  <span className="result-arrow">↗</span>
                </button>
              ))
            ) : (
              <div className="search-note">
                No people found for that username.
              </div>
            )}
          </div>
        )}
      </div>
      <div className="conversation-section">
        <div className="conversation-filters">{["ALL", "DIRECT", "GROUP"].map((value) => <button key={value} className={filter === value ? "selected" : ""} onClick={() => onFilter(value)}>{value === "ALL" ? "All" : value === "DIRECT" ? "Direct" : "Groups"}</button>)}</div>
        <div className="list-heading">
          <span className="section-label">RECENT</span>
          <button onClick={onRefresh} title="Refresh conversations">
            ↻
          </button>
        </div>
        {loading && !conversations.length ? (
          <div className="conversation-skeletons">
            {[1, 2, 3, 4].map((n) => (
              <div className="skeleton-row" key={n}>
                <i />
                <span>
                  <i />
                  <i />
                </span>
              </div>
            ))}
          </div>
        ) : filtered.length ? (
          filtered.map((item) => (
            <ConversationRow
              key={item.id || item.person.username}
              item={item}
              ownUsername={person.username}
              selected={active?.id === item.id || (active?.type === "DIRECT" && item.type === "DIRECT" && active?.person?.username === item.person.username)}
              onSelect={onSelectPerson}
            />
          ))
        ) : (
          <div className="inbox-empty">
            <div className="empty-mini">✳</div>
            <strong>
              {search ? "No conversations match" : "A fresh beginning"}
            </strong>
            <p>
              {search
                ? "Try searching for a username above."
                : "Conversations with people you find will show up here."}
            </p>
            <button onClick={onFind}>
              Find people <span>↗</span>
            </button>
          </div>
        )}
      </div>
      <footer className="inbox-footer">
        <span className={`connection-indicator ${connection}`}>
          <i />
          {connectionLabel}
        </span>
        <span>Orbit · personal space</span>
      </footer>
    </section>
  );
}
