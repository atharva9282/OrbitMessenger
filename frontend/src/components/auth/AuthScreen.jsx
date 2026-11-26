import { useState } from "react";
import { api, login } from "../../api";
import Brand from "../common/Brand";

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    displayName: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register")
        await api("/api/register", {
          method: "POST",
          body: JSON.stringify(form),
        });
      await login(form.username, form.password);
      onAuthenticated(await api("/api/me"));
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-shell">
      <section className="auth-art">
        <Brand />
        <div className="art-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> A little closer, wherever you are
          </div>
          <h1>
            Good conversations
            <br />
            find their <em>orbit.</em>
          </h1>
          <p>A calmer place for the people and moments that matter.</p>
          <div className="orbit-graphic">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />
            <div className="orbit-core">
              <Brand compact />
            </div>
            <span className="orbit-node node-a">M</span>
            <span className="orbit-node node-b">S</span>
            <span className="orbit-node node-c">A</span>
            <span className="orbit-spark">✳</span>
          </div>
        </div>
        <div className="art-footer">
          <span>Private by nature</span>
          <span>Made for meaningful moments</span>
        </div>
      </section>
      <section className="auth-main">
        <div className="auth-form-wrap">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="auth-heading">
            <span className="eyebrow">YOUR SPACE TO CONNECT</span>
            <h2>
              {mode === "login" ? "Welcome back" : "Make yourself at home"}
            </h2>
            <p>
              {mode === "login"
                ? "Sign in to pick up where you left off."
                : "Create an account and start a conversation."}
            </p>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && (
              <label>
                Display name
                <input
                  required
                  maxLength="50"
                  autoComplete="name"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm({ ...form, displayName: e.target.value })
                  }
                  placeholder="How people know you"
                />
              </label>
            )}
            <label>
              Username
              <input
                required
                maxLength="24"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Your username"
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Your password"
              />
            </label>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button className="primary-button auth-submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner" /> Working…
                </>
              ) : mode === "login" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
              <span aria-hidden="true">↗</span>
            </button>
          </form>
          <p className="auth-switch">
            {mode === "login" ? "New to orbit?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <div className="auth-note">
            <span className="lock-icon">⌑</span> Your account is secured with
            your private session.
          </div>
        </div>
        <div className="auth-bottom">
          © 2026 Orbit Messaging <span>•</span> A little more human
        </div>
      </section>
    </main>
  );
}
