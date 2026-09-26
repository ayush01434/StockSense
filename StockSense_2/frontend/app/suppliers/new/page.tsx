"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/layout/AppShell";
import { createResource } from "../../../lib/api/resources";

export default function NewSupplierPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createResource("suppliers", {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        is_active: true,
      });

      router.push("/suppliers");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create supplier."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 650 }}>
        <h1>New Supplier</h1>

        <p style={subtitleStyle}>
          Add a vendor for incoming inventory.
        </p>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Supplier Name
            <input
              style={inputStyle}
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="SteelWorks Pvt Ltd"
              required
            />
          </label>

          <label style={labelStyle}>
            Email
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="supplier@example.com"
            />
          </label>

          <label style={labelStyle}>
            Phone
            <input
              style={inputStyle}
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="+91 98765 43210"
            />
          </label>

          <label style={labelStyle}>
            Address
            <textarea
              style={{
                ...inputStyle,
                minHeight: 90,
                resize: "vertical",
              }}
              value={address}
              onChange={(event) =>
                setAddress(event.target.value)
              }
            />
          </label>

          <div style={actionsStyle}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() =>
                router.push("/suppliers")
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
                ? "Creating..."
                : "Create Supplier"}
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
  marginBottom: 24,
};

const formStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 18,
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  padding: 24,
};

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
  fontSize: 14,
};

const inputStyle = {
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