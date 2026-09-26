"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import {
  createResource,
  listResource,
} from "../../lib/api/resources";

type Location = {
  id: string;
  warehouse_id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
};

type Warehouse = {
  id: string;
  name: string;
  code: string;
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [warehouseId, setWarehouseId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setError("");

      const [locationResponse, warehouseResponse] =
        await Promise.all([
          listResource<Location>("locations", {
            pageSize: 100,
          }),
          listResource<Warehouse>("warehouses", {
            pageSize: 100,
          }),
        ]);

      setLocations(locationResponse.data);
      setWarehouses(warehouseResponse.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load locations."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !warehouseId ||
      !name.trim() ||
      !code.trim()
    ) {
      setError(
        "Warehouse, location name and code are required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createResource("locations", {
        warehouse_id: warehouseId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        is_active: true,
      });

      setWarehouseId("");
      setName("");
      setCode("");
      setDescription("");

      setSuccess("Location created successfully.");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create location."
      );
    } finally {
      setSaving(false);
    }
  }

  function getWarehouseName(id: string) {
    const warehouse = warehouses.find(
      (item) => item.id === id
    );

    return warehouse
      ? `${warehouse.name} (${warehouse.code})`
      : id;
  }

  return (
    <AppShell>
      <div style={{ marginBottom: 24 }}>
        <h1>Locations</h1>

        <p style={subtitleStyle}>
          Manage warehouse racks, shelves and storage zones.
        </p>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      {success && (
        <div style={successStyle}>
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={formStyle}
      >
        <div>
          <h2 style={{ fontSize: 18 }}>
            Add Location
          </h2>

          <p style={helperStyle}>
            Create a storage location inside a warehouse.
          </p>
        </div>

        <div style={formGridStyle}>
          <label style={labelStyle}>
            Warehouse

            <select
              style={inputStyle}
              value={warehouseId}
              onChange={(event) =>
                setWarehouseId(event.target.value)
              }
              required
            >
              <option value="">
                Select warehouse
              </option>

              {warehouses.map((warehouse) => (
                <option
                  key={warehouse.id}
                  value={warehouse.id}
                >
                  {warehouse.name} ({warehouse.code})
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Location Name

            <input
              style={inputStyle}
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Rack A1"
              required
            />
          </label>

          <label style={labelStyle}>
            Location Code

            <input
              style={inputStyle}
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              placeholder="A1"
              required
            />
          </label>

          <label style={labelStyle}>
            Description

            <input
              style={inputStyle}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Optional description"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={buttonStyle}
        >
          {saving
            ? "Creating..."
            : "+ Add Location"}
        </button>
      </form>

      <div style={tableWrapperStyle}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={headingStyle}>
                Location
              </th>
              <th style={headingStyle}>
                Code
              </th>
              <th style={headingStyle}>
                Warehouse
              </th>
              <th style={headingStyle}>
                Description
              </th>
              <th style={headingStyle}>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  style={cellStyle}
                  colSpan={5}
                >
                  Loading locations...
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td
                  style={cellStyle}
                  colSpan={5}
                >
                  No locations found.
                </td>
              </tr>
            ) : (
              locations.map((location) => (
                <tr key={location.id}>
                  <td style={cellStyle}>
                    <strong>
                      {location.name}
                    </strong>
                  </td>

                  <td style={cellStyle}>
                    {location.code}
                  </td>

                  <td style={cellStyle}>
                    {getWarehouseName(
                      location.warehouse_id
                    )}
                  </td>

                  <td style={cellStyle}>
                    {location.description || "—"}
                  </td>

                  <td
                    style={{
                      ...cellStyle,
                      color: location.is_active
                        ? "#6ed890"
                        : "#ff7b7b",
                    }}
                  >
                    {location.is_active
                      ? "Active"
                      : "Inactive"}
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

const subtitleStyle = {
  color: "#9ba3af",
  marginTop: 6,
};

const helperStyle = {
  color: "#9ba3af",
  fontSize: 13,
  marginTop: 5,
};

const formStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  padding: 20,
  marginBottom: 24,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 14,
  marginTop: 18,
  marginBottom: 16,
};

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 7,
  fontSize: 13,
};

const inputStyle = {
  width: "100%",
  background: "#0f1216",
  color: "#ffffff",
  border: "1px solid #2b3038",
  borderRadius: 8,
  padding: "10px 12px",
};

const buttonStyle = {
  background: "#ef5350",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
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

const successStyle = {
  background: "#183023",
  color: "#6ed890",
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
};