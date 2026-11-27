import { useEffect, useState } from "react";
import Avatar from "../common/Avatar";

const dateLabel = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date)
    : "—";
};

export default function GroupDetails({ groupId, onClose, getDetails, getMembers }) {
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const invalidId = groupId == null || !Number.isFinite(Number(groupId));
  const creator = members.find((member) => member.username === group?.createdBy);
  useEffect(() => {
    if (invalidId) return undefined;
    let alive = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    Promise.all([getDetails(groupId), getMembers(groupId)])
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
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [groupId, getDetails, getMembers, attempt, invalidId, onClose]);
  const retry = () => { setGroup(null); setMembers([]); setError(""); setAttempt((value) => value + 1); };
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
        {error || invalidId ? (
          <div className="group-error-state" role="alert"><p>{invalidId ? "This group could not be identified." : error}</p><button className="group-secondary" onClick={retry} disabled={invalidId}>Try again</button></div>
        ) : !group ? (
          <div className="group-details-loading" aria-label="Loading group details"><i/><i/><i/><i/></div>
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
                <span>{members.length} members</span>
              </div>
            </div>
            <div className="group-facts">
              <span>Created by</span>
              <strong>{creator ? `${creator.displayName} (@${creator.username})` : group.createdBy}</strong>
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
