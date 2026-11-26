import { api } from '../api'

export const chatService = {
  conversations: () => api('/api/conversations'),
  searchUsers: (query) => api(`/api/users?q=${encodeURIComponent(query)}`),
  history: (peer, before = '9223372036854775807') => api(`/api/message/${encodeURIComponent(peer)}?before=${before}`),
  send: (recipient, body) => api('/api/message', {
    method: 'POST',
    body: JSON.stringify({ recipient, body }),
  }),
}
