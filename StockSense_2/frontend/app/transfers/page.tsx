"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/layout/AppShell";
import { listResource } from "../../lib/api/resources";

type Transfer = {
  id: string;
  reference: string;
  source_warehouse_id: string | null;
  destination_warehouse_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

type Warehouse = {
  id: string;
  name: string;
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [transferResponse, warehouseResponse] = await Promise.all([
          listResource<Transfer>("transfers", { pageSize: 100 }),
          listResource<Warehouse>("warehouses", { pageSize: 100 }),
        ]);

        setTransfers(transferResponse.data);

        setWarehouses(
          Object.fromEntries(
            warehouseResponse.data.map((warehouse) => [
              warehouse.id,
              warehouse.name,
            ])
          )
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load transfers."
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
          <h1>Internal Transfers</h1>
          <p style={subtitleStyle}>
            Move stock between warehouses and locations.
          </p>
        </div>

        <Link href="/transfers/new" style={buttonStyle}>
          + New Transfer
        </Link>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={tableWrapperStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headingStyle}>Reference</th>
              <th style={headingStyle}>From</th>
              <th style={headingStyle}>To</th>
              <th style={headingStyle}>Status</th>
              <th style={headingStyle}>Created</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={cellStyle} colSpan={5}>
                  Loading transfers...
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td style={cellStyle} colSpan={5}>
                  No transfers found.
                </td>
              </tr>
            ) : (
              transfers.map((transfer) => (
                <tr key={transfer.id}>
                  <td style={cellStyle}>
                    <Link
                      href={`/transfers/${transfer.id}`}
                      style={linkStyle}
                    >
                      {transfer.reference}
                    </Link>
                  </td>

                  <td style={cellStyle}>
                    {transfer.source_warehouse_id
                      ? warehouses[transfer.source_warehouse_id] ??
                        transfer.source_warehouse_id
                      : "—"}
                  </td>

                  <td style={cellStyle}>
                    {transfer.destination_warehouse_id
                      ? warehouses[transfer.destination_warehouse_id] ??
                        transfer.destination_warehouse_id
                      : "—"}
                  </td>

                  <td style={cellStyle}>{transfer.status}</td>

                  <td style={cellStyle}>
                    {new Date(transfer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
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