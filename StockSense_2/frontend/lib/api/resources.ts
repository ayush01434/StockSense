import {
  apiRequest,
  type ApiResponse,
  type PaginatedApiResponse,
} from "./client";

export type ResourceName =
  | "products"
  | "categories"
  | "receipts"
  | "deliveries"
  | "transfers"
  | "adjustments"
  | "ledger"
  | "warehouses"
  | "locations"
  | "suppliers"
  | "alerts";

type ListOptions = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listResource<T>(
  resource: ResourceName,
  options: ListOptions = {}
): Promise<PaginatedApiResponse<T>> {
  const params = new URLSearchParams();

  params.set("page", String(options.page ?? 1));
  params.set("page_size", String(options.pageSize ?? 20));

  if (options.search?.trim()) {
    params.set("search", options.search.trim());
  }

  const response = await apiRequest<T[]>(
    `/${resource}?${params.toString()}`
  );

  return response as PaginatedApiResponse<T>;
}

export async function getResource<T>(
  resource: ResourceName,
  id: string
): Promise<ApiResponse<T>> {
  return apiRequest<T>(`/${resource}/${id}`);
}

export async function createResource<T>(
  resource: ResourceName,
  payload: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(`/${resource}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateResource<T>(
  resource: ResourceName,
  id: string,
  payload: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return apiRequest<T>(`/${resource}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteResource(
  resource: ResourceName,
  id: string
): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/${resource}/${id}`, {
    method: "DELETE",
  });
}