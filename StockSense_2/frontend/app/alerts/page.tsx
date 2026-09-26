"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import {
  listResource,
  updateResource,
} from "../../lib/api/resources";

type StockAlert = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  product_id: string | null;
  warehouse_id: string | null;
  is_read: boolean;
  resolved_at: string | null;
  created_at: string;
};

type Filter = "all" | "unread" | "resolved";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const loadAlerts = useCallback(async () => {
    try {
      setError("");

      const response = await listResource<StockAlert>(
        "alerts",
        {
          page: 1,
          pageSize: 100,
        }
      );

      setAlerts(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load alerts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const unreadCount = alerts.filter(
    (alert) => !alert.is_read
  ).length;

  const resolvedCount = alerts.filter(
    (alert) => Boolean(alert.resolved_at)
  ).length;

  const visibleAlerts = useMemo(() => {
    if (filter === "unread") {
      return alerts.filter((alert) => !alert.is_read);
    }

    if (filter === "resolved") {
      return alerts.filter((alert) =>
        Boolean(alert.resolved_at)
      );
    }

    return alerts;
  }, [alerts, filter]);

  async function markRead(alert: StockAlert) {
    try {
      setBusyId(alert.id);
      setError("");

      await updateResource<StockAlert>(
        "alerts",
        alert.id,
        {
          is_read: true,
        }
      );

      await loadAlerts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update alert."
      );
    } finally {
      setBusyId("");
    }
  }

  async function resolveAlert(alert: StockAlert) {
    try {
      setBusyId(alert.id);
      setError("");

      await updateResource<StockAlert>(
        "alerts",
        alert.id,
        {
          is_read: true,
          resolved_at: new Date().toISOString(),
        }
      );

      await loadAlerts();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resolve alert."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <AppShell>
      <div style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>MONITORING</p>

          <h1>Stock Alerts</h1>

          <p style={subtitleStyle}>
            Monitor low-stock and inventory warnings.
          </p>
        </div>

        <div style={headerBadgeStyle}>
          {unreadCount} unread
        </div>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <p style={statLabelStyle}>
            Total Alerts
          </p>

          <h2>{alerts.length}</h2>
        </div>

        <div style={statCardStyle}>
          <p style={statLabelStyle}>
            Unread
          </p>

          <h2>{unreadCount}</h2>
        </div>

        <div style={statCardStyle}>
          <p style={statLabelStyle}>
            Resolved
          </p>

          <h2>{resolvedCount}</h2>
        </div>
      </div>

      <div style={filterBarStyle}>
        <button
          style={
            filter === "all"
              ? activeFilterStyle
              : filterButtonStyle
          }
          onClick={() => setFilter("all")}
        >
          All
        </button>

        <button
          style={
            filter === "unread"
              ? activeFilterStyle
              : filterButtonStyle
          }
          onClick={() => setFilter("unread")}
        >
          Unread
        </button>

        <button
          style={
            filter === "resolved"
              ? activeFilterStyle
              : filterButtonStyle
          }
          onClick={() => setFilter("resolved")}
        >
          Resolved
        </button>
      </div>

      <div style={tableWrapperStyle}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={headingStyle}>Type</th>
              <th style={headingStyle}>Alert</th>
              <th style={headingStyle}>Status</th>
              <th style={headingStyle}>Created</th>
              <th style={headingStyle}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  style={cellStyle}
                  colSpan={5}
                >
                  Loading alerts...
                </td>
              </tr>
            ) : visibleAlerts.length === 0 ? (
              <tr>
                <td
                  style={cellStyle}
                  colSpan={5}
                >
                  No alerts found.
                </td>
              </tr>
            ) : (
              visibleAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td style={cellStyle}>
                    <span style={typeBadgeStyle}>
                      {alert.type}
                    </span>
                  </td>

                  <td style={cellStyle}>
                    <strong>
                      {alert.title}
                    </strong>

                    {alert.message && (
                      <p style={messageStyle}>
                        {alert.message}
                      </p>
                    )}
                  </td>

                  <td style={cellStyle}>
                    {alert.resolved_at ? (
                      <span style={resolvedStyle}>
                        Resolved
                      </span>
                    ) : alert.is_read ? (
                      <span style={readStyle}>
                        Read
                      </span>
                    ) : (
                      <span style={unreadStyle}>
                        Unread
                      </span>
                    )}
                  </td>

                  <td style={cellStyle}>
                    {new Date(
                      alert.created_at
                    ).toLocaleString()}
                  </td>

                  <td style={cellStyle}>
                    <div style={actionsStyle}>
                      {!alert.is_read && (
                        <button
                          style={secondaryButtonStyle}
                          disabled={busyId === alert.id}
                          onClick={() =>
                            void markRead(alert)
                          }
                        >
                          Mark Read
                        </button>
                      )}

                      {!alert.resolved_at && (
                        <button
                          style={primaryButtonStyle}
                          disabled={busyId === alert.id}
                          onClick={() =>
                            void resolveAlert(alert)
                          }
                        >
                          Resolve
                        </button>
                      )}
                    </div>
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

const eyebrowStyle = {
  color: "#ef5350",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 1,
};

const subtitleStyle = {
  color: "#9ba3af",
  marginTop: 6,
};

const headerBadgeStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  padding: "8px 12px",
  borderRadius: 20,
  fontSize: 13,
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  marginBottom: 20,
};

const statCardStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  padding: 18,
};

const statLabelStyle = {
  color: "#9ba3af",
  fontSize: 13,
  marginBottom: 8,
};

const filterBarStyle = {
  display: "flex",
  gap: 8,
  marginBottom: 16,
};

const filterButtonStyle = {
  background: "#15181d",
  color: "#9ba3af",
  border: "1px solid #2b3038",
  padding: "9px 14px",
  borderRadius: 8,
};

const activeFilterStyle = {
  ...filterButtonStyle,
  background: "#ef5350",
  color: "white",
  border: "1px solid #ef5350",
};

const tableWrapperStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  overflowX: "auto" as const,
};

const headingStyle = {
  textAlign: "left" as const,
  color: "#9ba3af",
  padding: 16,
  borderBottom: "1px solid #2b3038",
};

const cellStyle = {
  padding: 16,
  borderBottom: "1px solid #2b3038",
  verticalAlign: "top" as const,
};

const typeBadgeStyle = {
  background: "#252a32",
  color: "#f2c94c",
  padding: "5px 9px",
  borderRadius: 20,
  fontSize: 12,
};

const messageStyle = {
  color: "#9ba3af",
  fontSize: 13,
  marginTop: 5,
};

const unreadStyle = {
  color: "#ff7b7b",
};

const readStyle = {
  color: "#f2c94c",
};

const resolvedStyle = {
  color: "#6ed890",
};

const actionsStyle = {
  display: "flex",
  gap: 8,
};

const primaryButtonStyle = {
  background: "#ef5350",
  color: "white",
  border: "none",
  borderRadius: 7,
  padding: "7px 10px",
};

const secondaryButtonStyle = {
  background: "#252a32",
  color: "white",
  border: "1px solid #343a44",
  borderRadius: 7,
  padding: "7px 10px",
};

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
};