import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { deleteAccount } from "../api/account.js";
import "./AccountPage.css";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function openConfirm() {
    setError(null);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    if (deleting) return;
    setConfirmOpen(false);
    setError(null);
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      logout();
      navigate("/login");
    } catch (err) {
      setError(
        err?.message || "Dein Konto konnte nicht gelöscht werden. Bitte versuche es erneut.",
      );
      setDeleting(false);
    }
  }

  return (
    <section className="page account-page">
      <h1 className="page-title">Konto</h1>
      <p className="page-subtitle">
        Verwalte dein Konto und deine persönlichen Daten.
      </p>

      <div className="account-card">
        <h2 className="account-card-title">Deine Daten</h2>
        <dl className="account-fields">
          <div className="account-field">
            <dt className="account-field-label">Name</dt>
            <dd className="account-field-value">{user.name}</dd>
          </div>
          <div className="account-field">
            <dt className="account-field-label">E-Mail</dt>
            <dd className="account-field-value">{user.email}</dd>
          </div>
        </dl>
      </div>

      <div className="account-card account-danger">
        <h2 className="account-card-title account-danger-title">
          Konto löschen
        </h2>
        <p className="account-danger-text">
          Das Löschen deines Kontos entfernt unwiderruflich alle deine
          Garderoben-, Outfit- und Bilddaten. Dieser Vorgang kann nicht
          rückgängig gemacht werden.
        </p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={openConfirm}
        >
          Konto löschen
        </button>
      </div>

      {confirmOpen ? (
        <div
          className="modal-overlay"
          onClick={closeConfirm}
        >
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="modal-title" id="delete-account-title">
              Konto wirklich löschen?
            </h2>
            <p className="modal-text">
              Diese Aktion ist endgültig und kann nicht rückgängig gemacht
              werden. Alle deine Daten werden dauerhaft gelöscht.
            </p>

            {error ? (
              <p className="account-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeConfirm}
                disabled={deleting}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Wird gelöscht …" : "Endgültig löschen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
