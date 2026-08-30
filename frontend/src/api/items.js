import client from "./client.js";

export const CATEGORIES = ["oberteil", "hose", "kleid", "schuhe", "accessoire"];

export const CATEGORY_LABELS = {
  oberteil: "Oberteil",
  hose: "Hose",
  kleid: "Kleid",
  schuhe: "Schuhe",
  accessoire: "Accessoire",
};

function buildFormData({ name, category, image, description, color }) {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("category", category);
  if (image) {
    fd.append("image", image);
  }
  if (description) {
    fd.append("description", description);
  }
  if (color) {
    fd.append("color", color);
  }
  return fd;
}

export async function listItems() {
  return client.get("/api/items");
}

export async function getItem(id) {
  return client.get(`/api/items/${id}`);
}

export async function createItem(input) {
  return client.post("/api/items", buildFormData(input));
}

export async function updateItem(id, input) {
  return client.patch(`/api/items/${id}`, buildFormData(input));
}

export async function deleteItem(id) {
  return client.del(`/api/items/${id}`);
}

export async function loadItemImage(imageUrl) {
  const response = await client.request(imageUrl, { method: "GET" });
  if (!response.ok) {
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
        : `Bild konnte nicht geladen werden (${response.status})`;
    throw new client.ApiError(message, response.status, detail);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
