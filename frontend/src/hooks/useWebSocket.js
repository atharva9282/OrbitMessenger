import { useEffect, useRef, useState } from "react";
import { websocketUrl } from "../api";

export default function useWebSocket(user, onEvent) {
  const username = user?.username;
  const [status, setStatus] = useState("offline");
  const eventRef = useRef(onEvent);
  useEffect(() => { eventRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    if (!username) return undefined;
    let stopped = false;
    let timer;
    let socket;
    const connect = () => {
      if (stopped) return;
      setStatus("connecting");
      socket = new WebSocket(websocketUrl());
      socket.onopen = () => { if (!stopped) setStatus("online"); };
      socket.onmessage = ({ data }) => {
        try { eventRef.current(JSON.parse(data)); }
        catch { /* Ignore malformed payloads without taking down the socket. */ }
      };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        if (stopped) return;
        setStatus("offline");
        timer = window.setTimeout(connect, 2500);
      };
    };
    connect();
    return () => { stopped = true; clearTimeout(timer); socket?.close(); };
  }, [username]);

  return username ? status : "offline";
}
