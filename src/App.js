import React, { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import DashboardPage from "./DashboardPage";
import { isAuthenticated, getUser, logout } from "./api";

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
