import React, { useMemo, useState, useEffect } from "react";
import "./DashboardPage.css";
import { getAccounts, getTransactions, getFraudAlerts, createTransaction, createAccount } from "./api";

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
      let errorMsg = err.message || "Failed to load accounts";
      if (errorMsg.includes("expired") || errorMsg.includes("Unauthorized")) {
        errorMsg = "Your session has expired. Please refresh the page and login again.";
      } else if (errorMsg.includes("Forbidden")) {
        errorMsg = "You don't have permission to view accounts.";
      }
      setError(errorMsg);
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
      let errorMsg = err.message || "Failed to load transactions";
      if (errorMsg.includes("expired") || errorMsg.includes("Unauthorized")) {
        errorMsg = "Your session has expired. Please refresh the page and login again.";
      } else if (errorMsg.includes("Forbidden")) {
        errorMsg = "You don't have permission to view transactions.";
      }
      setError(errorMsg);
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
      let errorMsg = err.message || "Failed to load fraud alerts";
      if (errorMsg.includes("expired") || errorMsg.includes("Unauthorized")) {
        errorMsg = "Your session has expired. Please refresh the page and login again.";
      } else if (errorMsg.includes("Forbidden")) {
        errorMsg = "You don't have permission to view fraud alerts.";
      }
      setError(errorMsg);
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
            userRole={user?.role}
            onCreateTransaction={async (transactionData) => {
              try {
                await createTransaction(transactionData);
                // Refresh accounts to show updated balance
                await loadAccounts();
                // Refresh transactions to show new transaction
                if (activeTab === "transactions") {
                  await loadTransactions();
                }
                return { success: true };
              } catch (err) {
                return { success: false, error: err.message };
              }
            }}
          />
        )}
        {activeTab === "transactions" && (
          <TransactionsPage 
            transactions={transactions}
            loading={loading}
            onRefresh={loadTransactions}
            accounts={accounts}
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

function DashboardHome({ username, accounts, loading, onRefresh, goTransactions = () => {}, onCreateTransaction, userRole }) {
  const [selectedId, setSelectedId] = useState(accounts[0]?.id);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCreateAccountForm, setShowCreateAccountForm] = useState(false);

  const filtered = useMemo(() => {
    return accounts;
  }, [accounts]);

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
          <div style={{ display: "flex", gap: "10px", flexShrink: 0, alignItems: "flex-start" }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowCreateAccountForm(!showCreateAccountForm)}
              style={{ whiteSpace: "nowrap" }}
            >
              {showCreateAccountForm ? "Cancel" : "New Account"}
            </button>
            <button 
              className="btn" 
              onClick={() => onRefresh()}
              disabled={loading}
              style={{ 
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {loading ? "⏳ Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {showCreateAccountForm && (
          <CreateAccountForm
            onSuccess={async (result) => {
              if (result.success) {
                setShowCreateAccountForm(false);
                await onRefresh(); // Refresh accounts list
              }
              return result;
            }}
            onCreateAccount={async (accountData) => {
              try {
                await createAccount(accountData);
                return { success: true };
              } catch (err) {
                return { success: false, error: err.message };
              }
            }}
          />
        )}

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
              <button className="btn btn-secondary" onClick={() => setShowTransactionForm(!showTransactionForm)}>
                {showTransactionForm ? "Cancel" : "New Transaction"}
              </button>
            </div>
            {showTransactionForm && (
              <TransactionForm
                accountId={selected.id}
                accountNumber={selected.accountNumber}
                currentBalance={selected.balance}
                accounts={accounts}
                userRole={userRole}
                onSuccess={async (result) => {
                  if (result.success) {
                    setShowTransactionForm(false);
                    await onRefresh(); // Refresh accounts to show updated balance
                  }
                  return result;
                }}
                onCreateTransaction={onCreateTransaction}
              />
            )}
          </div>
        ) : (
          <div className="empty-big">Select an account</div>
        )}
      </section>
    </div>
  );
}

/* ------------ TRANSACTIONS PAGE ------------ */

function TransactionsPage({ transactions, loading, onRefresh, accounts = [] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [quickFilter, setQuickFilter] = useState("all"); // "all" | "today" | "week" | "month"

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (txDate.getTime() === today.getTime()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (txDate.getTime() === yesterday.getTime()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      const daysDiff = Math.floor((today - txDate) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return `${daysDiff} days ago, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
          hour: 'numeric', 
          minute: '2-digit' 
        });
      }
    }
  };

  // Get transaction type icon and color
  const getTransactionTypeInfo = (type) => {
    switch (type) {
      case "DEPOSIT":
      case "TRANSFER_IN":
      case "REFUND":
        return { icon: "⬇️", color: "#16a34a", label: type.replace("_", " ") };
      case "WITHDRAWAL":
      case "TRANSFER_OUT":
      case "PURCHASE":
      case "FEE":
        return { icon: "⬆️", color: "#dc2626", label: type.replace("_", " ") };
      default:
        return { icon: "💳", color: "#6b7280", label: type || "Transaction" };
    }
  };

  // Apply quick filters
  const getQuickFilterDates = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (quickFilter) {
      case "today":
        return { from: today.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { from: weekAgo.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { from: monthAgo.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
      default:
        return { from: "", to: "" };
    }
  };

  const filtered = useMemo(() => {
    const quickDates = getQuickFilterDates();
    const effectiveFrom = from || quickDates.from;
    const effectiveTo = to || quickDates.to;
    
    return transactions.filter((t) => {
      // Date filter
      if (effectiveFrom || effectiveTo) {
        if (!t.transactionTimestamp) return false;
        const txDate = t.transactionTimestamp.split("T")[0];
        if (effectiveFrom && txDate < effectiveFrom) return false;
        if (effectiveTo && txDate > effectiveTo) return false;
      }
      
      // Account filter
      if (selectedAccountId) {
        if (!t.account || t.account.id !== parseInt(selectedAccountId)) return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const merchant = (t.merchantName || "").toLowerCase();
        const type = (t.transactionType || "").toLowerCase();
        const amount = (t.amount || 0).toString();
        
        if (!desc.includes(query) && 
            !merchant.includes(query) && 
            !type.includes(query) && 
            !amount.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }, [transactions, from, to, searchQuery, selectedAccountId, quickFilter]);

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
        <button 
          className="btn" 
          onClick={() => onRefresh()} 
          disabled={loading}
          style={{ 
            marginLeft: "auto",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "⏳ Refreshing..." : "Refresh"}
        </button>
      </div>
      {/* Quick Filters */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          className={`quick-filter-btn ${quickFilter === "all" ? "active" : ""}`}
          onClick={() => {
            setQuickFilter("all");
            setFrom("");
            setTo("");
          }}
        >
          All
        </button>
        <button
          className={`quick-filter-btn ${quickFilter === "today" ? "active" : ""}`}
          onClick={() => {
            setQuickFilter("today");
            setFrom("");
            setTo("");
          }}
        >
          Today
        </button>
        <button
          className={`quick-filter-btn ${quickFilter === "week" ? "active" : ""}`}
          onClick={() => {
            setQuickFilter("week");
            setFrom("");
            setTo("");
          }}
        >
          This Week
        </button>
        <button
          className={`quick-filter-btn ${quickFilter === "month" ? "active" : ""}`}
          onClick={() => {
            setQuickFilter("month");
            setFrom("");
            setTo("");
          }}
        >
          This Month
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{ marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ flex: "1", minWidth: "200px" }}>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ width: "100%" }}
            />
          </div>
          
          {/* Account Filter */}
          {accounts.length > 1 && (
            <div style={{ minWidth: "200px" }}>
              <select
                className="form-input"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountType || "Account"} •••• {acc.accountNumber?.slice(-4) || acc.id}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Date Range (when not using quick filter) */}
        {quickFilter === "all" && (
          <div className="filter-row">
            <label>
              From
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setQuickFilter("all");
                }}
                className="date-input"
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setQuickFilter("all");
                }}
                className="date-input"
              />
            </label>
            {(from || to) && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transaction Count */}
      <div style={{ marginBottom: "0.75rem", fontSize: "13px", color: "#6b7280" }}>
        Showing {filtered.length} {filtered.length === 1 ? "transaction" : "transactions"}
        {searchQuery && ` matching "${searchQuery}"`}
        {selectedAccountId && ` for selected account`}
      </div>

      <div className="tx-list">
        {filtered.map((t) => {
          const isPositive = t.transactionType === "DEPOSIT" || t.transactionType === "TRANSFER_IN" || t.transactionType === "REFUND";
          const amount = t.amount || 0;
          const typeInfo = getTransactionTypeInfo(t.transactionType);
          const desc = t.description || t.merchantName || `${t.transactionType} Transaction`;
          const accountInfo = t.account ? accounts.find(a => a.id === t.account.id) : null;
          
          return (
            <div key={t.id} className="tx-row">
              <div className="tx-meta" style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{typeInfo.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div className="tx-desc">{desc}</div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "4px" }}>
                      <div className="tx-date">{formatDate(t.transactionTimestamp)}</div>
                      {accountInfo && accounts.length > 1 && (
                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                          {accountInfo.accountType} •••• {accountInfo.accountNumber?.slice(-4)}
                        </span>
                      )}
                      <span style={{ 
                        fontSize: "11px", 
                        padding: "2px 6px", 
                        borderRadius: "4px",
                        backgroundColor: typeInfo.color + "20",
                        color: typeInfo.color,
                        fontWeight: "500"
                      }}>
                        {typeInfo.label}
                      </span>
                    </div>
                    {t.fraudStatus === "FLAGGED" && (
                      <div style={{ 
                        color: "#dc2626", 
                        fontSize: "0.85em", 
                        marginTop: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        <span>⚠️</span>
                        <span>Flagged for review</span>
                        {t.fraudReasons && (
                          <span style={{ color: "#9ca3af", fontSize: "0.9em" }}>
                            ({t.fraudReasons})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`tx-amount ${isPositive ? "tx-positive" : "tx-negative"}`} style={{ fontSize: "16px", fontWeight: "700" }}>
                {isPositive ? "+" : "-"}${Math.abs(amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty" style={{ padding: "2rem", textAlign: "center" }}>
            {searchQuery || selectedAccountId || from || to ? (
              <>
                <div style={{ fontSize: "24px", marginBottom: "0.5rem" }}>🔍</div>
                <div>No transactions found matching your filters.</div>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedAccountId("");
                    setFrom("");
                    setTo("");
                    setQuickFilter("all");
                  }}
                  style={{ marginTop: "1rem", fontSize: "14px" }}
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: "24px", marginBottom: "0.5rem" }}>📋</div>
                <div>No transactions yet.</div>
              </>
            )}
          </div>
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
        <button 
          className="btn" 
          onClick={() => onRefresh()} 
          disabled={loading}
          style={{ 
            marginLeft: "auto",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "⏳ Refreshing..." : "Refresh"}
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

/* ------------ TRANSACTION FORM ------------ */

function TransactionForm({ accountId, accountNumber, currentBalance, accounts, userRole, onSuccess, onCreateTransaction }) {
  // Regular users can only transfer; admins can do all transaction types
  const isCustomer = userRole === "CUSTOMER";
  const defaultType = isCustomer ? "TRANSFER_OUT" : "DEPOSIT";
  
  const [transactionType, setTransactionType] = useState(defaultType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get available destination accounts (exclude current account)
  const availableAccounts = accounts.filter(acc => acc.id !== accountId);
  const isTransfer = transactionType === "TRANSFER_OUT" || transactionType === "TRANSFER_IN";
  const canTransfer = availableAccounts.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate that user has multiple accounts for transfers
    if (isTransfer && !canTransfer) {
      setError("You need at least one other account to make transfers. Please contact support to open another account.");
      setLoading(false);
      return;
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount greater than zero");
      setLoading(false);
      return;
    }

    // Validate destination account for transfers (always required)
    if (isTransfer && !destinationAccountId) {
      setError("Please select a destination account for the transfer");
      setLoading(false);
      return;
    }

    try {
      // Determine source and destination accounts based on transfer type
      // TRANSFER_OUT: source = current account (accountId), destination = dropdown account
      // TRANSFER_IN: source = dropdown account, destination = current account (accountId)
      
      let sourceAccountId, destinationAccountIdNum;
      
      if (transactionType === "TRANSFER_OUT") {
        sourceAccountId = accountId;
        destinationAccountIdNum = parseInt(destinationAccountId);
      } else {
        // TRANSFER_IN
        sourceAccountId = parseInt(destinationAccountId);
        destinationAccountIdNum = accountId;
      }
      
      // Get account numbers for descriptions
      const sourceAccount = accounts.find(acc => acc.id === sourceAccountId);
      const destinationAccount = accounts.find(acc => acc.id === destinationAccountIdNum);
      const sourceAccountNumber = sourceAccount?.accountNumber || sourceAccountId.toString();
      const destinationAccountNumber = destinationAccount?.accountNumber || destinationAccountIdNum.toString();
      
      // Create TRANSFER_OUT on source account first (this checks for sufficient funds)
      const transferOutData = {
        account: { id: sourceAccountId },
        transactionType: "TRANSFER_OUT",
        amount: amountNum,
        description: description || `Transfer to ${destinationAccountNumber}`,
      };
      
      const transferOutResult = await onCreateTransaction(transferOutData);
      
      if (!transferOutResult.success) {
        // Format error message to be more user-friendly
        let errorMsg = transferOutResult.error || "Failed to initiate transfer";
        if (errorMsg.includes("Insufficient funds")) {
          const sourceBalance = sourceAccount?.balance || 0;
          errorMsg = `You don't have enough funds in ${sourceAccountNumber}. Your balance is $${sourceBalance.toFixed(2)}, but you're trying to transfer $${amountNum.toFixed(2)}. Please reduce the amount or add funds to your account.`;
        }
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      // If TRANSFER_OUT succeeds, create corresponding TRANSFER_IN on destination account
      try {
        const transferInData = {
          account: { id: destinationAccountIdNum },
          transactionType: "TRANSFER_IN",
          amount: amountNum,
          description: description || `Transfer from ${sourceAccountNumber}`,
        };
        await onCreateTransaction(transferInData);
      } catch (transferErr) {
        console.error("Failed to create corresponding TRANSFER_IN:", transferErr);
        setError("Transfer initiated but failed to complete. Please contact support.");
        setLoading(false);
        return;
      }
      
      // Both transactions succeeded
      const result = { success: true };
      
      const successMsg = `Transfer of $${amountNum.toFixed(2)} completed successfully!`;
      
      setSuccess(successMsg);
      // Reset form
      setAmount("");
      setDescription("");
      setDestinationAccountId("");
      // Clear success message after 3 seconds and call onSuccess
      setTimeout(async () => {
        setSuccess("");
        await onSuccess(result);
      }, 2000);
    } catch (err) {
      // Format error message to be more user-friendly
      let errorMsg = err.message || "An error occurred while creating the transaction";
      if (errorMsg.includes("Insufficient funds")) {
        // Find the source account for error message
        let sourceAccountForError = null;
        if (isTransfer) {
          const sourceAccountIdForError = transactionType === "TRANSFER_OUT" 
            ? accountId 
            : parseInt(destinationAccountId);
          sourceAccountForError = accounts.find(acc => acc.id === sourceAccountIdForError);
        } else {
          sourceAccountForError = accounts.find(acc => acc.id === accountId);
        }
        const sourceBalance = sourceAccountForError?.balance || 0;
        errorMsg = `You don't have enough funds. Your balance is $${sourceBalance.toFixed(2)}, but you're trying to transfer $${amountNum.toFixed(2)}. Please reduce the amount.`;
      } else if (errorMsg.includes("Account not found")) {
        errorMsg = "One of the accounts doesn't exist. Please refresh the page and try again.";
      } else if (errorMsg.includes("expired") || errorMsg.includes("Unauthorized")) {
        errorMsg = "Your session has expired. Please refresh the page and login again.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-form">
      <h4 style={{ marginTop: "1.5rem", marginBottom: "1rem", fontSize: "16px", fontWeight: "600" }}>
        Create New Transaction
      </h4>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Transaction Type</label>
          <select
            className="form-input"
            value={transactionType}
            onChange={(e) => {
              setTransactionType(e.target.value);
              // Reset destination account when changing type
              setDestinationAccountId("");
            }}
            required
          >
            {!isCustomer && (
              <>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="PURCHASE">Purchase</option>
              </>
            )}
            {canTransfer && <option value="TRANSFER_OUT">Transfer Out</option>}
            {canTransfer && <option value="TRANSFER_IN">Transfer In</option>}
          </select>
          {isCustomer && !canTransfer && (
            <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px" }}>
              ⚠️ You need at least one other account to make transfers. Please contact support to open another account.
            </p>
          )}
          {isCustomer && canTransfer && (
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              Regular users can only transfer between accounts
            </p>
          )}
        </div>

        {isTransfer && canTransfer && (
          <div className="form-group">
            <label className="form-label">
              {transactionType === "TRANSFER_OUT" ? "Transfer To Account" : "Transfer From Account"}
            </label>
            <select
              className="form-input"
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              required
            >
              <option value="">Select account...</option>
              {availableAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountType || "Account"} •••• {acc.accountNumber?.slice(-4) || acc.id} 
                  {acc.balance !== undefined && ` (Balance: $${acc.balance.toFixed(2)})`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Amount ($)</label>
          <input
            type="number"
            className="form-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <input
            type="text"
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Transaction description"
            maxLength={500}
          />
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            {success}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn" 
            disabled={loading || (isTransfer && !canTransfer)}
          >
            {loading ? "Processing..." : "Create Transaction"}
          </button>
          {isTransfer && !canTransfer && (
            <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px" }}>
              Cannot create transfer: You need at least one other account
            </p>
          )}
        </div>

        <div style={{ marginTop: "0.75rem", fontSize: "12px", color: "#6b7280" }}>
          Account: {accountNumber} | Current Balance: ${(currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </form>
    </div>
  );
}

/* ------------ CREATE ACCOUNT FORM ------------ */

function CreateAccountForm({ onSuccess, onCreateAccount }) {
  const [accountType, setAccountType] = useState("CHECKING");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Generate account number if not provided
    let finalAccountNumber = accountNumber.trim();
    if (!finalAccountNumber) {
      // Generate account number: uppercase type prefix + random 6 digits (must be 6-20 chars, uppercase A-Z0-9)
      const prefix = accountType === "CHECKING" ? "C" : accountType === "SAVINGS" ? "S" : "B";
      // Generate 6 random digits to meet minimum length requirement (6 chars total)
      const random = Math.floor(100000 + Math.random() * 900000);
      finalAccountNumber = `${prefix}${random}`;
    } else {
      // Convert to uppercase to match validation pattern
      finalAccountNumber = finalAccountNumber.toUpperCase();
    }

    try {
      const accountData = {
        accountType: accountType,
        accountNumber: finalAccountNumber,
        balance: 0,
        isActive: true,
      };

      const result = await onCreateAccount(accountData);
      
      if (result.success) {
        setSuccess(`Account ${finalAccountNumber} created successfully!`);
        // Reset form
        setAccountType("CHECKING");
        setAccountNumber("");
        // Clear success message and call onSuccess
        setTimeout(async () => {
          setSuccess("");
          await onSuccess(result);
        }, 2000);
      } else {
        let errorMsg = result.error || "Failed to create account";
        if (errorMsg.includes("already exists") || errorMsg.includes("duplicate")) {
          errorMsg = "An account with this number already exists. Please use a different account number or leave it blank to auto-generate.";
        } else if (errorMsg.includes("validation") || errorMsg.includes("Validation")) {
          errorMsg = "Please check your input. Account number must be 6-20 uppercase letters and numbers.";
        }
        setError(errorMsg);
      }
    } catch (err) {
      let errorMsg = err.message || "An error occurred while creating the account";
      if (errorMsg.includes("already exists") || errorMsg.includes("duplicate")) {
        errorMsg = "An account with this number already exists. Please use a different account number.";
      } else if (errorMsg.includes("validation") || errorMsg.includes("Validation")) {
        errorMsg = "Please check your input. Account number must be 6-20 uppercase letters and numbers.";
      } else if (errorMsg.includes("expired") || errorMsg.includes("Unauthorized")) {
        errorMsg = "Your session has expired. Please refresh the page and login again.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-form" style={{ marginTop: "1rem" }}>
      <h4 style={{ marginTop: "0", marginBottom: "1rem", fontSize: "16px", fontWeight: "600" }}>
        Create New Account
      </h4>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Account Type</label>
          <select
            className="form-input"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            required
          >
            <option value="CHECKING">Checking</option>
            <option value="SAVINGS">Savings</option>
            <option value="BUSINESS">Business</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Account Number (Optional)</label>
          <input
            type="text"
            className="form-input"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Leave blank to auto-generate"
            maxLength={20}
            pattern="[A-Z0-9]{6,20}"
            style={{ textTransform: "uppercase" }}
          />
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            Leave blank to auto-generate (e.g., C123456 for checking). Must be 6-20 uppercase letters/numbers.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            {success}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ 
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
              position: "relative"
            }}
          >
            {loading ? (
              <>
                <span style={{ marginRight: "8px" }}>⏳</span>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
