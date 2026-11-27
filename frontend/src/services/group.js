import { api } from "../api";

export const groupService = {
  list: () => api("/api/groups"),
  create: (name, memberUsernames) =>
    api("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name, memberUsernames }),
    }),
  details: (groupId) => api(`/api/groups/${groupId}`),
  members: (groupId) => api(`/api/groups/${groupId}/members`),
  history: async (groupId, before = "9223372036854775807") =>
    (await api(`/api/groups/${groupId}/messages?before=${before}`)).reverse(),
  send: (groupId, body) =>
    api(`/api/groups/${groupId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
};
