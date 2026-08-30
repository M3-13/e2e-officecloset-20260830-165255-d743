const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function readToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function handleUnauthorized() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent("auth:unauthorized"));
}

async function parseError(response) {
  let detail = null;
  try {
    const body = await response.json();
    detail = body && body.detail ? body.detail : body;
  } catch {
    detail = null;
  }
  const message =
    typeof detail === "string" && detail
      ? detail
      : `Unerwarteter Fehler (${response.status})`;
  return new ApiError(message, response.status, detail);
}

async function request(path, options = {}) {
  const token = readToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (error) {
    throw new ApiError(
      "Netzwerkfehler – der Server ist nicht erreichbar.",
      0,
      error,
    );
  }

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError("Sitzung abgelaufen.", 401);
  }

  return response;
}

async function readJson(response) {
  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export async function get(path) {
  const response = await request(path, { method: "GET" });
  return readJson(response);
}

export async function post(path, body) {
  const options = { method: "POST" };
  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined && body !== null) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  const response = await request(path, options);
  return readJson(response);
}

export async function patch(path, body) {
  const options = { method: "PATCH" };
  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined && body !== null) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  const response = await request(path, options);
  return readJson(response);
}

export async function del(path) {
  const response = await request(path, { method: "DELETE" });
  return readJson(response);
}

const client = { get, post, patch, delete: del, del, request, ApiError };

export default client;
