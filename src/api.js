// API utility functions for making authenticated requests

// Use environment variable if set, otherwise use relative URL (same origin)
// This works when frontend is served from the backend
const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

/**
 * Get the stored JWT token
 */
export function getToken() {
  return localStorage.getItem("jwt_token");
}

/**
 * Get the stored refresh token
 */
export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

/**
 * Store tokens
 */
function storeTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem("jwt_token", accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("refresh_token", refreshToken);
  }
}

/**
 * Get stored user info
 */
export function getUser() {
  const userStr = localStorage.getItem("user_info");
  return userStr ? JSON.parse(userStr) : null;
}

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let refreshPromise = null;

/**
 * Format error messages to be more user-friendly
 */
function formatErrorMessage(message, statusCode) {
  // Handle insufficient funds errors
  if (message.includes("Insufficient funds")) {
    const match = message.match(/Current balance: \$?([\d,]+\.?\d*), Required: \$?([\d,]+\.?\d*)/);
    if (match) {
      const currentBalance = parseFloat(match[1].replace(/,/g, ''));
      const required = parseFloat(match[2].replace(/,/g, ''));
      const shortfall = (required - currentBalance).toFixed(2);
      return `You don't have enough funds for this transaction. Your current balance is $${currentBalance.toFixed(2)}, but you need $${required.toFixed(2)}. You're short by $${shortfall}.`;
    }
    return "You don't have enough funds in your account for this transaction. Please check your balance and try again.";
  }
  
  // Handle validation errors
  if (message.includes("validation") || message.includes("Validation")) {
    return message.replace(/validation/i, "Please check your input").replace(/Validation/i, "Please check your input");
  }
  
  // Handle account not found
  if (message.includes("Account not found") || message.includes("account") && message.includes("not found")) {
    return "The account you're trying to use doesn't exist. Please refresh the page and try again.";
  }
  
  // Handle unauthorized errors
  if (statusCode === 401 || message.includes("Unauthorized") || message.includes("expired")) {
    return "Your session has expired. Please login again.";
  }
  
  // Handle forbidden errors
  if (statusCode === 403 || message.includes("Forbidden")) {
    return "You don't have permission to perform this action.";
  }
  
  // Handle not found errors
  if (statusCode === 404) {
    return "The resource you're looking for doesn't exist.";
  }
  
  // Handle server errors
  if (statusCode >= 500) {
    return "Something went wrong on our end. Please try again in a moment. If the problem persists, contact support.";
  }
  
  // Return original message if no specific formatting needed
  return message;
}

/**
 * Make an authenticated API request with automatic token refresh
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // If we get a 401, try to refresh the token and retry once
  if (response.status === 401 && token && !endpoint.includes("/auth/")) {
    // Only attempt refresh once
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshToken().catch(() => {
        // Refresh failed, logout user
        logout();
        throw new Error("Your session has expired. Please login again.");
      }).finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }
    
    // Wait for refresh to complete
    await refreshPromise;
    
    // Retry the original request with new token
    const newToken = getToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      logout();
      throw new Error("Your session has expired. Please login again.");
    }
  }
  
  if (!response.ok) {
    // Handle error response from backend (now with consistent format)
    const errorData = await response.json().catch(() => ({ 
      error: "Request failed",
      message: `HTTP ${response.status}: ${response.statusText}`
    }));
    
    // Use message field if available (from ErrorResponse DTO), otherwise error field
    let errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
    
    // Make error messages more user-friendly
    errorMessage = formatErrorMessage(errorMessage, response.status);
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Login user
 */
export async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    // Handle error response from backend (now with consistent format)
    const errorData = await response.json().catch(() => ({ error: "Login failed" }));
    const errorMessage = errorData.message || errorData.error || "Invalid username or password";
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  
  // Store tokens and user info
  if (data.token) {
    storeTokens(data.token, data.refreshToken);
    localStorage.setItem("user_info", JSON.stringify({
      username: data.username,
      role: data.role
    }));
  }
  
  return data;
}

/**
 * Register new user
 */
export async function register(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    // Handle error response from backend (now with consistent format)
    const errorData = await response.json().catch(() => ({ error: "Registration failed" }));
    
    // Handle validation errors (which return an object with field errors)
    if (errorData.errors) {
      const errorMessages = Object.values(errorData.errors).join(", ");
      throw new Error(errorMessages || "Validation failed");
    }
    
    const errorMessage = errorData.message || errorData.error || "Registration failed";
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  
  // Store tokens and user info
  if (data.token) {
    storeTokens(data.token, data.refreshToken);
    localStorage.setItem("user_info", JSON.stringify({
      username: data.username,
      role: data.role
    }));
  }
  
  return data;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken() {
  const refreshTokenValue = getRefreshToken();
  
  if (!refreshTokenValue) {
    throw new Error("No refresh token available");
  }
  
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
  
  if (!response.ok) {
    // Refresh token is invalid, clear everything
    logout();
    throw new Error("Session expired. Please login again.");
  }
  
  const data = await response.json();
  
  // Store new tokens
  if (data.token) {
    storeTokens(data.token, data.refreshToken);
  }
  
  return data;
}

/**
 * Logout user
 */
export function logout() {
  localStorage.removeItem("jwt_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_info");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Fetch accounts for the authenticated user
 */
export async function getAccounts() {
  return apiRequest("/accounts");
}

/**
 * Fetch transactions with pagination and filters
 */
export async function getTransactions(params = {}) {
  const { page = 0, size = 20, startDate, endDate, type, accountId } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  if (type) queryParams.append("type", type);
  if (accountId) queryParams.append("accountId", accountId.toString());
  
  return apiRequest(`/transactions?${queryParams.toString()}`);
}

/**
 * Fetch fraud alerts (flagged transactions)
 */
export async function getFraudAlerts() {
  return apiRequest("/transactions/fraud/FLAGGED");
}

/**
 * Create a new transaction
 */
export async function createTransaction(transactionData) {
  return apiRequest("/transactions", {
    method: "POST",
    body: JSON.stringify(transactionData),
  });
}

/**
 * Create a new account for the current user
 */
export async function createAccount(accountData) {
  return apiRequest("/accounts", {
    method: "POST",
    body: JSON.stringify(accountData),
  });
}

