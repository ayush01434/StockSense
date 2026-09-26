"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/layout/AppShell";
import { listResource } from "../../lib/api/resources";

type Supplier = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const response = await listResource<Supplier>("suppliers", {
          pageSize: 100,
        });

        setSuppliers(response.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load suppliers."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSuppliers();
  }, []);

  return (
    <AppShell>
      <div style={headerStyle}>
        <div>
          <h1>Suppliers</h1>
          <p style={subtitleStyle}>
            Manage vendors for incoming inventory.
          </p>
        </div>

        <Link href="/suppliers/new" style={buttonStyle}>
          + New Supplier
        </Link>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={tableWrapperStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headingStyle}>Supplier</th>
              <th style={headingStyle}>Email</th>
              <th style={headingStyle}>Phone</th>
              <th style={headingStyle}>Address</th>
              <th style={headingStyle}>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={cellStyle} colSpan={5}>
                  Loading suppliers...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td style={cellStyle} colSpan={5}>
                  No suppliers found.
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td style={cellStyle}>
                    <strong>{supplier.name}</strong>
                  </td>

                  <td style={cellStyle}>
                    {supplier.email || "—"}
                  </td>

                  <td style={cellStyle}>
                    {supplier.phone || "—"}
                  </td>

                  <td style={cellStyle}>
                    {supplier.address || "—"}
                  </td>

                  <td
                    style={{
                      ...cellStyle,
                      color: supplier.is_active
                        ? "#6ed890"
                        : "#ff7b7b",
                    }}
                  >
                    {supplier.is_active ? "Active" : "Inactive"}
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
  marginBottom: 24,
};

const subtitleStyle = {
  color: "#9ba3af",
  marginTop: 6,
};

const buttonStyle = {
  background: "#ef5350",
  color: "white",
  padding: "10px 16px",
  borderRadius: 8,
  textDecoration: "none",
};

const tableWrapperStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  overflowX: "auto" as const,
};

const headingStyle = {
  textAlign: "left" as const,
  padding: 16,
  color: "#9ba3af",
  borderBottom: "1px solid #2b3038",
};

const cellStyle = {
  padding: 16,
  borderBottom: "1px solid #2b3038",
};

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
};