// API utility functions for making authenticated requests

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

/**
 * Get the stored JWT token
 */
export function getToken() {
  return localStorage.getItem("jwt_token");
}

/**
 * Get stored user info
 */
export function getUser() {
  const userStr = localStorage.getItem("user_info");
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Make an authenticated API request
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
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    // Handle error response from backend (now with consistent format)
    const errorData = await response.json().catch(() => ({ 
      error: "Request failed",
      message: `HTTP ${response.status}: ${response.statusText}`
    }));
    
    // Use message field if available (from ErrorResponse DTO), otherwise error field
    const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
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
  
  // Store token and user info
  if (data.token) {
    localStorage.setItem("jwt_token", data.token);
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
  
  // Store token and user info
  if (data.token) {
    localStorage.setItem("jwt_token", data.token);
    localStorage.setItem("user_info", JSON.stringify({
      username: data.username,
      role: data.role
    }));
  }
  
  return data;
}

/**
 * Logout user
 */
export function logout() {
  localStorage.removeItem("jwt_token");
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

