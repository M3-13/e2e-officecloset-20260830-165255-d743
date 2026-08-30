import client from "./client.js";

export const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function listOutfits() {
  return client.get("/api/outfits");
}

export async function getOutfit(id) {
  return client.get(`/api/outfits/${id}`);
}

export async function createOutfit({ name, item_ids }) {
  return client.post("/api/outfits", { name, item_ids });
}

export async function updateOutfit(id, { name, item_ids }) {
  return client.patch(`/api/outfits/${id}`, { name, item_ids });
}

export async function deleteOutfit(id) {
  return client.del(`/api/outfits/${id}`);
}

export function resolveImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
