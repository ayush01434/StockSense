"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/layout/AppShell";
import { listResource } from "../../lib/api/resources";

type Receipt = {
  id: string;
  reference: string;
  supplier_id: string | null;
  warehouse_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await listResource<Receipt>(
          "receipts",
          {
            page: 1,
            pageSize: 100,
          }
        );

        setReceipts(response.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load receipts."
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
          <h1>Receipts</h1>
          <p style={subtitleStyle}>
            Incoming stock from suppliers.
          </p>
        </div>

        <Link href="/receipts/new" style={buttonStyle}>
          + New Receipt
        </Link>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={tableWrapperStyle}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={headingStyle}>Reference</th>
              <th style={headingStyle}>Supplier ID</th>
              <th style={headingStyle}>Warehouse ID</th>
              <th style={headingStyle}>Status</th>
              <th style={headingStyle}>Created</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={cellStyle} colSpan={5}>
                  Loading receipts...
                </td>
              </tr>
            ) : receipts.length === 0 ? (
              <tr>
                <td style={cellStyle} colSpan={5}>
                  No receipts found.
                </td>
              </tr>
            ) : (
              receipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td style={cellStyle}>
                    <Link
                      href={`/receipts/${receipt.id}`}
                      style={{
                        color: "#ef5350",
                        fontWeight: 600,
                      }}
                    >
                      {receipt.reference}
                    </Link>
                  </td>

                  <td style={cellStyle}>
                    {receipt.supplier_id || "—"}
                  </td>

                  <td style={cellStyle}>
                    {receipt.warehouse_id || "—"}
                  </td>

                  <td style={cellStyle}>
                    {receipt.status}
                  </td>

                  <td style={cellStyle}>
                    {new Date(
                      receipt.created_at
                    ).toLocaleDateString()}
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

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "16px",
};