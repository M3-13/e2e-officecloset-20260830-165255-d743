import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { login, getAuthErrorMessage } from "../api/auth.js";
import "../styles/auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const errors = {};
    if (!email.trim()) {
      errors.email = "Bitte gib deine E-Mail-Adresse ein.";
    } else if (!EMAIL_RE.test(email.trim())) {
      errors.email = "Bitte gib eine gültige E-Mail-Adresse ein.";
    }
    if (!password) {
      errors.password = "Bitte gib dein Passwort ein.";
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const result = await login({ email: email.trim(), password });
      signIn(result.access_token, result.user);
      navigate("/garderobe");
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page auth-page">
      <div className="auth-card">
        <h1 className="page-title">Anmelden</h1>
        <p className="page-subtitle">
          Melde dich an, um deine Garderobe zu verwalten.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <div className="form-banner" role="alert">
              {formError}
            </div>
          ) : null}

          <div className="form-field">
            <label className="form-label" htmlFor="login-email">
              E-Mail
            </label>
            <input
              id="login-email"
              className={`form-input${fieldErrors.email ? " has-error" : ""}`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              placeholder="du@beispiel.de"
            />
            {fieldErrors.email ? (
              <span className="form-error">{fieldErrors.email}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="login-password">
              Passwort
            </label>
            <input
              id="login-password"
              className={`form-input${fieldErrors.password ? " has-error" : ""}`}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password ? (
              <span className="form-error">{fieldErrors.password}</span>
            ) : null}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Anmeldung läuft…" : "Anmelden"}
          </button>
        </form>

        <p className="auth-links">
          Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
        </p>
      </div>
    </section>
  );
}
