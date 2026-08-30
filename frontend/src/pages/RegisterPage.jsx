import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { register, getAuthErrorMessage } from "../api/auth.js";
import "../styles/auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login: signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const errors = {};
    if (!name.trim()) {
      errors.name = "Bitte gib deinen Namen ein.";
    }
    if (!email.trim()) {
      errors.email = "Bitte gib deine E-Mail-Adresse ein.";
    } else if (!EMAIL_RE.test(email.trim())) {
      errors.email = "Bitte gib eine gültige E-Mail-Adresse ein.";
    }
    if (!password) {
      errors.password = "Bitte gib ein Passwort ein.";
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
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
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
        <h1 className="page-title">Registrieren</h1>
        <p className="page-subtitle">
          Erstelle ein Konto und beginne mit deiner eigenen Garderobe.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <div className="form-banner" role="alert">
              {formError}
            </div>
          ) : null}

          <div className="form-field">
            <label className="form-label" htmlFor="register-name">
              Name
            </label>
            <input
              id="register-name"
              className={`form-input${fieldErrors.name ? " has-error" : ""}`}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              placeholder="Dein Name"
            />
            {fieldErrors.name ? (
              <span className="form-error">{fieldErrors.name}</span>
            ) : null}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="register-email">
              E-Mail
            </label>
            <input
              id="register-email"
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
            <label className="form-label" htmlFor="register-password">
              Passwort
            </label>
            <input
              id="register-password"
              className={`form-input${fieldErrors.password ? " has-error" : ""}`}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password ? (
              <span className="form-error">{fieldErrors.password}</span>
            ) : null}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Registrierung läuft…" : "Konto erstellen"}
          </button>
        </form>

        <p className="auth-links">
          Schon ein Konto? <Link to="/login">Jetzt anmelden</Link>
        </p>
      </div>
    </section>
  );
}
