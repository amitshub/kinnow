// Base URL of the FastAPI backend.
// For local dev this points at uvicorn's default port.
// When packaging for the Android WebView, set VITE_API_URL at build time
// to your deployed backend's public URL.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TOKEN_KEY = "kinonow_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let payload = body;
  if (body && !isForm) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: payload,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new ApiError(typeof message === "string" ? message : JSON.stringify(message), res.status);
  }

  return data;
}

function qs(params) {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (clean.length === 0) return "";
  return "?" + new URLSearchParams(clean).toString();
}

export const api = {
  // ---- Auth ----
  async login(mobile, password) {
    const form = new URLSearchParams();
    form.set("username", mobile);
    form.set("password", password);
    const data = await request("/auth/login", { method: "POST", body: form, isForm: true });
    setToken(data.access_token);
    return data;
  },
  logout() {
    setToken(null);
  },
  me() {
    return request("/auth/me");
  },

  // ---- Packhouses ----
  listPackhouses() {
    return request("/packhouses");
  },

  // ---- Growers ----
  listGrowers(params = {}) {
    return request(`/growers${qs(params)}`);
  },
  createGrower(payload, packhouseId) {
    return request(`/growers${qs({ packhouse_id: packhouseId })}`, { method: "POST", body: payload });
  },
  updateGrower(id, payload) {
    return request(`/growers/${id}`, { method: "PUT", body: payload });
  },
  deleteGrower(id) {
    return request(`/growers/${id}`, { method: "DELETE" });
  },

  // ---- Incoming ----
  listIncoming(params = {}) {
    return request(`/incoming${qs(params)}`);
  },
  createIncoming(payload, packhouseId) {
    return request(`/incoming${qs({ packhouse_id: packhouseId })}`, { method: "POST", body: payload });
  },
  updateIncoming(id, payload) {
    return request(`/incoming/${id}`, { method: "PUT", body: payload });
  },
  deleteIncoming(id) {
    return request(`/incoming/${id}`, { method: "DELETE" });
  },

  // ---- Day summary ----
  listDaySummaries(params = {}) {
    return request(`/day-summary${qs(params)}`);
  },
  getDaySummary(date, params = {}) {
    return request(`/day-summary/${date}${qs(params)}`);
  },
  saveDaySummary(payload, packhouseId) {
    return request(`/day-summary${qs({ packhouse_id: packhouseId })}`, { method: "PUT", body: payload });
  },

  // ---- Payments ----
  listPayments(params = {}) {
    return request(`/payments${qs(params)}`);
  },
  createPayment(payload, packhouseId) {
    return request(`/payments${qs({ packhouse_id: packhouseId })}`, { method: "POST", body: payload });
  },
  approvePayment(id) {
    return request(`/payments/${id}/approve`, { method: "POST" });
  },
  rejectPayment(id) {
    return request(`/payments/${id}/reject`, { method: "POST" });
  },

  // ---- Users (admin) ----
  listUsers() {
    return request("/users");
  },
  createUser(payload) {
    return request("/users", { method: "POST", body: payload });
  },
  updateUser(id, payload) {
    return request(`/users/${id}`, { method: "PUT", body: payload });
  },
  toggleUserStatus(id) {
    return request(`/users/${id}/toggle-status`, { method: "PATCH" });
  },
  deleteUser(id) {
    return request(`/users/${id}`, { method: "DELETE" });
  },

  // ---- Customers (admin) ----
  listCustomers() {
    return request("/customers");
  },
  createCustomer(payload) {
    return request("/customers", { method: "POST", body: payload });
  },
  updateCustomer(id, payload) {
    return request(`/customers/${id}`, { method: "PUT", body: payload });
  },

  // ---- Orders (admin) ----
  listOrders(params = {}) {
    return request(`/orders${qs(params)}`);
  },
  createOrder(payload, packhouseId) {
    return request(`/orders${qs({ packhouse_id: packhouseId })}`, { method: "POST", body: payload });
  },
  updateOrderStatus(id, status) {
    return request(`/orders/${id}/status`, { method: "PATCH", body: { status } });
  },
  updateOrderChallan(id, payload) {
    return request(`/orders/${id}/challan`, { method: "PATCH", body: payload });
  },
};

export { ApiError };
