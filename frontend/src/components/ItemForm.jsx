import { useEffect, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_LABELS } from "../api/items.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function ItemForm({
  initial,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageError, setImageError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleImageChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError("Bitte wähle eine Bilddatei (z. B. JPG oder PNG).");
      setImage(null);
      setPreview(null);
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Das Bild ist zu groß. Maximale Größe: 5 MB.");
      setImage(null);
      setPreview(null);
      event.target.value = "";
      return;
    }
    setImageError("");
    setImage(file);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(URL.createObjectURL(file));
  }

  function validate() {
    const errors = {};
    if (!name.trim()) {
      errors.name = "Bitte gib einen Namen ein.";
    }
    if (!category) {
      errors.category = "Bitte wähle eine Kategorie.";
    }
    if (!isEdit && !image) {
      errors.image = "Bitte wähle ein Bild aus.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    onSubmit({
      name: name.trim(),
      category,
      description: description.trim(),
      color: color.trim(),
      image,
    });
  }

  return (
    <form className="item-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field-label" htmlFor="item-name">
          Name
        </label>
        <input
          id="item-name"
          type="text"
          className={`input${fieldErrors.name ? " has-error" : ""}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Schwarzes Abendkleid"
        />
        {fieldErrors.name ? (
          <p className="field-error">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="item-category">
          Kategorie
        </label>
        <select
          id="item-category"
          className={`input${fieldErrors.category ? " has-error" : ""}`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Bitte wählen …</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        {fieldErrors.category ? (
          <p className="field-error">{fieldErrors.category}</p>
        ) : null}
      </div>

      <div className="field">
        <span className="field-label" id="item-image-label">
          Bild
        </span>
        <div
          className={`dropzone${imageError || fieldErrors.image ? " has-error" : ""}`}
          role="button"
          tabIndex={0}
          aria-labelledby="item-image-label"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current && fileInputRef.current.click();
            }
          }}
        >
          {preview ? (
            <img className="dropzone-preview" src={preview} alt="Vorschau" />
          ) : (
            <span className="dropzone-hint">
              {isEdit
                ? "Neues Bild auswählen (optional) – das aktuelle Bild bleibt sonst erhalten."
                : "Bild auswählen – zum Hochladen hier klicken."}
            </span>
          )}
          <input
            ref={fileInputRef}
            id="item-image"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageChange}
          />
        </div>
        {imageError ? <p className="field-error">{imageError}</p> : null}
        {fieldErrors.image ? (
          <p className="field-error">{fieldErrors.image}</p>
        ) : null}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="item-description">
          Beschreibung (optional)
        </label>
        <textarea
          id="item-description"
          className="input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Weitere Details …"
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="item-color">
          Farbe (optional)
        </label>
        <input
          id="item-color"
          type="text"
          className="input"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="z. B. Schwarz"
        />
      </div>

      {serverError ? (
        <p className="form-error" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? "Speichern …" : isEdit ? "Speichern" : "Anlegen"}
        </button>
      </div>
    </form>
  );
}
