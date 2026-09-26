"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/layout/AppShell";
import { listResource } from "../../lib/api/resources";

type Warehouse = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await listResource<Warehouse>("warehouses", {
          pageSize: 100,
        });

        setWarehouses(response.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load warehouses."
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
          <h1>Warehouses</h1>
          <p style={subtitleStyle}>Manage stock storage facilities.</p>
        </div>

        <Link href="/warehouses/new" style={buttonStyle}>
          + New Warehouse
        </Link>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={gridStyle}>
        {loading ? (
          <p>Loading warehouses...</p>
        ) : warehouses.length === 0 ? (
          <p>No warehouses found.</p>
        ) : (
          warehouses.map((warehouse) => (
            <Link
              href={`/warehouses/${warehouse.id}`}
              key={warehouse.id}
              style={cardStyle}
            >
              <div style={cardTopStyle}>
                <h3>{warehouse.name}</h3>

                <span
                  style={{
                    color: warehouse.is_active ? "#6ed890" : "#ff7b7b",
                  }}
                >
                  {warehouse.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <p style={codeStyle}>{warehouse.code}</p>

              <p style={addressStyle}>
                {warehouse.address || "No address provided"}
              </p>
            </Link>
          ))
        )}
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

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
};

const cardStyle = {
  display: "block",
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: "12px",
  padding: "20px",
  color: "white",
  textDecoration: "none",
};

const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
};

const codeStyle = {
  color: "#ef5350",
  marginTop: "12px",
  fontWeight: 700,
};

const addressStyle = {
  color: "#9ba3af",
  marginTop: "12px",
};

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  padding: "12px",
  borderRadius: "8px",
};