import { useCallback, useEffect, useRef, useState } from 'react'
import { api, websocketUrl, logout } from './api'
import { chatService } from './services/chat'
import AuthScreen from './components/auth/AuthScreen'
import Brand from './components/common/Brand'
import Sidebar from './components/layout/Sidebar'
import InboxPane from './components/conversations/InboxPane'
import ChatWindow from './components/chat/ChatWindow'
import './App.css'
import './theme.css'

function appendUnique(messages, incoming) {
  if (messages.some(message => message.id === incoming.id)) return messages
  return [...messages, incoming].sort((a, b) => Number(a.id) - Number(b.id))
}

export default function App() {
  const [me, setMe] = useState(undefined)
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [people, setPeople] = useState([])
  const [searching, setSearching] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [error, setError] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [mobileChat, setMobileChat] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [connection, setConnection] = useState('connecting')
  const activeRef = useRef(null)

  const handleAuthError = useCallback(err => {
    if (err.status === 401) { activeRef.current = null; setMe(null); setActive(null); setMessages([]) }
    else setError(err.message || 'Something went wrong.')
  }, [])

  const loadConversations = useCallback(async () => {
    try { setConversations(await chatService.conversations()); setError('') }
    catch (err) { handleAuthError(err) }
    finally { setLoadingConversations(false) }
  }, [handleAuthError])

  useEffect(() => {
    let mounted = true
    api('/api/me').then(person => { if (mounted) setMe(person) }).catch(err => {
      if (mounted) { if (err.status === 401) setMe(null); else { setError(err.message); setMe(null) } }
    })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!me) return undefined
    let mounted = true
    chatService.conversations().then(items => {
      if (mounted) { setConversations(items); setError('') }
    }).catch(err => {
      if (mounted) handleAuthError(err)
    }).finally(() => {
      if (mounted) setLoadingConversations(false)
    })
    return () => { mounted = false }
  }, [me, handleAuthError])

  useEffect(() => {
    if (!me) return undefined
    let stopped = false
    let reconnectTimer
    let socket
    const connect = () => {
      if (stopped) return
      setConnection('connecting')
      socket = new WebSocket(websocketUrl())
      socket.onopen = () => setConnection('online')
      socket.onmessage = event => {
        try {
          const incoming = JSON.parse(event.data)
          const peer = incoming.sender === me.username ? incoming.recipient : incoming.sender
          void loadConversations()
          setConversations(current => {
            const found = current.find(item => item.person.username === peer)
            if (found) return [{ ...found, chatMessage: incoming }, ...current.filter(item => item.person.username !== peer)]
            return current
          })
          if ([incoming.sender, incoming.recipient].includes(activeRef.current?.username)) {
            setMessages(current => appendUnique(current, incoming))
          }
        } catch { setError('Received a message the app could not read.') }
      }
      socket.onclose = () => { setConnection('offline'); if (!stopped) reconnectTimer = window.setTimeout(connect, 2500) }
      socket.onerror = () => socket.close()
    }
    connect()
    return () => { stopped = true; clearTimeout(reconnectTimer); socket?.close() }
  }, [me, loadConversations])

  useEffect(() => {
    const query = search.trim()
    if (!me || query.length < 1) return undefined
    let alive = true
    const timer = window.setTimeout(() => chatService.searchUsers(query)
      .then(result => { if (alive) setPeople(result) })
      .catch(handleAuthError)
      .finally(() => { if (alive) setSearching(false) }), 250)
    return () => { alive = false; clearTimeout(timer) }
  }, [search, me, handleAuthError])

  const openPerson = async person => {
    activeRef.current = person
    setActive(person); setMobileChat(true); setShowSearch(false); setSearch(''); setPeople([]); setLoadingMessages(true); setMessages([]); setSendError('')
    try {
      const history = await chatService.history(person.username)
      if (activeRef.current?.username === person.username) setMessages(history)
    }
    catch (err) { handleAuthError(err) }
    finally { if (activeRef.current?.username === person.username) setLoadingMessages(false) }
  }

  const sendMessage = async body => {
    if (!active || sending) return false
    const recipient = active.username
    const recipientPerson = active
    setSending(true); setSendError('')
    try {
      const savedMessage = await chatService.send(recipient, body)
      if (activeRef.current?.username === recipient) setMessages(current => appendUnique(current, savedMessage))
      setConversations(current => {
        const entry = { person: recipientPerson, chatMessage: savedMessage }
        return [entry, ...current.filter(item => item.person.username !== recipient)]
      })
      return true
    } catch (err) {
      if (err.status === 401) handleAuthError(err)
      else setSendError(err.message || 'Message could not be sent. Please try again.')
      return false
    } finally { setSending(false) }
  }

  const findPerson = () => { setShowSearch(true); document.querySelector('.search-input')?.focus() }
  const updateSearch = value => { setSearch(value); setSearching(Boolean(value.trim())); if (!value.trim()) setPeople([]) }
  const onLogout = async () => {
    try { await logout() } catch { /* Clear local identity if the server session already expired. */ }
    activeRef.current = null
    setMe(null); setActive(null); setMessages([]); setConversations([])
  }
  const connectionLabel = connection === 'online' ? 'Live connection' : connection === 'connecting' ? 'Connecting…' : 'Reconnecting…'

  if (me === undefined) return <div className="boot-screen"><Brand/><span className="spinner"/></div>
  if (!me) return <AuthScreen onAuthenticated={person => { setMe(person); setLoadingConversations(true) }}/>

  return <main className={`app-shell ${mobileChat ? 'mobile-chat-open' : ''}`}>
    <Sidebar person={me} onLogout={onLogout} onFind={findPerson} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen(value => !value)}/>
    <InboxPane person={me} conversations={conversations} active={active} search={search} onSearch={updateSearch} showSearch={showSearch} onShowSearch={() => setShowSearch(true)} people={people} searching={searching} onSelectPerson={openPerson} onRefresh={loadConversations} loading={loadingConversations} onFind={findPerson} connection={connection} connectionLabel={connectionLabel} className={mobileChat ? 'mobile-hidden' : ''}/>
    <ChatWindow className={mobileChat ? 'mobile-visible' : ''} active={active} me={me} messages={messages} loading={loadingMessages} sending={sending} sendError={sendError} onSend={sendMessage} onBack={() => setMobileChat(false)} connection={connection} onFind={findPerson}/>
    {error && <div className="toast" role="status"><span>!</span>{error}<button onClick={() => setError('')} aria-label="Dismiss">×</button></div>}
  </main>
}
