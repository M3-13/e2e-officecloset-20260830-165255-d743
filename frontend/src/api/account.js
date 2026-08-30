import client from "./client.js";

export async function deleteAccount() {
  return client.delete("/api/account");
}
