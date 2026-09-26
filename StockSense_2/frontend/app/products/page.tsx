"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/layout/AppShell";
import { listResource } from "../../lib/api/resources";

type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category_id: string | null;
  unit: string;
  unit_cost: number;
  reorder_level: number;
  is_active: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts(searchValue = "") {
    try {
      setLoading(true);
      setError("");

      const response = await listResource<Product>(
        "products",
        {
          search: searchValue,
          page: 1,
          pageSize: 100,
        }
      );

      setProducts(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  function handleSearch(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    void loadProducts(search);
  }

  return (
    <AppShell>
      <div style={headerStyle}>
        <div>
          <h1>Products</h1>

          <p style={subtitleStyle}>
            Manage products, SKUs and reorder levels.
          </p>
        </div>

        <Link href="/products/new" style={buttonStyle}>
          + New Product
        </Link>
      </div>

      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: 10, marginBottom: 20 }}
      >
        <input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search name or SKU..."
          style={inputStyle}
        />

        <button type="submit" style={secondaryButtonStyle}>
          Search
        </button>
      </form>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      <div style={tableWrapperStyle}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={headingStyle}>Product</th>
              <th style={headingStyle}>SKU</th>
              <th style={headingStyle}>Unit</th>
              <th style={headingStyle}>Unit Cost</th>
              <th style={headingStyle}>Reorder Level</th>
              <th style={headingStyle}>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={cellStyle} colSpan={6}>
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td style={cellStyle} colSpan={6}>
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td style={cellStyle}>
                    <Link
                      href={`/products/${product.id}`}
                      style={{
                        color: "#ef5350",
                        fontWeight: 600,
                      }}
                    >
                      {product.name}
                    </Link>
                  </td>

                  <td style={cellStyle}>
                    {product.sku}
                  </td>

                  <td style={cellStyle}>
                    {product.unit}
                  </td>

                  <td style={cellStyle}>
                    ₹{Number(product.unit_cost).toFixed(2)}
                  </td>

                  <td style={cellStyle}>
                    {product.reorder_level}
                  </td>

                  <td style={cellStyle}>
                    {product.is_active
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
  color: "#ffffff",
  padding: "10px 16px",
  borderRadius: "8px",
  textDecoration: "none",
};

const secondaryButtonStyle = {
  background: "#252a32",
  color: "#ffffff",
  border: "1px solid #343a44",
  padding: "10px 16px",
  borderRadius: "8px",
};

const inputStyle = {
  width: "300px",
  maxWidth: "100%",
  background: "#15181d",
  color: "#ffffff",
  border: "1px solid #2b3038",
  borderRadius: "8px",
  padding: "10px 12px",
};

const tableWrapperStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: "12px",
  overflowX: "auto" as const,
};

const headingStyle = {
  textAlign: "left" as const,
  padding: "16px",
  color: "#9ba3af",
  borderBottom: "1px solid #2b3038",
};

const cellStyle = {
  padding: "16px",
  color: "#e4e7eb",
  borderBottom: "1px solid #2b3038",
};

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  border: "1px solid #693333",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "16px",
};