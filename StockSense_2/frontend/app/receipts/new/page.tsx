"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/layout/AppShell";
import {
  createResource,
  listResource,
} from "../../../lib/api/resources";
import { receiveStock } from "../../../lib/api/inventory";

type Product = {
  id: string;
  name: string;
  sku: string;
};

type Supplier = {
  id: string;
  name: string;
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

export default function NewReceiptPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [reference, setReference] = useState("");
  const [supplierId, setSupplierId] = useState("");
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
          productsResponse,
          suppliersResponse,
          warehousesResponse,
          locationsResponse,
        ] = await Promise.all([
          listResource<Product>("products", {
            pageSize: 100,
          }),
          listResource<Supplier>("suppliers", {
            pageSize: 100,
          }),
          listResource<Warehouse>("warehouses", {
            pageSize: 100,
          }),
          listResource<Location>("locations", {
            pageSize: 100,
          }),
        ]);

        setProducts(productsResponse.data);
        setSuppliers(suppliersResponse.data);
        setWarehouses(warehousesResponse.data);
        setLocations(locationsResponse.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load form data."
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

      await createResource("receipts", {
        reference: reference.trim(),
        supplier_id: supplierId || null,
        warehouse_id: warehouseId,
        status: "done",
        notes: notes.trim() || null,
      });

      await receiveStock({
        product_id: productId,
        warehouse_id: warehouseId,
        location_id: locationId,
        quantity: parsedQuantity,
        reference_type: "receipt",
      });

      router.push("/receipts");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete receipt."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 800 }}>
        <h1>New Receipt</h1>

        <p style={subtitleStyle}>
          Receive products from a supplier and increase stock.
        </p>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={gridStyle}>
            <Field title="Reference">
              <input
                style={inputStyle}
                placeholder="REC-1009"
                value={reference}
                onChange={(event) =>
                  setReference(event.target.value)
                }
                required
              />
            </Field>

            <Field title="Supplier">
              <select
                style={inputStyle}
                value={supplierId}
                onChange={(event) =>
                  setSupplierId(event.target.value)
                }
              >
                <option value="">No supplier</option>

                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.name}
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
              placeholder="Optional notes"
            />
          </Field>

          <div style={actionsStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => router.push("/receipts")}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Receiving..."
                : "Receive Stock"}
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