"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import {
  listResource,
} from "../../lib/api/resources";
import {
  getInventorySummary,
  type InventorySummary,
} from "../../lib/api/inventory";

type Product = {
  id: string;
  name: string;
  sku: string;
  reorder_level: number | string;
};

type Operation = {
  id: string;
  reference: string;
  status: string;
  created_at: string;
};

type DashboardOperation = Operation & {
  type: "Receipt" | "Delivery" | "Transfer";
};

type Stats = {
  totalProducts: number;
  lowStock: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  pendingTransfers: number;
};

const emptyStats: Stats = {
  totalProducts: 0,
  lowStock: 0,
  pendingReceipts: 0,
  pendingDeliveries: 0,
  pendingTransfers: 0,
};

function isPending(status: string) {
  const normalized = status.toLowerCase();

  return ![
    "done",
    "cancelled",
    "canceled",
    "posted",
  ].includes(normalized);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [operations, setOperations] =
    useState<DashboardOperation[]>([]);

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          productResponse,
          inventoryResponse,
          receiptResponse,
          deliveryResponse,
          transferResponse,
        ] = await Promise.all([
          listResource<Product>("products", {
            pageSize: 100,
          }),

          getInventorySummary(),

          listResource<Operation>("receipts", {
            pageSize: 100,
          }),

          listResource<Operation>("deliveries", {
            pageSize: 100,
          }),

          listResource<Operation>("transfers", {
            pageSize: 100,
          }),
        ]);

        const stockByProduct = Object.fromEntries(
          inventoryResponse.data.map(
            (item: InventorySummary) => [
              item.product_id,
              Number(item.total_available),
            ]
          )
        );

        const lowStock = productResponse.data.filter(
          (product) => {
            const available =
              stockByProduct[product.id] ?? 0;

            return (
              available <=
              Number(product.reorder_level ?? 0)
            );
          }
        ).length;

        setStats({
          totalProducts:
            productResponse.pagination.total,

          lowStock,

          pendingReceipts:
            receiptResponse.data.filter((item) =>
              isPending(item.status)
            ).length,

          pendingDeliveries:
            deliveryResponse.data.filter((item) =>
              isPending(item.status)
            ).length,

          pendingTransfers:
            transferResponse.data.filter((item) =>
              isPending(item.status)
            ).length,
        });

        const combined: DashboardOperation[] = [
          ...receiptResponse.data.map((item) => ({
            ...item,
            type: "Receipt" as const,
          })),

          ...deliveryResponse.data.map((item) => ({
            ...item,
            type: "Delivery" as const,
          })),

          ...transferResponse.data.map((item) => ({
            ...item,
            type: "Transfer" as const,
          })),
        ];

        combined.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        setOperations(combined.slice(0, 15));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const filteredOperations = useMemo(() => {
    return operations.filter((operation) => {
      const matchesType =
        typeFilter === "all" ||
        operation.type.toLowerCase() === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        operation.status.toLowerCase() === statusFilter;

      return matchesType && matchesStatus;
    });
  }, [operations, typeFilter, statusFilter]);

  const cards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      text: "Active catalogue",
    },
    {
      title: "Low Stock",
      value: stats.lowStock,
      text: "At or below reorder level",
    },
    {
      title: "Pending Receipts",
      value: stats.pendingReceipts,
      text: "Incoming operations",
    },
    {
      title: "Pending Deliveries",
      value: stats.pendingDeliveries,
      text: "Outgoing operations",
    },
    {
      title: "Transfers Scheduled",
      value: stats.pendingTransfers,
      text: "Internal movements",
    },
  ];

  return (
    <AppShell>
      <div style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>OVERVIEW</p>
          <h1>Inventory Dashboard</h1>

          <p style={subtitleStyle}>
            Live overview from the StockSense backend.
          </p>
        </div>

        <div
          style={{
            color: loading ? "#f2c94c" : "#6ed890",
            fontSize: 14,
          }}
        >
          {loading ? "Loading data..." : "Live data"}
        </div>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={statsGridStyle}>
        {cards.map((card) => (
          <div key={card.title} style={cardStyle}>
            <p style={cardTitleStyle}>
              {card.title}
            </p>

            <h2 style={cardValueStyle}>
              {loading ? "—" : card.value}
            </h2>

            <span style={cardTextStyle}>
              {card.text}
            </span>
          </div>
        ))}
      </div>

      <div style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <h2>Recent Operations</h2>

            <p style={subtitleStyle}>
              Latest receipts, deliveries and transfers.
            </p>
          </div>

          <div style={filtersStyle}>
            <select
              style={selectStyle}
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
            >
              <option value="all">
                All Operations
              </option>
              <option value="receipt">Receipts</option>
              <option value="delivery">
                Deliveries
              </option>
              <option value="transfer">
                Transfers
              </option>
            </select>

            <select
              style={selectStyle}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={headingStyle}>Type</th>
                <th style={headingStyle}>Reference</th>
                <th style={headingStyle}>Status</th>
                <th style={headingStyle}>Created</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td style={cellStyle} colSpan={4}>
                    Loading operations...
                  </td>
                </tr>
              ) : filteredOperations.length === 0 ? (
                <tr>
                  <td style={cellStyle} colSpan={4}>
                    No operations found.
                  </td>
                </tr>
              ) : (
                filteredOperations.map((operation) => (
                  <tr
                    key={`${operation.type}-${operation.id}`}
                  >
                    <td style={cellStyle}>
                      {operation.type}
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        color: "#ef5350",
                        fontWeight: 600,
                      }}
                    >
                      {operation.reference}
                    </td>

                    <td style={cellStyle}>
                      <span style={statusStyle}>
                        {operation.status}
                      </span>
                    </td>

                    <td style={cellStyle}>
                      {new Date(
                        operation.created_at
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 28,
};

const eyebrowStyle = {
  color: "#ef5350",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 1,
};

const subtitleStyle = {
  color: "#9ba3af",
  marginTop: 6,
  fontSize: 14,
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  marginBottom: 24,
};

const cardStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  padding: 20,
};

const cardTitleStyle = {
  color: "#9ba3af",
  fontSize: 13,
};

const cardValueStyle = {
  fontSize: 30,
  margin: "10px 0 6px",
};

const cardTextStyle = {
  color: "#747c89",
  fontSize: 12,
};

const panelStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  overflow: "hidden",
};

const panelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  padding: 20,
  borderBottom: "1px solid #2b3038",
};

const filtersStyle = {
  display: "flex",
  gap: 10,
};

const selectStyle = {
  background: "#0f1216",
  color: "#ffffff",
  border: "1px solid #2b3038",
  borderRadius: 8,
  padding: "9px 10px",
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

const statusStyle = {
  display: "inline-block",
  background: "#252a32",
  padding: "5px 9px",
  borderRadius: 20,
  fontSize: 12,
};

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  padding: 12,
  borderRadius: 8,
  marginBottom: 18,
};