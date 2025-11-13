import React, { useMemo, useState } from "react";
import "./DashboardPage.css";

const demoAccounts = [
  { id: "chk-1234", type: "Checking", last4: "1234", nickname: "Everyday Spend", balance: 2845.71 },
  { id: "svg-9876", type: "Savings", last4: "9876", nickname: "Emergency Fund", balance: 9200.0 },
];

const demoTransactions = [
  { id: 1, date: "2025-10-10", desc: "Grocery Store", amount: -89.99 },
  { id: 2, date: "2025-10-11", desc: "Payroll Deposit", amount: 3200.0 },
  { id: 3, date: "2025-10-12", desc: "Coffee Shop", amount: -5.25 },
  { id: 4, date: "2025-10-12", desc: "Online Purchase", amount: -82.0 },
];

export default function DashboardPage({ email = "user@securebank.com", onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "transactions" | "fraud" | "settings"

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="side">
        <div className="brand">SecureBank</div>

        <nav className="nav">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === "transactions" ? "active" : ""}`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
          <button
            className={`nav-item ${activeTab === "fraud" ? "active" : ""}`}
            onClick={() => setActiveTab("fraud")}
          >
            Fraud alerts
          </button>
          <button
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            User settings
          </button>
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      {/* Main content switches by tab */}
      <main className="main">
        {activeTab === "dashboard" && (
          <DashboardHome 
          email={email} 
          accounts={demoAccounts}
          goTransactions={() => setActiveTab("transactions")}  />
        )}
        {activeTab === "transactions" && (
          <TransactionsPage transactions={demoTransactions} />
        )}
        {activeTab === "fraud" && <FraudAlertsPage />}
        {activeTab === "settings" && <UserSettingsPage email={email} />}
      </main>
    </div>
  );
}

/* ------------ DASHBOARD HOME (ACCOUNTS) ------------ */

function DashboardHome({ email, accounts, goTransactions = () => {} }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(accounts[0]?.id);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.type.toLowerCase().includes(q) ||
        a.nickname.toLowerCase().includes(q) ||
        a.last4.includes(q)
    );
  }, [query, accounts]);

  const selected = accounts.find((a) => a.id === selectedId) || filtered[0];

  return (
    <div className="home-grid">
      <section className="card">
        <div className="card-head">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Signed in as {email}</p>
          </div>
        
        </div>

        <ul className="acct-list">
          {filtered.map((a) => (
            <li
              key={a.id}
              className={`acct ${selected?.id === a.id ? "selected" : ""}`}
              onClick={() => setSelectedId(a.id)}
            >
              <div className="acct-type">
                {a.type} •••• {a.last4}
              </div>
              <div className="acct-nick">{a.nickname}</div>
              <div className="acct-balance">
                ${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="empty">No accounts match “{query}”.</li>
          )}
        </ul>
      </section>

      <section className="card big">
        {selected ? (
          <div className="detail">
            <h3 className="detail-title">
              {selected.type} •••• {selected.last4}
            </h3>
            <p className="detail-sub">Nickname: {selected.nickname}</p>
            <div className="detail-stat">
              Current balance
              <div className="detail-balance">
                ${selected.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="detail-actions">
              
              <button className="btn">Transfer funds</button>
            </div>
          </div>
        ) : (
          <div className="empty-big">Select an account</div>
        )}
      </section>
    </div>
  );
}

/* ------------ TRANSACTIONS PAGE ------------ */

function TransactionsPage({ transactions }) {
  const [visibleCount, setVisibleCount] = useState(3);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      return true;
    });
  }, [transactions, from, to]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <section className="card full">
      <div className="card-head">
        <h1 className="page-title">Transactions</h1>
        <div className="filter-row">
          <label>
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="date-input"
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="date-input"
            />
          </label>
        </div>
      </div>

      <div className="tx-list">
        {visible.map((t) => (
          <div key={t.id} className="tx-row">
            <div className="tx-meta">
              <div className="tx-desc">{t.desc}</div>
              <div className="tx-date">{t.date}</div>
            </div>
            <div
              className={
                "tx-amount " + (t.amount >= 0 ? "tx-positive" : "tx-negative")
              }
            >
              {t.amount >= 0 ? "+" : "-"}$
              {Math.abs(t.amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="empty">No transactions for this date range.</div>
        )}
      </div>

      {visibleCount < filtered.length && (
        <button
          className="btn load-more"
          onClick={() => setVisibleCount((c) => c + 3)}
        >
          Load more
        </button>
      )}
    </section>
  );
}

/* ------------ USER SETTINGS PAGE ------------ */

function UserSettingsPage({ email }) {
  return (
    <section className="card full">
      <h1 className="page-title">User settings</h1>
      <div className="settings-grid">
        <div className="settings-card">
          <h2>Current user information</h2>
          <p>
            <strong>Username:</strong> saleh123
          </p>
          <p>
            <strong>Email:</strong> {email}
          </p>
          <p>
            <strong>Delivery options:</strong> Email + SMS
          </p>
        </div>

        <div className="settings-card">
          <h2>Change your settings</h2>
          <ul className="settings-list">
            <li>Change delivery options</li>
            <li>Change email</li>
            <li>Change username</li>
            <li>Change password</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------ FRAUD ALERTS PAGE ------------ */

function FraudAlertsPage() {
  return (
    <section className="card full">
      <h1 className="page-title">Fraud alerts</h1>
      <div className="alert-card">
        <div className="alert-icon">!</div>
        <div>
          <p className="alert-title">Suspicious activity detected</p>
          <p className="alert-body">
            Unusual transaction amount: $500 at “Cozy Cafe” on Oct 7, 2025 at 2:34 PM.
            Please review this transaction in your account activity.
          </p>
        </div>
      </div>
    </section>
  );
}
