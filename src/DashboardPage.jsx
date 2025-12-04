import React, { useMemo, useState, useEffect } from "react";
import "./DashboardPage.css";
import { getAccounts, getTransactions, getFraudAlerts } from "./api";

export default function DashboardPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "transactions" | "fraud" | "settings"
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const username = user?.username || "user";

  // Fetch accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Fetch transactions when transactions tab is active
  useEffect(() => {
    if (activeTab === "transactions") {
      loadTransactions();
    }
  }, [activeTab]);

  // Fetch fraud alerts when fraud tab is active
  useEffect(() => {
    if (activeTab === "fraud") {
      loadFraudAlerts();
    }
  }, [activeTab]);

  async function loadAccounts() {
    try {
      setLoading(true);
      setError("");
      const data = await getAccounts();
      setAccounts(data || []);
    } catch (err) {
      setError(err.message || "Failed to load accounts");
      console.error("Error loading accounts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions(params = {}) {
    try {
      setLoading(true);
      setError("");
      const data = await getTransactions(params);
      // Handle paginated response
      if (data.content) {
        setTransactions(data.content);
      } else {
        setTransactions(data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load transactions");
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadFraudAlerts() {
    try {
      setLoading(true);
      setError("");
      const data = await getFraudAlerts();
      setFraudAlerts(data || []);
    } catch (err) {
      setError(err.message || "Failed to load fraud alerts");
      console.error("Error loading fraud alerts:", err);
    } finally {
      setLoading(false);
    }
  }

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
        {error && (
          <div className="alert alert-error" style={{ margin: "1rem", padding: "1rem" }}>
            {error}
          </div>
        )}
        {activeTab === "dashboard" && (
          <DashboardHome 
            username={username} 
            accounts={accounts}
            loading={loading}
            onRefresh={loadAccounts}
            goTransactions={() => setActiveTab("transactions")}  
          />
        )}
        {activeTab === "transactions" && (
          <TransactionsPage 
            transactions={transactions}
            loading={loading}
            onRefresh={loadTransactions}
          />
        )}
        {activeTab === "fraud" && (
          <FraudAlertsPage 
            alerts={fraudAlerts}
            loading={loading}
            onRefresh={loadFraudAlerts}
          />
        )}
        {activeTab === "settings" && <UserSettingsPage user={user} />}
      </main>
    </div>
  );
}

/* ------------ DASHBOARD HOME (ACCOUNTS) ------------ */

function DashboardHome({ username, accounts, loading, onRefresh, goTransactions = () => {} }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(accounts[0]?.id);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.accountType?.toLowerCase().includes(q) ||
        a.accountNumber?.includes(q)
    );
  }, [query, accounts]);

  const selected = accounts.find((a) => a.id === selectedId) || filtered[0];

  if (loading) {
    return (
      <div className="home-grid">
        <section className="card">
          <div className="card-head">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Loading accounts...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home-grid">
      <section className="card">
        <div className="card-head">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Signed in as {username}</p>
          </div>
          <button className="btn" onClick={onRefresh} style={{ marginLeft: "auto" }}>
            Refresh
          </button>
        </div>

        <ul className="acct-list">
          {filtered.map((a) => (
            <li
              key={a.id}
              className={`acct ${selected?.id === a.id ? "selected" : ""}`}
              onClick={() => setSelectedId(a.id)}
            >
              <div className="acct-type">
                {a.accountType || "Account"} •••• {a.accountNumber?.slice(-4) || a.id}
              </div>
              <div className="acct-nick">Account #{a.accountNumber || a.id}</div>
              <div className="acct-balance">
                ${(a.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </li>
          ))}
          {filtered.length === 0 && !loading && (
            <li className="empty">No accounts found.</li>
          )}
        </ul>
      </section>

      <section className="card big">
        {selected ? (
          <div className="detail">
            <h3 className="detail-title">
              {selected.accountType || "Account"} •••• {selected.accountNumber?.slice(-4) || selected.id}
            </h3>
            <p className="detail-sub">Account Number: {selected.accountNumber || selected.id}</p>
            <div className="detail-stat">
              Current balance
              <div className="detail-balance">
                ${(selected.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="detail-actions">
              <button className="btn" onClick={goTransactions}>View Transactions</button>
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

function TransactionsPage({ transactions, loading, onRefresh }) {
  const [page, setPage] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.transactionTimestamp) return true;
      const txDate = t.transactionTimestamp.split("T")[0];
      if (from && txDate < from) return false;
      if (to && txDate > to) return false;
      return true;
    });
  }, [transactions, from, to]);

  if (loading) {
    return (
      <section className="card full">
        <div className="card-head">
          <h1 className="page-title">Transactions</h1>
        </div>
        <p>Loading transactions...</p>
      </section>
    );
  }

  return (
    <section className="card full">
      <div className="card-head">
        <h1 className="page-title">Transactions</h1>
        <button className="btn" onClick={onRefresh} style={{ marginLeft: "auto" }}>
          Refresh
        </button>
      </div>
      <div className="filter-row" style={{ marginBottom: "1rem" }}>
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

      <div className="tx-list">
        {filtered.map((t) => {
          const isPositive = t.transactionType === "DEPOSIT" || t.transactionType === "TRANSFER_IN" || t.transactionType === "REFUND";
          const amount = t.amount || 0;
          const date = t.transactionTimestamp ? t.transactionTimestamp.split("T")[0] : "N/A";
          const desc = t.description || t.merchantName || `${t.transactionType} Transaction`;
          
          return (
            <div key={t.id} className="tx-row">
              <div className="tx-meta">
                <div className="tx-desc">{desc}</div>
                <div className="tx-date">{date}</div>
                {t.fraudStatus === "FLAGGED" && (
                  <div style={{ color: "red", fontSize: "0.85em", marginTop: "0.25rem" }}>
                    ⚠️ Flagged for review
                  </div>
                )}
              </div>
              <div className={`tx-amount ${isPositive ? "tx-positive" : "tx-negative"}`}>
                {isPositive ? "+" : "-"}${Math.abs(amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty">No transactions found.</div>
        )}
      </div>
    </section>
  );
}

/* ------------ USER SETTINGS PAGE ------------ */

function UserSettingsPage({ user }) {
  return (
    <section className="card full">
      <h1 className="page-title">User settings</h1>
      <div className="settings-grid">
        <div className="settings-card">
          <h2>Current user information</h2>
          <p>
            <strong>Username:</strong> {user?.username || "N/A"}
          </p>
          <p>
            <strong>Role:</strong> {user?.role || "N/A"}
          </p>
        </div>

        <div className="settings-card">
          <h2>Account Management</h2>
          <ul className="settings-list">
            <li>View account details</li>
            <li>Update profile information</li>
            <li>Change password</li>
            <li>Security settings</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------ FRAUD ALERTS PAGE ------------ */

function FraudAlertsPage({ alerts, loading, onRefresh }) {
  if (loading) {
    return (
      <section className="card full">
        <h1 className="page-title">Fraud alerts</h1>
        <p>Loading fraud alerts...</p>
      </section>
    );
  }

  return (
    <section className="card full">
      <div className="card-head">
        <h1 className="page-title">Fraud alerts</h1>
        <button className="btn" onClick={onRefresh} style={{ marginLeft: "auto" }}>
          Refresh
        </button>
      </div>
      {alerts.length === 0 ? (
        <div className="empty">No fraud alerts at this time.</div>
      ) : (
        alerts.map((alert) => {
          const date = alert.transactionTimestamp 
            ? new Date(alert.transactionTimestamp).toLocaleString() 
            : "N/A";
          const amount = alert.amount || 0;
          const desc = alert.description || alert.merchantName || `${alert.transactionType} Transaction`;
          
          return (
            <div key={alert.id} className="alert-card" style={{ marginBottom: "1rem" }}>
              <div className="alert-icon">!</div>
              <div>
                <p className="alert-title">Suspicious activity detected</p>
                <p className="alert-body">
                  Transaction: {desc} - ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} on {date}
                </p>
                {alert.fraudReasons && (
                  <p className="alert-body" style={{ fontSize: "0.9em", color: "#666" }}>
                    Reasons: {alert.fraudReasons}
                  </p>
                )}
                {alert.fraudScore && (
                  <p className="alert-body" style={{ fontSize: "0.9em", color: "#666" }}>
                    Risk Score: {(alert.fraudScore * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
