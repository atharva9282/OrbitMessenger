import { useEffect, useRef, useState } from "react";
import Avatar from "../common/Avatar";

export default function CreateGroupModal({ onClose, onCreate, onSearchUsers }) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  useEffect(() => {
    if (!query.trim()) {
      return undefined;
    }
    let alive = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      onSearchUsers(query.trim())
        .then((users) => alive && setResults(users))
        .catch((err) => alive && setError(err.message || "User search failed."))
        .finally(() => alive && setSearching(false));
    }, 220);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, onSearchUsers]);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current || loading) return;
    if (!name.trim()) return setError("Enter a group name.");
    if (!selected.length) return setError("Select at least one member.");
    setLoading(true);
    submitting.current = true;
    setError("");
    try {
      await onCreate(
        name.trim(),
        selected.map((user) => user.username),
      );
    } catch (err) {
      setError(err.message || "Could not create the group.");
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div
      className="group-overlay"
      role="presentation"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !loading && onClose()
      }
    >
      <form
        className="group-modal"
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
      >
        <header>
          <div>
            <span className="eyebrow">A SPACE FOR EVERYONE</span>
            <h2 id="create-group-title">Create a group</h2>
          </div>
          <button
            type="button"
            className="group-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <label className="group-field">
          Group name
          <input
            autoFocus
            maxLength="60"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Development Team"
          />
        </label>
        <label className="group-field">
          Find members
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by username"
          />
        </label>
        {selected.length > 0 && (
          <div className="selected-members">
            {selected.map((user) => (
              <button
                type="button"
                className="member-chip"
                key={user.username}
                onClick={() =>
                  setSelected((items) =>
                    items.filter((item) => item.username !== user.username),
                  )
                }
              >
                {user.displayName} <span>×</span>
              </button>
            ))}
          </div>
        )}
        {query.trim() && (
          <div className="group-user-results">
            {searching ? (
              <span className="group-muted">Searching…</span>
            ) : (
              results
                .filter(
                  (user) =>
                    !selected.some((item) => item.username === user.username),
                )
                .map((user) => (
                  <button
                    type="button"
                    key={user.username}
                    onClick={() => {
                      setSelected((items) => [...items, user]);
                      setQuery("");
                      setResults([]);
                      setError("");
                    }}
                  >
                    <Avatar
                      name={user.displayName}
                      username={user.username}
                      size="avatar-small"
                    />
                    <span>
                      <strong>{user.displayName}</strong>
                      <small>@{user.username}</small>
                    </span>
                    <i>＋</i>
                  </button>
                ))
            )}
          </div>
        )}
        {error && (
          <p className="group-error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button
            type="button"
            className="group-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={loading || !name.trim() || !selected.length}
          >
            {loading ? (
              <>
                <span className="spinner" /> Creating…
              </>
            ) : (
              "Create group"
            )}
          </button>
        </footer>
      </form>
    </div>
  );
}
