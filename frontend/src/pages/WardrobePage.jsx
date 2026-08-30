import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  createItem,
  deleteItem,
  listItems,
  updateItem,
} from "../api/items.js";
import ItemCard from "../components/ItemCard.jsx";
import ItemForm from "../components/ItemForm.jsx";
import "../styles/wardrobe.css";

export default function WardrobePage() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await listItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(
        err && err.message
          ? err.message
          : "Die Garderobe konnte nicht geladen werden.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    } else {
      setLoading(false);
      setItems([]);
    }
  }, [isAuthenticated, load]);

  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return items;
    }
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  function openCreate() {
    setEditingItem(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingItem(null);
    setFormError("");
  }

  async function handleSubmit(input) {
    setSubmitting(true);
    setFormError("");
    try {
      if (editingItem) {
        await updateItem(editingItem.id, input);
      } else {
        await createItem(input);
      }
      closeForm();
      await load();
    } catch (err) {
      setFormError(
        err && err.message ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function requestDelete(item) {
    setDeleteTarget(item);
    setDeleteError("");
  }

  function cancelDelete() {
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteItem(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setDeleteError(
        err && err.message ? err.message : "Löschen fehlgeschlagen.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="page">
        <h1 className="page-title">Garderobe</h1>
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            ✦
          </div>
          <h2 className="empty-state-title">Bitte melde dich an</h2>
          <p className="empty-state-text">
            Um deine Garderobe zu sehen, musst du angemeldet sein.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="wardrobe-header">
        <div>
          <h1 className="page-title">Garderobe</h1>
          <p className="page-subtitle">
            Verwalte deine Kleidungsstücke – anlegen, filtern, bearbeiten und
            löschen.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Kleidungsstück anlegen
        </button>
      </div>

      <div className="filter-chips" role="group" aria-label="Nach Kategorie filtern">
        <button
          type="button"
          className={`filter-chip${filter === "all" ? " is-active" : ""}`}
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          Alle
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`filter-chip${filter === c ? " is-active" : ""}`}
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="state-block" role="status">
          Lade Garderobe …
        </div>
      ) : loadError ? (
        <div className="state-block" role="alert">
          <h2 className="state-error-title">
            Die Garderobe konnte nicht geladen werden.
          </h2>
          <p className="state-error-text">{loadError}</p>
          <button type="button" className="btn btn-secondary" onClick={load}>
            Erneut versuchen
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            ✦
          </div>
          <h2 className="empty-state-title">
            {filter === "all"
              ? "Deine Garderobe ist leer"
              : "Keine Stücke in dieser Kategorie"}
          </h2>
          <p className="empty-state-text">
            {filter === "all"
              ? "Lege dein erstes Kleidungsstück an."
              : "Wähle eine andere Kategorie oder lege ein neues Stück an."}
          </p>
          {filter === "all" ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={openCreate}
            >
              Erstes Stück anlegen
            </button>
          ) : null}
        </div>
      ) : (
        <div className="wardrobe-grid">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={openEdit}
              onDelete={requestDelete}
            />
          ))}
        </div>
      )}

      {formOpen ? (
        <div className="modal-overlay" onClick={closeForm}>
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={
              editingItem
                ? "Kleidungsstück bearbeiten"
                : "Kleidungsstück anlegen"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {editingItem
                  ? "Kleidungsstück bearbeiten"
                  : "Kleidungsstück anlegen"}
              </h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Schließen"
                onClick={closeForm}
              >
                ×
              </button>
            </div>
            <ItemForm
              initial={editingItem}
              submitting={submitting}
              serverError={formError}
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Kleidungsstück löschen"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Kleidungsstück löschen?</h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Schließen"
                onClick={cancelDelete}
              >
                ×
              </button>
            </div>
            <p className="modal-text">
              Möchtest du „{deleteTarget.name}“ wirklich löschen? Dies kann
              nicht rückgängig gemacht werden.
            </p>
            {deleteError ? (
              <p className="form-error" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelDelete}
                disabled={deleting}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Löschen …" : "Löschen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
