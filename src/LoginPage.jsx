import React, { useState } from "react";
import "./LoginPage.css";
import logo from "./logo.svg";
import { login } from "./api";

export default function LoginPage({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!username || !password) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      // Call real backend API using utility function
      const response = await login(username, password);
      
      setMessage("Logged in successfully!");
      if (typeof onSuccess === "function") onSuccess(response.username || username);
    } catch (err) {
      // Handle error from backend (now with consistent error format)
      const errorMessage = err.message || "Invalid username or password";
      setError(errorMessage);
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
        {/* Username */}
        <div className="field">
          <label className="label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            placeholder="yourusername"
            autoComplete="username"
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
        Secure login with JWT authentication. Connect to backend at {process.env.REACT_APP_API_URL || "http://localhost:8080"}
      </p>
    </div>
  </div>
);
}


