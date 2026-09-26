"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/layout/AppShell";
import {
  createResource,
  listResource,
  updateResource,
} from "../../../lib/api/resources";
import {
  adjustStock,
  listInventory,
  type InventoryRow,
} from "../../../lib/api/inventory";

type Product = {
  id: string;
  name: string;
  sku: string;
};

type Warehouse = {
  id: string;
  name: string;
};

type Location = {
  id: string;
  name: string;
  warehouse_id: string;
};

type AdjustmentRecord = {
  id: string;
};

export default function NewAdjustmentPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);

  const [reference, setReference] = useState("");
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [countedQuantity, setCountedQuantity] = useState("0");
  const [reason, setReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [
          productResponse,
          warehouseResponse,
          locationResponse,
          inventoryResponse,
        ] = await Promise.all([
          listResource<Product>("products", { pageSize: 100 }),
          listResource<Warehouse>("warehouses", { pageSize: 100 }),
          listResource<Location>("locations", { pageSize: 100 }),
          listInventory(),
        ]);

        setProducts(productResponse.data);
        setWarehouses(warehouseResponse.data);
        setLocations(locationResponse.data);
        setInventory(inventoryResponse.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load adjustment data."
        );
      }
    }

    void loadData();
  }, []);

  const filteredLocations = locations.filter(
    (location) =>
      !warehouseId ||
      location.warehouse_id === warehouseId
  );

  const recordedQuantity = useMemo(() => {
    const row = inventory.find(
      (item) =>
        item.product_id === productId &&
        item.warehouse_id === warehouseId &&
        item.location_id === locationId
    );

    return row ? Number(row.quantity) : 0;
  }, [
    inventory,
    productId,
    warehouseId,
    locationId,
  ]);

  const difference =
    Number(countedQuantity || 0) - recordedQuantity;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const counted = Number(countedQuantity);

    if (
      !reference.trim() ||
      !productId ||
      !warehouseId ||
      !locationId
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (counted < 0) {
      setError("Counted quantity cannot be negative.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const adjustment =
        await createResource<AdjustmentRecord>(
          "adjustments",
          {
            reference: reference.trim(),
            product_id: productId,
            warehouse_id: warehouseId,
            location_id: locationId,
            quantity_delta: difference,
            reason: reason.trim() || null,
            status: "draft",
          }
        );

      await adjustStock({
        product_id: productId,
        warehouse_id: warehouseId,
        location_id: locationId,
        quantity_delta: difference,
      });

      await updateResource(
        "adjustments",
        adjustment.data.id,
        {
          status: "posted",
        }
      );

      router.push("/adjustments");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete adjustment."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 800 }}>
        <h1>New Stock Adjustment</h1>

        <p style={subtitleStyle}>
          Compare recorded inventory with the physical count.
        </p>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={gridStyle}>
            <Field title="Reference">
              <input
                style={inputStyle}
                placeholder="ADJ-0043"
                value={reference}
                onChange={(event) =>
                  setReference(event.target.value)
                }
                required
              />
            </Field>

            <Field title="Product">
              <select
                style={inputStyle}
                value={productId}
                onChange={(event) =>
                  setProductId(event.target.value)
                }
                required
              >
                <option value="">Select product</option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </Field>

            <Field title="Warehouse">
              <select
                style={inputStyle}
                value={warehouseId}
                onChange={(event) => {
                  setWarehouseId(event.target.value);
                  setLocationId("");
                }}
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
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field title="Location">
              <select
                style={inputStyle}
                value={locationId}
                onChange={(event) =>
                  setLocationId(event.target.value)
                }
                required
              >
                <option value="">Select location</option>

                {filteredLocations.map((location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field title="Recorded Quantity">
              <input
                style={{
                  ...inputStyle,
                  color: "#9ba3af",
                }}
                value={recordedQuantity}
                disabled
              />
            </Field>

            <Field title="Physical Count">
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.001"
                value={countedQuantity}
                onChange={(event) =>
                  setCountedQuantity(event.target.value)
                }
                required
              />
            </Field>
          </div>

          <div style={differenceStyle}>
            <span>Stock Difference</span>

            <strong
              style={{
                color:
                  difference > 0
                    ? "#6ed890"
                    : difference < 0
                      ? "#ff7b7b"
                      : "#9ba3af",
              }}
            >
              {difference > 0 ? "+" : ""}
              {difference}
            </strong>
          </div>

          <Field title="Reason">
            <textarea
              style={{
                ...inputStyle,
                minHeight: 90,
                resize: "vertical",
              }}
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              placeholder="Damaged stock, physical count correction..."
            />
          </Field>

          <div style={actionsStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() =>
                router.push("/adjustments")
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              style={primaryButtonStyle}
              disabled={saving}
            >
              {saving
                ? "Adjusting..."
                : "Apply Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <label style={labelStyle}>
      {title}
      {children}
    </label>
  );
}

const subtitleStyle = {
  color: "#9ba3af",
  marginTop: 6,
  marginBottom: 24,
};

const formStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  padding: 24,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 18,
};

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
  fontSize: 14,
};

const inputStyle = {
  width: "100%",
  background: "#0f1216",
  color: "#ffffff",
  border: "1px solid #2b3038",
  borderRadius: 8,
  padding: "11px 12px",
};

const differenceStyle = {
  display: "flex",
  justifyContent: "space-between",
  background: "#0f1216",
  border: "1px solid #2b3038",
  borderRadius: 8,
  padding: 16,
  margin: "20px 0",
};

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 24,
};

const primaryButtonStyle = {
  background: "#ef5350",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "11px 18px",
};

const secondaryButtonStyle = {
  background: "#252a32",
  color: "white",
  border: "1px solid #343a44",
  borderRadius: 8,
  padding: "11px 18px",
};

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  padding: 12,
  borderRadius: 8,
  marginBottom: 18,
};