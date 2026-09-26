const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

type Json = Record<string, unknown>;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function listProducts(params?: Record<string, string | number | boolean>) {
  const query = params ? new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString() : "";
  return request<Json[]>(`products${query ? `?${query}` : ""}`);
}

export async function getProduct(id: string) {
  return request<Json>(`products/${id}`);
}

export async function createProduct(payload: Json) {
  return request<Json>("products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id: string, payload: Json) {
  return request<Json>(`products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: string) {
  return request<{ success: boolean }>(`products/${id}`, { method: "DELETE" });
}

export default {
  list: listProducts,
  get: getProduct,
  create: createProduct,
  update: updateProduct,
  remove: deleteProduct,
};
