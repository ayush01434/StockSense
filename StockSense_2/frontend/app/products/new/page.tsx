"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/layout/AppShell";
import {
  createResource,
  listResource,
} from "../../../lib/api/resources";

type Category = {
  id: string;
  name: string;
};

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [unitCost, setUnitCost] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("0");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await listResource<Category>(
          "categories",
          { pageSize: 100 }
        );

        setCategories(response.data);
      } catch {
        setCategories([]);
      }
    }

    void loadCategories();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !sku.trim()) {
      setError("Product name and SKU are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createResource("products", {
        name: name.trim(),
        sku: sku.trim(),
        description: description.trim() || null,
        category_id: categoryId || null,
        unit,
        unit_cost: Number(unitCost),
        reorder_level: Number(reorderLevel),
        is_active: true,
      });

      router.push("/products");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create product."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 760 }}>
        <div style={{ marginBottom: 28 }}>
          <h1>New Product</h1>
          <p style={subtitleStyle}>
            Add a new item to your product catalogue.
          </p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={gridStyle}>
            <label style={labelStyle}>
              Product Name
              <input
                style={inputStyle}
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Steel Rod"
                required
              />
            </label>

            <label style={labelStyle}>
              SKU
              <input
                style={inputStyle}
                value={sku}
                onChange={(event) =>
                  setSku(event.target.value)
                }
                placeholder="STL-001"
                required
              />
            </label>

            <label style={labelStyle}>
              Category
              <select
                style={inputStyle}
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(event.target.value)
                }
              >
                <option value="">No category</option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              Unit
              <select
                style={inputStyle}
                value={unit}
                onChange={(event) =>
                  setUnit(event.target.value)
                }
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="g">Grams</option>
                <option value="ltr">Litres</option>
                <option value="m">Metres</option>
                <option value="box">Boxes</option>
              </select>
            </label>

            <label style={labelStyle}>
              Unit Cost
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(event) =>
                  setUnitCost(event.target.value)
                }
              />
            </label>

            <label style={labelStyle}>
              Reorder Level
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.001"
                value={reorderLevel}
                onChange={(event) =>
                  setReorderLevel(event.target.value)
                }
              />
            </label>
          </div>

          <label style={labelStyle}>
            Description
            <textarea
              style={{
                ...inputStyle,
                minHeight: 100,
                resize: "vertical",
              }}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Optional product description"
            />
          </label>

          <div style={actionsStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => router.push("/products")}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={primaryButtonStyle}
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

const subtitleStyle = {
  color: "#9ba3af",
  marginTop: 6,
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
  color: "#d6dae1",
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
  border: "1px solid #693333",
  borderRadius: 8,
  padding: 12,
  marginBottom: 18,
};