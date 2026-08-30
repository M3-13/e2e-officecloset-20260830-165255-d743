import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/outfit.css";
import client from "../api/client.js";
import {
  createOutfit,
  deleteOutfit,
  listOutfits,
  resolveImageUrl,
  updateOutfit,
} from "../api/outfits.js";
import { useAuth } from "../context/AuthContext.jsx";
import OutfitItemPicker, {
  CATEGORIES,
  categoryLabel,
} from "../components/OutfitItemPicker.jsx";

export default function OutfitCreatorPage() {
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [outfitsLoading, setOutfitsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const [outfitsError, setOutfitsError] = useState(null);

  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadItems = useCallback(async () => {
    setItemsLoading(true);
    setItemsError(null);
    try {
      const data = await client.get("/api/items");
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setItemsError(error.message || "Kleidungsstücke konnten nicht geladen werden.");
    } finally {
      setItemsLoading(false);
    }
  }, []);

  const loadOutfits = useCallback(async () => {
    setOutfitsLoading(true);
    setOutfitsError(null);
    try {
      const data = await listOutfits();
      setOutfits(Array.isArray(data) ? data : []);
    } catch (error) {
      setOutfitsError(error.message || "Outfits konnten nicht geladen werden.");
    } finally {
      setOutfitsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadItems();
    loadOutfits();
  }, [isAuthenticated, loadItems, loadOutfits]);

  const itemsById = useMemo(() => {
    const map = new Map();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  function handleToggle(item) {
    setFormError(null);
    setSelectedIds((prev) => {
      const withoutCategory = prev.filter(
        (id) => itemsById.get(id)?.category !== item.category,
      );
      if (prev.includes(item.id)) {
        return withoutCategory;
      }
      return [...withoutCategory, item.id];
    });
  }

  function resetForm() {
    setName("");
    setSelectedIds([]);
    setEditingId(null);
    setFormError(null);
  }

  async function handleSave(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Bitte gib deinem Outfit einen Namen.");
      return;
    }
    if (selectedIds.length === 0) {
      setFormError("Wähle mindestens ein Kleidungsstück aus.");
      return;
    }

    setSaving(true);
    setFormError(null);
    setActionError(null);
    try {
      if (editingId === null) {
        await createOutfit({ name: trimmed, item_ids: selectedIds });
      } else {
        await updateOutfit(editingId, {
          name: trimmed,
          item_ids: selectedIds,
        });
      }
      resetForm();
      await loadOutfits();
    } catch (error) {
      setFormError(error.message || "Das Outfit konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  function handleOpen(outfit) {
    setEditingId(outfit.id);
    setName(outfit.name || "");
    setSelectedIds(Array.isArray(outfit.item_ids) ? outfit.item_ids : []);
    setFormError(null);
    setActionError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(outfit) {
    setActionError(null);
    setDeletingId(outfit.id);
    try {
      await deleteOutfit(outfit.id);
      if (editingId === outfit.id) {
        resetForm();
      }
      await loadOutfits();
    } catch (error) {
      setActionError(error.message || "Das Outfit konnte nicht gelöscht werden.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="page">
        <h1 className="page-title">Outfit-Creator</h1>
        <div className="placeholder-card">
          <div className="placeholder-icon" aria-hidden="true">
            ✦
          </div>
          <h2 className="placeholder-title">Bitte melde dich an</h2>
          <p className="placeholder-text">
            Um Outfits zu erstellen, musst du angemeldet sein.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: "var(--space-3)" }}>
            Zur Anmeldung
          </Link>
        </div>
      </section>
    );
  }

  const selectedItems = selectedIds
    .map((id) => itemsById.get(id))
    .filter(Boolean)
    .sort(
      (a, b) =>
        CATEGORIES.findIndex((c) => c.value === a.category) -
        CATEGORIES.findIndex((c) => c.value === b.category),
    );

  return (
    <section className="page">
      <h1 className="page-title">Outfit-Creator</h1>
      <p className="page-subtitle">
        Kombiniere deine Kleidungsstücke zu einem Outfit und speichere es mit einem Namen.
      </p>

      <div className="outfit-layout">
        <div className="outfit-selector">
          <h2 className="outfit-section-title">Kleidungsstücke auswählen</h2>
          {itemsLoading ? (
            <p className="outfit-state" role="status">
              Kleidungsstücke werden geladen …
            </p>
          ) : itemsError ? (
            <p className="outfit-state outfit-state-error" role="alert">
              {itemsError}
            </p>
          ) : items.length === 0 ? (
            <p className="outfit-state">
              Deine Garderobe ist noch leer. Lege zuerst Kleidungsstücke an.
            </p>
          ) : (
            <OutfitItemPicker
              items={items}
              selectedIds={selectedIds}
              onToggle={handleToggle}
            />
          )}
        </div>

        <aside className="outfit-preview">
          <div className="outfit-preview-card">
            <h2 className="outfit-section-title">
              {editingId === null ? "Neues Outfit" : "Outfit bearbeiten"}
            </h2>

            {selectedItems.length === 0 ? (
              <p className="outfit-state">
                Wähle links Kleidungsstücke aus, um dein Outfit zu sehen.
              </p>
            ) : (
              <ul className="outfit-preview-list">
                {selectedItems.map((item) => (
                  <li className="outfit-preview-item" key={item.id}>
                    {item.image_url ? (
                      <img
                        className="outfit-preview-image"
                        src={resolveImageUrl(item.image_url)}
                        alt={item.name}
                      />
                    ) : (
                      <span className="picker-item-placeholder" aria-hidden="true">
                        ✦
                      </span>
                    )}
                    <div className="outfit-preview-meta">
                      <span className="outfit-preview-category">
                        {categoryLabel(item.category)}
                      </span>
                      <span className="outfit-preview-name">{item.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form className="outfit-form" onSubmit={handleSave}>
              <label className="outfit-label" htmlFor="outfit-name">
                Name
              </label>
              <input
                id="outfit-name"
                className="outfit-input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="z. B. Abendgarderobe"
              />

              {formError ? (
                <p className="outfit-form-error" role="alert">
                  {formError}
                </p>
              ) : null}

              <div className="outfit-form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Wird gespeichert …"
                    : editingId === null
                      ? "Outfit speichern"
                      : "Änderungen speichern"}
                </button>
                {editingId !== null ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Abbrechen
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </aside>
      </div>

      <section className="outfit-saved">
        <h2 className="outfit-section-title">Gespeicherte Outfits</h2>

        {actionError ? (
          <p className="outfit-state outfit-state-error" role="alert">
            {actionError}
          </p>
        ) : null}

        {outfitsLoading ? (
          <p className="outfit-state" role="status">
            Outfits werden geladen …
          </p>
        ) : outfitsError ? (
          <p className="outfit-state outfit-state-error" role="alert">
            {outfitsError}
          </p>
        ) : outfits.length === 0 ? (
          <p className="outfit-state">
            Du hast noch keine Outfits gespeichert.
          </p>
        ) : (
          <div className="outfit-saved-grid">
            {outfits.map((outfit) => {
              const thumbnails = (Array.isArray(outfit.item_ids)
                ? outfit.item_ids
                : []
              )
                .map((id) => itemsById.get(id))
                .filter(Boolean)
                .slice(0, 4);
              return (
                <article
                  className={`outfit-card${editingId === outfit.id ? " is-active" : ""}`}
                  key={outfit.id}
                >
                  <div className="outfit-card-thumbs">
                    {thumbnails.length === 0 ? (
                      <span className="picker-item-placeholder" aria-hidden="true">
                        ✦
                      </span>
                    ) : (
                      thumbnails.map((item) =>
                        item.image_url ? (
                          <img
                            key={item.id}
                            className="outfit-card-thumb"
                            src={resolveImageUrl(item.image_url)}
                            alt={item.name}
                          />
                        ) : null,
                      )
                    )}
                  </div>
                  <h3 className="outfit-card-name">{outfit.name}</h3>
                  <div className="outfit-card-actions">
                    <button
                      type="button"
                      className="btn btn-secondary outfit-card-btn"
                      onClick={() => handleOpen(outfit)}
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger outfit-card-btn"
                      onClick={() => handleDelete(outfit)}
                      disabled={deletingId === outfit.id}
                    >
                      {deletingId === outfit.id ? "Löscht …" : "Löschen"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
