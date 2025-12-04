import React, { useMemo, useState, useEffect } from "react";
import "./DashboardPage.css";
import { getAccounts, getTransactions, getFraudAlerts, createTransaction } from "./api";

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

function TransactionsPage({ transactions, loading, onRefresh }) {
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
  const showDestinationAccount = (transactionType === "TRANSFER_OUT" || transactionType === "TRANSFER_IN") && availableAccounts.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount greater than zero");
      setLoading(false);
      return;
    }

    // Validate destination account for transfers
    if (showDestinationAccount && !destinationAccountId) {
      setError("Please select a destination account for the transfer");
      setLoading(false);
      return;
    }

    try {
      // For TRANSFER_OUT, create transaction on source account
      // For TRANSFER_IN, create transaction on destination account
      let targetAccountId = accountId;
      if (transactionType === "TRANSFER_IN" && destinationAccountId) {
        targetAccountId = parseInt(destinationAccountId);
      }

      const transactionData = {
        account: { id: targetAccountId },
        transactionType: transactionType,
        amount: amountNum,
        description: description || undefined,
      };

      // If TRANSFER_OUT, we should also create TRANSFER_IN on destination account
      // For now, we'll just create the TRANSFER_OUT and note that the backend
      // should handle creating the corresponding TRANSFER_IN
      // TODO: Backend should handle creating both transactions for transfers
      
      const result = await onCreateTransaction(transactionData);
      
      if (result.success) {
        // If TRANSFER_OUT, create corresponding TRANSFER_IN
        if (transactionType === "TRANSFER_OUT" && destinationAccountId) {
          try {
            const transferInData = {
              account: { id: parseInt(destinationAccountId) },
              transactionType: "TRANSFER_IN",
              amount: amountNum,
              description: description || `Transfer from ${accountNumber}`,
            };
            await onCreateTransaction(transferInData);
          } catch (transferErr) {
            console.error("Failed to create corresponding TRANSFER_IN:", transferErr);
            // Don't fail the whole operation, but log the error
          }
        }

        const successMsg = transactionType === "TRANSFER_OUT" 
          ? `Transfer of $${amountNum.toFixed(2)} completed successfully!`
          : `Transaction ${transactionType.toLowerCase()} of $${amountNum.toFixed(2)} completed successfully!`;
        
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
      } else {
        setError(result.error || "Failed to create transaction");
      }
    } catch (err) {
      setError(err.message || "An error occurred while creating the transaction");
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
            <option value="TRANSFER_OUT">Transfer Out</option>
            {availableAccounts.length > 0 && (
              <option value="TRANSFER_IN">Transfer In</option>
            )}
          </select>
          {isCustomer && (
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              Regular users can only transfer between accounts
            </p>
          )}
        </div>

        {showDestinationAccount && (
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
            {availableAccounts.length === 0 && (
              <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px" }}>
                You need at least one other account to make transfers
              </p>
            )}
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
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Processing..." : "Create Transaction"}
          </button>
        </div>

        <div style={{ marginTop: "0.75rem", fontSize: "12px", color: "#6b7280" }}>
          Account: {accountNumber} | Current Balance: ${(currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      </form>
    </div>
  );
}
