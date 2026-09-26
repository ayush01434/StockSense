"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import { listResource } from "../../lib/api/resources";

type LedgerEntry = {
  id: string;
  product_id: string;
  warehouse_id: string | null;
  location_id: string | null;
  movement_type: string;
  quantity_delta: number | string;
  balance_after: number | string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
};

type NamedResource = {
  id: string;
  name: string;
};

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [warehouses, setWarehouses] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [
          ledgerResponse,
          productResponse,
          warehouseResponse,
          locationResponse,
        ] = await Promise.all([
          listResource<LedgerEntry>("ledger", { pageSize: 100 }),
          listResource<NamedResource>("products", { pageSize: 100 }),
          listResource<NamedResource>("warehouses", { pageSize: 100 }),
          listResource<NamedResource>("locations", { pageSize: 100 }),
        ]);

        setEntries(ledgerResponse.data);

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
          err instanceof Error ? err.message : "Unable to load ledger."
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
        <h1>Move History</h1>

        <p style={{ color: "#9ba3af", marginTop: 6 }}>
          Complete stock movement ledger.
        </p>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={tableWrapperStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headingStyle}>Product</th>
              <th style={headingStyle}>Movement</th>
              <th style={headingStyle}>Warehouse</th>
              <th style={headingStyle}>Location</th>
              <th style={headingStyle}>Change</th>
              <th style={headingStyle}>Balance</th>
              <th style={headingStyle}>Date</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={cellStyle} colSpan={7}>
                  Loading move history...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td style={cellStyle} colSpan={7}>
                  No stock movements found.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const quantity = Number(entry.quantity_delta);

                return (
                  <tr key={entry.id}>
                    <td style={cellStyle}>
                      {products[entry.product_id] ?? entry.product_id}
                    </td>

                    <td style={cellStyle}>
                      {entry.movement_type.replaceAll("_", " ")}
                    </td>

                    <td style={cellStyle}>
                      {entry.warehouse_id
                        ? warehouses[entry.warehouse_id] ??
                          entry.warehouse_id
                        : "—"}
                    </td>

                    <td style={cellStyle}>
                      {entry.location_id
                        ? locations[entry.location_id] ?? entry.location_id
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
                      {Number(entry.balance_after)}
                    </td>

                    <td style={cellStyle}>
                      {new Date(entry.created_at).toLocaleString()}
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