const initials = (name) =>
  (typeof name === "string" ? name.trim() : "")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export default function Avatar({ name, username, size = "" }) {
  const label = typeof name === "string" ? name.trim() : "";
  const identity = typeof username === "string" && username.trim()
    ? username.trim()
    : label || "orbit";
  const hues = [248, 202, 328, 164, 28, 275];
  const hue =
    [...identity].reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0,
    ) % hues.length;
  return (
    <div
      className={`avatar ${size}`}
      style={{ "--avatar-hue": hues[hue] }}
      aria-label={label || "User"}
    >
      {initials(name)}
    </div>
  );
}
