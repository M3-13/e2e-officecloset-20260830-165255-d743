import { resolveImageUrl } from "../api/outfits.js";

export const CATEGORIES = [
  { value: "oberteil", label: "Oberteil" },
  { value: "hose", label: "Hose" },
  { value: "kleid", label: "Kleid" },
  { value: "schuhe", label: "Schuhe" },
  { value: "accessoire", label: "Accessoire" },
];

export function categoryLabel(value) {
  const found = CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value;
}

export default function OutfitItemPicker({
  items = [],
  selectedIds = [],
  onToggle,
  categories = CATEGORIES,
}) {
  const selected = new Set(selectedIds);

  return (
    <div className="picker">
      {categories.map((category) => {
        const categoryItems = items.filter(
          (item) => item.category === category.value,
        );

        return (
          <div className="picker-category" key={category.value}>
            <h3 className="picker-category-title">{category.label}</h3>
            {categoryItems.length === 0 ? (
              <p className="picker-empty">
                Noch kein Kleidungsstück in dieser Kategorie.
              </p>
            ) : (
              <div className="picker-grid">
                {categoryItems.map((item) => {
                  const isSelected = selected.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`picker-item${isSelected ? " is-selected" : ""}`}
                      aria-pressed={isSelected}
                      onClick={() => onToggle && onToggle(item)}
                    >
                      {item.image_url ? (
                        <img
                          className="picker-item-image"
                          src={resolveImageUrl(item.image_url)}
                          alt={item.name}
                        />
                      ) : (
                        <span className="picker-item-placeholder" aria-hidden="true">
                          ✦
                        </span>
                      )}
                      <span className="picker-item-name">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
