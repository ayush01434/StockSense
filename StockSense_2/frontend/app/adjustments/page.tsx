"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/layout/AppShell";
import { listResource } from "../../lib/api/resources";

type Adjustment = {
  id: string;
  reference: string;
  product_id: string | null;
  warehouse_id: string | null;
  location_id: string | null;
  quantity_delta: number | string;
  reason: string | null;
  status: string;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
};

type Warehouse = {
  id: string;
  name: string;
};

type Location = {
  id: string;
  name: string;
};

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [warehouses, setWarehouses] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [
          adjustmentResponse,
          productResponse,
          warehouseResponse,
          locationResponse,
        ] = await Promise.all([
          listResource<Adjustment>("adjustments", { pageSize: 100 }),
          listResource<Product>("products", { pageSize: 100 }),
          listResource<Warehouse>("warehouses", { pageSize: 100 }),
          listResource<Location>("locations", { pageSize: 100 }),
        ]);

        setAdjustments(adjustmentResponse.data);

        setProducts(
          Object.fromEntries(
            productResponse.data.map((item) => [item.id, item.name])
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
          err instanceof Error
            ? err.message
            : "Unable to load adjustments."
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <AppShell>
      <div style={headerStyle}>
        <div>
          <h1>Stock Adjustments</h1>
          <p style={subtitleStyle}>
            Review corrections made to physical inventory.
          </p>
        </div>

        <Link href="/adjustments/new" style={buttonStyle}>
          + New Adjustment
        </Link>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={tableWrapperStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headingStyle}>Reference</th>
              <th style={headingStyle}>Product</th>
              <th style={headingStyle}>Warehouse</th>
              <th style={headingStyle}>Location</th>
              <th style={headingStyle}>Change</th>
              <th style={headingStyle}>Reason</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={cellStyle} colSpan={6}>
                  Loading adjustments...
                </td>
              </tr>
            ) : adjustments.length === 0 ? (
              <tr>
                <td style={cellStyle} colSpan={6}>
                  No adjustments found.
                </td>
              </tr>
            ) : (
              adjustments.map((adjustment) => {
                const quantity = Number(adjustment.quantity_delta);

                return (
                  <tr key={adjustment.id}>
                    <td style={cellStyle}>
                      <Link
                        href={`/adjustments/${adjustment.id}`}
                        style={linkStyle}
                      >
                        {adjustment.reference}
                      </Link>
                    </td>

                    <td style={cellStyle}>
                      {adjustment.product_id
                        ? products[adjustment.product_id] ??
                          adjustment.product_id
                        : "—"}
                    </td>

                    <td style={cellStyle}>
                      {adjustment.warehouse_id
                        ? warehouses[adjustment.warehouse_id] ??
                          adjustment.warehouse_id
                        : "—"}
                    </td>

                    <td style={cellStyle}>
                      {adjustment.location_id
                        ? locations[adjustment.location_id] ??
                          adjustment.location_id
                        : "—"}
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        color: quantity >= 0 ? "#6ed890" : "#ff7b7b",
                        fontWeight: 700,
                      }}
                    >
                      {quantity >= 0 ? "+" : ""}
                      {quantity}
                    </td>

                    <td style={cellStyle}>
                      {adjustment.reason || "—"}
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

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
};

const subtitleStyle = {
  color: "#9ba3af",
  marginTop: "6px",
};

const buttonStyle = {
  background: "#ef5350",
  color: "white",
  padding: "10px 16px",
  borderRadius: "8px",
  textDecoration: "none",
};

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

const linkStyle = {
  color: "#ef5350",
  fontWeight: 600,
};

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "16px",
};