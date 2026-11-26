const initials = (name = '') => name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || '?'

export default function Avatar({ name, username, size = '' }) {
  const hues = [248, 202, 328, 164, 28, 275]
  const hue = [...(username || name || 'orbit')].reduce((sum, char) => sum + char.charCodeAt(0), 0) % hues.length
  return <div className={`avatar ${size}`} style={{ '--avatar-hue': hues[hue] }} aria-label={name}>{initials(name)}</div>
}
