"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/layout/AppShell";
import { listResource } from "../../lib/api/resources";

type Delivery = {
  id: string;
  reference: string;
  warehouse_id: string | null;
  status: string;
  recipient_name: string | null;
  notes: string | null;
  created_at: string;
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] =
    useState<Delivery[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response =
          await listResource<Delivery>(
            "deliveries",
            {
              page: 1,
              pageSize: 100,
            }
          );

        setDeliveries(response.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load deliveries."
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
          <h1>Deliveries</h1>

          <p style={subtitleStyle}>
            Outgoing stock and customer shipments.
          </p>
        </div>

        <Link
          href="/deliveries/new"
          style={buttonStyle}
        >
          + New Delivery
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
              <th style={headingStyle}>Recipient</th>
              <th style={headingStyle}>Warehouse ID</th>
              <th style={headingStyle}>Status</th>
              <th style={headingStyle}>Created</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={cellStyle} colSpan={5}>
                  Loading deliveries...
                </td>
              </tr>
            ) : deliveries.length === 0 ? (
              <tr>
                <td style={cellStyle} colSpan={5}>
                  No deliveries found.
                </td>
              </tr>
            ) : (
              deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td style={cellStyle}>
                    <Link
                      href={`/deliveries/${delivery.id}`}
                      style={{
                        color: "#ef5350",
                        fontWeight: 600,
                      }}
                    >
                      {delivery.reference}
                    </Link>
                  </td>

                  <td style={cellStyle}>
                    {delivery.recipient_name || "—"}
                  </td>

                  <td style={cellStyle}>
                    {delivery.warehouse_id || "—"}
                  </td>

                  <td style={cellStyle}>
                    {delivery.status}
                  </td>

                  <td style={cellStyle}>
                    {new Date(
                      delivery.created_at
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