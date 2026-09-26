import {
  apiRequest,
  type ApiResponse,
  type PaginatedApiResponse,
} from "./client";

export interface InventoryRow {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  quantity: number | string;
  reserved_quantity: number | string;
  created_at: string;
  updated_at: string;
}

export interface InventorySummary {
  product_id: string;
  product_name: string | null;
  sku: string | null;
  total_quantity: string;
  total_reserved: string;
  total_available: string;
}

export type ReceiveStockPayload = {
  product_id: string;
  warehouse_id: string;
  location_id: string;
  quantity: number;
  reference_type?: string;
};

export type DeliverStockPayload = ReceiveStockPayload;

export type TransferStockPayload = {
  product_id: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  source_location_id: string;
  destination_location_id: string;
  quantity: number;
};

export type AdjustStockPayload = {
  product_id: string;
  warehouse_id: string;
  location_id: string;
  quantity_delta: number;
};

export async function listInventory(): Promise<
  PaginatedApiResponse<InventoryRow>
> {
  const response = await apiRequest<InventoryRow[]>(
    "/inventory?page=1&page_size=100"
  );

  return response as PaginatedApiResponse<InventoryRow>;
}

export async function getInventorySummary(): Promise<
  ApiResponse<InventorySummary[]>
> {
  return apiRequest<InventorySummary[]>("/inventory/summary");
}

export async function receiveStock(
  payload: ReceiveStockPayload
) {
  return apiRequest<Record<string, unknown>>(
    "/inventory/transactions/receive_stock",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function deliverStock(
  payload: DeliverStockPayload
) {
  return apiRequest<Record<string, unknown>>(
    "/inventory/transactions/deliver_stock",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function transferStock(
  payload: TransferStockPayload
) {
  return apiRequest<Record<string, unknown>>(
    "/inventory/transactions/transfer_stock",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function adjustStock(
  payload: AdjustStockPayload
) {
  return apiRequest<Record<string, unknown>>(
    "/inventory/transactions/adjust_stock",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}