
import { useEffect, useRef, useState } from "react";
import { websocketUrl } from "../api";

export default function useWebSocket(user, onEvent) {
  const username = user?.username;

  const [status, setStatus] = useState("offline");

  const eventRef = useRef(onEvent);

  useEffect(() => {
    eventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!username) {
      setStatus("offline");
      return undefined;
    }

    let disposed = false;
    let initialTimer = null;
    let reconnectTimer = null;
    let socket = null;
    let retries = 0;

    const scheduleReconnect = () => {
      if (disposed) return;

      setStatus("offline");

      const delay = Math.min(
        1000 * (2 ** retries),
        10000
      );

      retries = Math.min(retries + 1, 4);

      reconnectTimer = window.setTimeout(
        connect,
        delay
      );
    };

    const connect = () => {
      if (disposed) return;

      setStatus("connecting");

      let ws;

      try {
        ws = new WebSocket(websocketUrl());
        socket = ws;
      } catch (error) {
        console.error("WebSocket creation failed:", error);
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        // An effect may have been cleaned up
        // while the connection was still opening.

        if (disposed) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, "Component disposed");
          }
          return;
        }

        retries = 0;
        setStatus("online");

        console.info("Orbit WebSocket connected");
      };

      ws.onmessage = ({ data }) => {
        if (disposed) return;

        try {
          const event = JSON.parse(data);
          eventRef.current?.(event);
        } catch (error) {
          console.error("Invalid WebSocket event:", error);
        }
      };

      // Let the browser fire onclose after
      // a connection failure. Do not close a
      // socket while it is CONNECTING.
      ws.onerror = () => {};

      ws.onclose = () => {
        if (disposed) return;

        console.warn("Orbit WebSocket disconnected");
        scheduleReconnect();
      };
    };

    // Deferring initial connection lets StrictMode's
    // immediate setup/cleanup cycle cancel the first
    // pending connection before it is created.
    initialTimer = window.setTimeout(connect, 0);

    return () => {
      disposed = true;

      clearTimeout(initialTimer);
      clearTimeout(reconnectTimer);

      if (!socket) return;

      if (socket.readyState === WebSocket.OPEN) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        socket.close(1000, "Component disposed");
      } else if (
        socket.readyState === WebSocket.CONNECTING
      ) {
        // Keep onopen attached. It checks disposed
        // and closes the socket immediately after
        // the handshake succeeds.

        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
      }
    };
  }, [username]);

  return username ? status : "offline";
}
