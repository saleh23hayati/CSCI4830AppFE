import React, { useState } from "react";
import "./LoginPage.css";
import logo from "./logo.svg";

export default function LoginPage({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function base64UrlEncode(bytes) {
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    const b64 = btoa(binary);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function generateToken() {
    const bytes = new Uint8Array(32); // 256-bit
    crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      const token = generateToken();
      localStorage.setItem("sb_token", token);

      // Simulate backend login success (no real API needed)
      await new Promise((resolve) => setTimeout(resolve, 500)); // fake 0.5s delay

        setMessage("Logged in successfully! (Demo mode)");
      if (typeof onSuccess === "function") onSuccess(email);


    //   if (!res.ok) {
    //     const text = await res.text();
    //     throw new Error(text || "Login failed");
    //   }

      setMessage("Logged in! Token sent to backend.");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

return (
  <div className="login-container">
    <div className="login-card">
      <div className="logo-wrap">
        <img src={logo} alt="SecureBank Logo" className="brand-logo" />
      </div>

      <h1 className="login-title">Hi, welcome!</h1>
      <h2 className="login-subtitle">SecureBank</h2>

      <form onSubmit={handleSubmit} className="login-form">
        {/* Email */}
        <div className="field">
          <label className="label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="field">
          <label className="label">Password</label>
          <div className="input-with-toggle">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Remember / Forgot */}
        <div className="field field-row">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Remember me</span>
          </label>
          <a className="forgot" href="#">Forgot username or password?</a>
        </div>

        {/* Alerts */}
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {message && <div className="alert alert-success" role="status">{message}</div>}

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="note">
        This minimal demo generates a random 256-bit token in the browser and includes it in the login POST body.
      </p>
    </div>
  </div>
);
}


