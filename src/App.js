import React, { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import DashboardPage from "./DashboardPage";
import { isAuthenticated, getUser, logout, refreshToken, getRefreshToken } from "./api";

export default function App() {
  const [stage, setStage] = useState("login"); // "login" | "dashboard"
  const [user, setUser] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    if (isAuthenticated()) {
      const userInfo = getUser();
      if (userInfo) {
        setUser(userInfo);
        setStage("dashboard");
      }
    }
  }, []);

  // Auto-refresh token before expiration (every 14 minutes, token expires in 15)
  useEffect(() => {
    if (!isAuthenticated()) return;

    const refreshInterval = setInterval(async () => {
      try {
        if (getRefreshToken()) {
          await refreshToken();
          console.log("Token refreshed successfully");
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
        // If refresh fails, logout user
        logout();
        setUser(null);
        setStage("login");
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes

    return () => clearInterval(refreshInterval);
  }, [stage]);

  if (stage === "login") {
    return (
      <LoginPage
        onSuccess={(username) => {
          const userInfo = getUser();
          setUser(userInfo || { username });
          setStage("dashboard");
        }}
      />
    );
  }

  // Dashboard
  return (
    <DashboardPage
      user={user}
      onLogout={() => {
        logout();
        setUser(null);
        setStage("login");
      }}
    />
  );
}
