import { useCallback, useEffect, useState } from "react";
import { api, logout } from "../api";

export default function useAuth() {
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    let current = true;
    api("/api/me")
      .then((person) => current && setUser(person))
      .catch((err) => {
        if (!current) return;
        if (err.status !== 401) setError({ message: err.message || "Could not load your session." });
        setUser(null);
      });
    return () => { current = false; };
  }, []);

  const handleError = useCallback((err) => {
    if (err.status === 401) setUser(null);
    else setError({ message: err.message || "Something went wrong.", success: Boolean(err.success) });
  }, []);

  const signOut = useCallback(async () => {
    try { await logout(); } catch { /* The server session may already be expired. */ }
    setUser(null);
  }, []);

  return { user, setUser, error, setError, handleError, signOut };
}
