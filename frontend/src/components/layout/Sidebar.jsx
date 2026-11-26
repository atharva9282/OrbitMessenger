import Avatar from "../common/Avatar";
import Brand from "../common/Brand";

export default function Sidebar({
  person,
  onLogout,
  onFind,
  menuOpen,
  onToggleMenu,
}) {
  return (
    <aside className="rail">
      <Brand compact />
      <nav className="rail-nav">
        <button
          className="rail-button selected"
          title="Inbox"
          aria-label="Inbox"
        >
          <span className="rail-icon">▤</span>
          <span className="rail-indicator" />
        </button>
        <button
          className="rail-button"
          title="Find people"
          aria-label="Find people"
          onClick={onFind}
        >
          <span className="rail-icon">⌕</span>
        </button>
      </nav>
      <div className="rail-bottom">
        <button
          className="rail-button"
          title="Sign out"
          aria-label="Sign out"
          onClick={onLogout}
        >
          <span className="rail-icon">↪</span>
        </button>
        <button
          className="profile-button"
          title={person.displayName}
          onClick={onToggleMenu}
        >
          <Avatar
            name={person.displayName}
            username={person.username}
            size="avatar-small"
          />
        </button>
        {menuOpen && (
          <div className="profile-menu">
            <strong>{person.displayName}</strong>
            <span>@{person.username}</span>
            <button onClick={onLogout}>Sign out</button>
          </div>
        )}
      </div>
    </aside>
  );
}
