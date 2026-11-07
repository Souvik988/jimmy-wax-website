import { useState } from "react";
import { auth } from "../lib/api";
export function AccountRecovery() {
  const [email, setEmail] = useState(""),
    [token, setToken] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, text: string) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      setNotice(text);
      setToken("");
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="checkout">
      <h1>Account recovery & verification</h1>
      <p>
        Enter codes from your store email here. Codes stay out of the browser
        address bar.
      </p>
      <form
        className="co-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            () => auth.forgotPassword(email),
            "If this account exists, a reset code has been emailed.",
          );
        }}
      >
        <label className="field">
          Account email
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button className="solid-button" disabled={busy}>
          Request password reset
        </button>
      </form>
      <form
        className="co-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            () => auth.resetPassword(token, password),
            "Password reset. Please sign in with your new password.",
          );
        }}
      >
        <label className="field">
          Email code
          <input
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="one-time-code"
          />
        </label>
        <label className="field">
          New password
          <input
            required
            minLength={10}
            maxLength={128}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <div className="co-actions">
          <button className="solid-button" disabled={busy}>
            Set new password
          </button>
          <button
            className="link-button"
            type="button"
            disabled={busy || !token}
            onClick={() =>
              void run(() => auth.verifyEmail(token), "Email verified.")
            }
          >
            Verify email with this code
          </button>
        </div>
      </form>
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </section>
  );
}
