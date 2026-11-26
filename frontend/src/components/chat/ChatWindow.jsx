import { useEffect, useRef, useState } from 'react'
import Avatar from '../common/Avatar'

const timeLabel = value => {
  const date = new Date(value)
  return !value || Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
}
const fullDate = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function EmptyChat({ onFind }) {
  return <div className="empty-chat"><div className="empty-illustration"><div className="empty-orbit orbit-a"/><div className="empty-orbit orbit-b"/><div className="empty-center">o</div><span className="empty-star star-a">✳</span><span className="empty-star star-b">✦</span></div><span className="eyebrow">YOUR SPACE, YOUR PACE</span><h2>Every good conversation<br/>starts somewhere.</h2><p>Find someone by username and bring them into your orbit.</p><button className="primary-button" onClick={onFind}>Find someone <span>↗</span></button></div>
}

function MessageList({ messages, ownUsername, loading, onFind }) {
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, loading])
  if (loading) return <div className="message-loading"><span className="spinner spinner-dark"/> Finding your conversation…</div>
  if (!messages.length) return <EmptyChat onFind={onFind}/>
  return <div className="message-list">{messages.map((message, index) => {
    const own = message.sender === ownUsername
    const previous = messages[index - 1]
    const showDate = !previous || fullDate(previous.sentAt) !== fullDate(message.sentAt)
    return <div key={message.id}>{showDate && <div className="date-divider"><span>{fullDate(message.sentAt)}</span></div>}<article className={`message ${own ? 'message-own' : 'message-in'}`}><div className="message-bubble">{message.body}<time>{timeLabel(message.sentAt)}</time></div></article></div>
  })}<div ref={endRef}/></div>
}

function MessageComposer({ onSend, sending, error }) {
  const [body, setBody] = useState('')
  const inputRef = useRef(null)
  const submit = async event => {
    event.preventDefault()
    const text = body.trim()
    if (!text || sending) return
    const sent = await onSend(text)
    if (sent) { setBody(''); inputRef.current?.focus() }
  }
  const onKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() }
  }
  return <div className="composer-area"><form className="message-composer" onSubmit={submit}><textarea ref={inputRef} rows="1" maxLength="4000" value={body} onChange={event => setBody(event.target.value)} onKeyDown={onKeyDown} placeholder="Write a message…" aria-label="Write a message"/><button className="send-button" type="submit" disabled={sending || !body.trim()} aria-label="Send message">{sending ? <span className="spinner"/> : '↑'}</button></form>{error && <div className="composer-error" role="alert">{error}</div>}<div className="composer-caption">Enter to send · Shift + Enter for a new line</div></div>
}

export default function ChatWindow({ active, me, messages, loading, sending, sendError, onSend, onBack, connection, onFind, className = '' }) {
  if (!active) return <section className={`chat-pane ${className}`}><div className="welcome-pane"><div className="welcome-top"><span className="welcome-date">A QUIETER KIND OF CONNECTION</span><span className={`connection-indicator ${connection}`}><i/>{connection === 'online' ? 'Live connection' : connection === 'connecting' ? 'Connecting…' : 'Reconnecting…'}</span></div><div className="welcome-center"><div className="welcome-art"><div className="welcome-loop loop-one"/><div className="welcome-loop loop-two"/><div className="welcome-loop loop-three"/><div className="welcome-monogram">o</div><span className="welcome-dot dot-one"/><span className="welcome-dot dot-two"/><span className="welcome-dot dot-three"/></div><span className="eyebrow">WELCOME TO YOUR ORBIT</span><h2>A little less noise.<br/>A lot more <em>meaning.</em></h2><p>Your conversations are waiting to happen.<br/>Search for someone to get started.</p><button className="primary-button" onClick={onFind}>Find someone <span>↗</span></button></div><div className="welcome-footer"><span>YOUR SPACE, YOUR PACE</span><span>01 — 01</span></div></div></section>
  return <section className={`chat-pane ${className}`}><header className="chat-header"><button className="back-button" onClick={onBack} aria-label="Back to inbox">←</button><Avatar name={active.displayName} username={active.username}/><div className="chat-person"><strong>{active.displayName}</strong><span>@{active.username}</span></div><div className="header-status"><span className={`live-dot ${connection === 'online' ? '' : 'dim'}`}/>{connection === 'online' ? 'Live connection' : connection === 'connecting' ? 'Connecting…' : 'Reconnecting…'}</div></header>
    <div className="thread-meta"><span className="thread-line"/><span>YOUR CONVERSATION WITH {active.displayName.toUpperCase()}</span><span className="thread-line"/></div><div className="message-scroll"><MessageList messages={messages} ownUsername={me.username} loading={loading} onFind={onFind}/></div><MessageComposer key={active.username} onSend={onSend} sending={sending} error={sendError}/></section>
}
