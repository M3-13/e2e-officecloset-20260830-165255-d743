import { ApiError, post } from "./client.js";

export async function register({ name, email, password }) {
  return post("/api/auth/register", { name, email, password });
}

export async function login({ email, password }) {
  return post("/api/auth/login", { email, password });
}

export async function logout() {
  return post("/api/auth/logout");
}

export function getAuthErrorMessage(error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "E-Mail oder Passwort ist falsch.";
      case 409:
        return "Diese E-Mail-Adresse ist bereits registriert.";
      case 429:
        return "Zu viele Versuche. Bitte versuche es später erneut.";
      default:
        return error.message;
    }
  }
  return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
}
