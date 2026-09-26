import { createClient } from "../supabase/client";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
  request_id?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be logged in to access StockSense.");
  }

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");
  headers.set(
    "Authorization",
    `Bearer ${session.access_token}`
  );

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const payload = (await response.json()) as
    | ApiResponse<T>
    | ApiErrorResponse;

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.message || "Something went wrong."
    );
  }

  return payload as ApiResponse<T>;
}