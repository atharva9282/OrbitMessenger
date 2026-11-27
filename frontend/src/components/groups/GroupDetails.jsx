import { useEffect, useState } from "react";
import Avatar from "../common/Avatar";

const dateLabel = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(
        new Date(value),
      )
    : "—";

export default function GroupDetails({ groupId, onClose, getDetails }) {
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    Promise.all([getDetails(groupId), getDetails(groupId, true)])
      .then(([details, list]) => {
        if (alive) {
          setGroup(details);
          setMembers(list);
        }
      })
      .catch(
        (err) =>
          alive &&
          setError(err.message || "Group details could not be loaded."),
      );
    return () => {
      alive = false;
    };
  }, [groupId, getDetails]);
  return (
    <div
      className="group-overlay"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="group-modal group-details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-details-title"
      >
        <header>
          <div>
            <span className="eyebrow">GROUP INFORMATION</span>
            <h2 id="group-details-title">Details</h2>
          </div>
          <button className="group-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {error ? (
          <p className="group-error" role="alert">
            {error}
          </p>
        ) : !group ? (
          <div className="group-muted">Loading group details…</div>
        ) : (
          <>
            <div className="group-detail-hero">
              <Avatar
                name={group.name}
                username={`group-${group.id}`}
                size="avatar-large"
              />
              <div>
                <strong>{group.name}</strong>
                <span>{members.length || group.memberCount} members</span>
              </div>
            </div>
            <div className="group-facts">
              <span>Created by</span>
              <strong>{group.createdBy}</strong>
              <span>Created</span>
              <strong>{dateLabel(group.createdAt)}</strong>
            </div>
            <div className="group-member-heading">
              Members <span>{members.length}</span>
            </div>
            <div className="group-member-list">
              {members.map((member) => (
                <div className="group-member" key={member.username}>
                  <Avatar
                    name={member.displayName}
                    username={member.username}
                    size="avatar-small"
                  />
                  <span>
                    <strong>{member.displayName}</strong>
                    <small>@{member.username}</small>
                  </span>
                  <em>{member.role}</em>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
