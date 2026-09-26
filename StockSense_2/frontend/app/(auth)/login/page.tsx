"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const supabase = createClient();

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        throw signInError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={logoStyle}>StockSense</h1>

          <p style={subtitleStyle}>
            Sign in to manage your inventory.
          </p>
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Email

            <input
              type="email"
              style={inputStyle}
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              required
            />
          </label>

          <label style={labelStyle}>
            Password

            <input
              type="password"
              style={inputStyle}
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={footerStyle}>
          <Link
            href="/forgot-password"
            style={linkStyle}
          >
            Forgot password?
          </Link>

          <span style={{ color: "#6f7681" }}>
            •
          </span>

          <Link
            href="/register"
            style={linkStyle}
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0d0f12",
  padding: 20,
};

const cardStyle = {
  width: "100%",
  maxWidth: 420,
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 14,
  padding: 30,
};

const logoStyle = {
  color: "#ef5350",
  fontSize: 30,
};

const subtitleStyle = {
  color: "#9ba3af",
  marginTop: 8,
};

const formStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 18,
};

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
  fontSize: 14,
};

const inputStyle = {
  background: "#0f1216",
  color: "white",
  border: "1px solid #2b3038",
  borderRadius: 8,
  padding: "12px",
};

const buttonStyle = {
  background: "#ef5350",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "12px",
  fontWeight: 700,
};

const footerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: 10,
  marginTop: 22,
  fontSize: 13,
};

const linkStyle = {
  color: "#ef5350",
};

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  padding: 11,
  borderRadius: 8,
  marginBottom: 18,
};