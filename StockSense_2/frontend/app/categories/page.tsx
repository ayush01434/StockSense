"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import {
  createResource,
  listResource,
} from "../../lib/api/resources";

type Category = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadCategories() {
    try {
      const response = await listResource<Category>("categories", {
        pageSize: 100,
      });

      setCategories(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createResource("categories", {
        name: name.trim(),
        description: description.trim() || null,
        is_active: true,
      });

      setName("");
      setDescription("");

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create category."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div style={{ marginBottom: 24 }}>
        <h1>Categories</h1>
        <p style={subtitleStyle}>
          Organize products into inventory categories.
        </p>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <form onSubmit={handleSubmit} style={formStyle}>
        <div>
          <h3>Add Category</h3>
          <p style={helperStyle}>
            Create a new product classification.
          </p>
        </div>

        <input
          style={inputStyle}
          placeholder="Category name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <input
          style={inputStyle}
          placeholder="Description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
        />

        <button
          type="submit"
          disabled={saving}
          style={buttonStyle}
        >
          {saving ? "Adding..." : "+ Add Category"}
        </button>
      </form>

      <div style={gridStyle}>
        {loading ? (
          <p>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p>No categories found.</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3>{category.name}</h3>

                <span
                  style={{
                    color: category.is_active
                      ? "#6ed890"
                      : "#ff7b7b",
                    fontSize: 13,
                  }}
                >
                  {category.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <p style={descriptionStyle}>
                {category.description || "No description"}
              </p>
            </div>
          ))
        )}
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
  marginTop: 4,
  fontSize: 13,
};

const formStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(180px, 1fr) minmax(180px, 1fr) minmax(180px, 1fr) auto",
  gap: 12,
  alignItems: "center",
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  padding: 20,
  marginBottom: 24,
};

const inputStyle = {
  width: "100%",
  background: "#0f1216",
  color: "#ffffff",
  border: "1px solid #2b3038",
  borderRadius: 8,
  padding: "11px 12px",
};

const buttonStyle = {
  background: "#ef5350",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "11px 16px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 16,
};

const cardStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  padding: 20,
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const descriptionStyle = {
  color: "#9ba3af",
  marginTop: 12,
  lineHeight: 1.5,
};

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
};