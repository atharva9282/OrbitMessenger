import { api } from "../api";

export function normalizeGroupMessage(message) {
  if (!message || typeof message !== "object") return message;
  const sender = message.sender;
  const senderUsername = typeof sender === "string"
    ? sender.trim()
    : String(sender?.username ?? message.senderUsername ?? "").trim();
  return {
    ...message,
    sender: senderUsername,
    senderDisplayName: message.senderDisplayName ?? sender?.displayName ?? message.displayName ?? senderUsername,
  };
}

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
    (await api(`/api/groups/${groupId}/messages?before=${before}`)).map(normalizeGroupMessage),
  send: async (groupId, body) =>
    normalizeGroupMessage(await api(`/api/groups/${groupId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    })),
};
