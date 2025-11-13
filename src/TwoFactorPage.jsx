import React, { useEffect, useMemo, useRef, useState } from "react";
import "./LoginPage.css"; // re-use the same styles

export default function TwoFactorPage({ email, onCancel, onVerified }) {
  const [pin, setPin] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [cooldown, setCooldown] = useState(30);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // For demo only: pretend the server sent a code. In real life, your backend sends it.
  const codeRef = useRef("");
  const maskedEmail = useMemo(() => {
    if (!email) return "your email";
    const [user, domain] = email.split("@");
    const safe = user.length <= 2 ? user[0] ?? "" : user.slice(0, 2);
    return `${safe}${"•".repeat(4)}@${domain}`;
  }, [email]);

  function generateCode() {
    // 6-digit numeric
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  // Initialize code and cooldown
  useEffect(() => {
    codeRef.current = generateCode();
    setCooldown(30);
    setMessage(`We sent a 6-digit code to ${maskedEmail}. (demo code: ${codeRef.current})`);
  }, [maskedEmail]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function handleVerify(e) {
    e.preventDefault();
    setError("");
    if (!pin) return setError("Please enter the PIN.");
    if (pin !== codeRef.current) {
      const left = attemptsLeft - 1;
      setAttemptsLeft(left);
      setError(left > 0 ? `Incorrect PIN. Attempts left: ${left}` : "No attempts left.");
      setPin("");
      if (left <= 0) onCancel?.(); // kick back to login on lockout (simple demo)
      return;
    }
    setMessage("PIN verified. Welcome!");
    onVerified?.(); // proceed (e.g., navigate to dashboard)
  }

  function handleResend() {
    if (cooldown > 0) return;
    codeRef.current = generateCode();
    setCooldown(30);
    setMessage(`New code sent to ${maskedEmail}. (demo code: ${codeRef.current})`);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Enter PIN</h1>
        <p className="login-subtitle">SecureBank Fraud Detection Portal</p>

        {message && <div className="alert alert-success" role="status">{message}</div>}
        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleVerify} className="login-form">
          <div className="field">
            <label className="label">Enter PIN (sent to {maskedEmail})</label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="input"
              placeholder="6-digit code"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
          </div>

          <div className="field field-row">
            <button type="submit" className="btn">Verify PIN</button>
            <button type="button" className="btn" onClick={onCancel} style={{ width: 140 }}>
              Cancel
            </button>
          </div>

          <div className="field field-row" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="btn"
              onClick={handleResend}
              disabled={cooldown > 0}
              style={{ width: 180 }}
            >
              {cooldown > 0 ? `Resend PIN (${cooldown}s)` : "Resend PIN"}
            </button>
            <span className="note">Attempts left: {attemptsLeft}</span>
          </div>
        </form>
      </div>
    </div>
  );
}
