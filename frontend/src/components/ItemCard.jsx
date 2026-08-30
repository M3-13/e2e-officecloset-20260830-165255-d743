import { useEffect, useState } from "react";
import { CATEGORY_LABELS, loadItemImage } from "../api/items.js";

export default function ItemCard({ item, onEdit, onDelete }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    if (!item.image_url) {
      setImageUrl(null);
      setImageFailed(true);
      return undefined;
    }

    setImageFailed(false);
    loadItemImage(item.image_url)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setImageUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setImageUrl(null);
          setImageFailed(true);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [item.image_url]);

  return (
    <article className="item-card">
      <div className="item-card-media">
        {imageUrl ? (
          <img className="item-card-image" src={imageUrl} alt={item.name} />
        ) : (
          <div className="item-card-placeholder" aria-hidden="true">
            {imageFailed ? "Kein Bild" : "Lädt …"}
          </div>
        )}
      </div>
      <div className="item-card-body">
        <h3 className="item-card-title">{item.name}</h3>
        <p className="item-card-meta">
          {CATEGORY_LABELS[item.category] || item.category}
        </p>
      </div>
      <div className="item-card-actions">
        <button
          type="button"
          className="btn btn-secondary item-card-btn"
          onClick={() => onEdit(item)}
        >
          Bearbeiten
        </button>
        <button
          type="button"
          className="btn btn-danger item-card-btn"
          onClick={() => onDelete(item)}
        >
          Löschen
        </button>
      </div>
    </article>
  );
}
