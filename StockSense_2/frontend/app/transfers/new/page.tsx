"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/layout/AppShell";
import {
  createResource,
  listResource,
  updateResource,
} from "../../../lib/api/resources";
import { transferStock } from "../../../lib/api/inventory";

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

type TransferRecord = {
  id: string;
};

export default function NewTransferPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [reference, setReference] = useState("");
  const [productId, setProductId] = useState("");
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [
          productResponse,
          warehouseResponse,
          locationResponse,
        ] = await Promise.all([
          listResource<Product>("products", { pageSize: 100 }),
          listResource<Warehouse>("warehouses", { pageSize: 100 }),
          listResource<Location>("locations", { pageSize: 100 }),
        ]);

        setProducts(productResponse.data);
        setWarehouses(warehouseResponse.data);
        setLocations(locationResponse.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load transfer data."
        );
      }
    }

    void loadData();
  }, []);

  const sourceLocations = locations.filter(
    (location) => location.warehouse_id === sourceWarehouseId
  );

  const destinationLocations = locations.filter(
    (location) => location.warehouse_id === destinationWarehouseId
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedQuantity = Number(quantity);

    if (
      !reference.trim() ||
      !productId ||
      !sourceWarehouseId ||
      !destinationWarehouseId ||
      !sourceLocationId ||
      !destinationLocationId
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (parsedQuantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (
      sourceWarehouseId === destinationWarehouseId &&
      sourceLocationId === destinationLocationId
    ) {
      setError("Source and destination cannot be the same location.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const transfer = await createResource<TransferRecord>(
        "transfers",
        {
          reference: reference.trim(),
          source_warehouse_id: sourceWarehouseId,
          destination_warehouse_id: destinationWarehouseId,
          status: "draft",
          notes: notes.trim() || null,
        }
      );

      await transferStock({
        product_id: productId,
        source_warehouse_id: sourceWarehouseId,
        destination_warehouse_id: destinationWarehouseId,
        source_location_id: sourceLocationId,
        destination_location_id: destinationLocationId,
        quantity: parsedQuantity,
      });

      await updateResource(
        "transfers",
        transfer.data.id,
        {
          status: "done",
        }
      );

      router.push("/transfers");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete transfer."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 850 }}>
        <h1>New Internal Transfer</h1>

        <p style={subtitleStyle}>
          Move inventory between warehouse locations.
        </p>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={gridStyle}>
            <Field title="Reference">
              <input
                style={inputStyle}
                value={reference}
                onChange={(event) =>
                  setReference(event.target.value)
                }
                placeholder="TRF-3015"
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

            <Field title="Source Warehouse">
              <select
                style={inputStyle}
                value={sourceWarehouseId}
                onChange={(event) => {
                  setSourceWarehouseId(event.target.value);
                  setSourceLocationId("");
                }}
                required
              >
                <option value="">Select source warehouse</option>

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

            <Field title="Source Location">
              <select
                style={inputStyle}
                value={sourceLocationId}
                onChange={(event) =>
                  setSourceLocationId(event.target.value)
                }
                required
              >
                <option value="">Select source location</option>

                {sourceLocations.map((location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field title="Destination Warehouse">
              <select
                style={inputStyle}
                value={destinationWarehouseId}
                onChange={(event) => {
                  setDestinationWarehouseId(event.target.value);
                  setDestinationLocationId("");
                }}
                required
              >
                <option value="">
                  Select destination warehouse
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

            <Field title="Destination Location">
              <select
                style={inputStyle}
                value={destinationLocationId}
                onChange={(event) =>
                  setDestinationLocationId(event.target.value)
                }
                required
              >
                <option value="">
                  Select destination location
                </option>

                {destinationLocations.map((location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field title="Quantity">
              <input
                style={inputStyle}
                type="number"
                min="0.001"
                step="0.001"
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
                required
              />
            </Field>
          </div>

          <Field title="Notes">
            <textarea
              style={{
                ...inputStyle,
                minHeight: 90,
                resize: "vertical",
              }}
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
            />
          </Field>

          <div style={actionsStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() =>
                router.push("/transfers")
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
                ? "Transferring..."
                : "Validate Transfer"}
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
  marginBottom: 18,
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