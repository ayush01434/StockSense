"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import { listInventory } from "../../lib/api/inventory";
import { listResource } from "../../lib/api/resources";

type InventoryRow = {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  quantity: number | string;
  reserved_quantity: number | string;
};

type NamedResource = {
  id: string;
  name: string;
};

type ProductResource = NamedResource & {
  sku: string;
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [products, setProducts] = useState<
    Record<string, ProductResource>
  >({});
  const [warehouses, setWarehouses] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [
          inventoryResponse,
          productResponse,
          warehouseResponse,
          locationResponse,
        ] = await Promise.all([
          listInventory(),
          listResource<ProductResource>("products", { pageSize: 100 }),
          listResource<NamedResource>("warehouses", { pageSize: 100 }),
          listResource<NamedResource>("locations", { pageSize: 100 }),
        ]);

        setInventory(inventoryResponse.data);

        setProducts(
          Object.fromEntries(
            productResponse.data.map((item) => [item.id, item])
          )
        );

        setWarehouses(
          Object.fromEntries(
            warehouseResponse.data.map((item) => [item.id, item.name])
          )
        );

        setLocations(
          Object.fromEntries(
            locationResponse.data.map((item) => [item.id, item.name])
          )
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load inventory."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <AppShell>
      <div style={{ marginBottom: 24 }}>
        <h1>Inventory</h1>

        <p style={{ color: "#9ba3af", marginTop: 6 }}>
          Current stock by product, warehouse and location.
        </p>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={tableWrapperStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headingStyle}>Product</th>
              <th style={headingStyle}>SKU</th>
              <th style={headingStyle}>Warehouse</th>
              <th style={headingStyle}>Location</th>
              <th style={headingStyle}>Quantity</th>
              <th style={headingStyle}>Reserved</th>
              <th style={headingStyle}>Available</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={cellStyle} colSpan={7}>
                  Loading inventory...
                </td>
              </tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td style={cellStyle} colSpan={7}>
                  No inventory found.
                </td>
              </tr>
            ) : (
              inventory.map((row) => {
                const quantity = Number(row.quantity);
                const reserved = Number(row.reserved_quantity);
                const available = quantity - reserved;

                return (
                  <tr key={row.id}>
                    <td style={cellStyle}>
                      {products[row.product_id]?.name ?? row.product_id}
                    </td>

                    <td style={cellStyle}>
                      {products[row.product_id]?.sku ?? "—"}
                    </td>

                    <td style={cellStyle}>
                      {warehouses[row.warehouse_id] ?? row.warehouse_id}
                    </td>

                    <td style={cellStyle}>
                      {locations[row.location_id] ?? row.location_id}
                    </td>

                    <td style={cellStyle}>{quantity}</td>

                    <td style={cellStyle}>{reserved}</td>

                    <td
                      style={{
                        ...cellStyle,
                        color: available > 0 ? "#6ed890" : "#ff7b7b",
                        fontWeight: 700,
                      }}
                    >
                      {available}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

const tableWrapperStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: "12px",
  overflowX: "auto" as const,
};

const headingStyle = {
  textAlign: "left" as const,
  padding: "16px",
  color: "#9ba3af",
  borderBottom: "1px solid #2b3038",
};

const cellStyle = {
  padding: "16px",
  borderBottom: "1px solid #2b3038",
};

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "16px",
};