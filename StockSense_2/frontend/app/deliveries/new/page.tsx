"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/layout/AppShell";
import {
  createResource,
  listResource,
} from "../../../lib/api/resources";
import { deliverStock } from "../../../lib/api/inventory";

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

export default function NewDeliveryPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [reference, setReference] = useState("");
  const [recipient, setRecipient] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const [
          productResponse,
          warehouseResponse,
          locationResponse,
        ] = await Promise.all([
          listResource<Product>("products", {
            pageSize: 100,
          }),
          listResource<Warehouse>("warehouses", {
            pageSize: 100,
          }),
          listResource<Location>("locations", {
            pageSize: 100,
          }),
        ]);

        setProducts(productResponse.data);
        setWarehouses(warehouseResponse.data);
        setLocations(locationResponse.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load delivery form."
        );
      }
    }

    void loadOptions();
  }, []);

  const filteredLocations = locations.filter(
    (location) =>
      !warehouseId ||
      location.warehouse_id === warehouseId
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedQuantity = Number(quantity);

    if (
      !reference ||
      !warehouseId ||
      !locationId ||
      !productId
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (parsedQuantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createResource("deliveries", {
        reference: reference.trim(),
        warehouse_id: warehouseId,
        status: "done",
        recipient_name: recipient.trim() || null,
        notes: notes.trim() || null,
      });

      await deliverStock({
        product_id: productId,
        warehouse_id: warehouseId,
        location_id: locationId,
        quantity: parsedQuantity,
        reference_type: "delivery",
      });

      router.push("/deliveries");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete delivery."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 800 }}>
        <h1>New Delivery</h1>

        <p style={subtitleStyle}>
          Ship stock and automatically reduce inventory.
        </p>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={gridStyle}>
            <Field title="Reference">
              <input
                style={inputStyle}
                placeholder="DEL-2032"
                value={reference}
                onChange={(event) =>
                  setReference(event.target.value)
                }
                required
              />
            </Field>

            <Field title="Recipient">
              <input
                style={inputStyle}
                placeholder="Customer name"
                value={recipient}
                onChange={(event) =>
                  setRecipient(event.target.value)
                }
              />
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
                <option value="">
                  Select location
                </option>

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

            <Field title="Product">
              <select
                style={inputStyle}
                value={productId}
                onChange={(event) =>
                  setProductId(event.target.value)
                }
                required
              >
                <option value="">
                  Select product
                </option>

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
                router.push("/deliveries")
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Delivering..."
                : "Validate Delivery"}
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
  children: React.ReactNode;
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
  borderRadius: 8,
  padding: 12,
  margin: "18px 0",
};