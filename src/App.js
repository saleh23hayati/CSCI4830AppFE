import React, { useState } from "react";
import LoginPage from "./LoginPage";
import TwoFactorPage from "./TwoFactorPage";
import DashboardPage from "./DashboardPage"; // ← add this import

export default function App() {
  const [stage, setStage] = useState("login"); // "login" | "2fa" | "dashboard"
  const [email, setEmail] = useState("");

  if (stage === "login") {
    return (
      <LoginPage
        onSuccess={(em) => {
          setEmail(em);
          setStage("2fa");
        }}
      />
    );
  }

  if (stage === "2fa") {
    return (
      <TwoFactorPage
        email={email}
        onCancel={() => setStage("login")}
        onVerified={() => setStage("dashboard")} // ← move to dashboard after 2FA
      />
    );
  }

  // Once 2FA is complete
  return (
    <DashboardPage
      email={email}
      onLogout={() => {
        setEmail("");
        setStage("login"); // ← goes back to login
      }}
    />
  );
}
