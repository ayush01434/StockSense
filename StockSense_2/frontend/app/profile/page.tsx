"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell";
import { apiRequest } from "../../lib/api/client";
import { createClient } from "../../lib/supabase/client";

type Profile = {
  id: string;
  email: string;
  role: string;
  warehouse_id: string | null;
  permissions: string[];
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setError("");

        const response =
          await apiRequest<Profile>("/profile");

        setProfile(response.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const supabase = createClient();

      await supabase.auth.signOut();

      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to log out."
      );

      setLoggingOut(false);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 850 }}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>
              MY ACCOUNT
            </p>

            <h1>Profile</h1>

            <p style={subtitleStyle}>
              View your StockSense account and permissions.
            </p>
          </div>

          <button
            style={logoutButtonStyle}
            onClick={() =>
              void handleLogout()
            }
            disabled={loggingOut}
          >
            {loggingOut
              ? "Logging out..."
              : "Logout"}
          </button>
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={cardStyle}>
            Loading profile...
          </div>
        ) : !profile ? (
          <div style={cardStyle}>
            Profile unavailable.
          </div>
        ) : (
          <>
            <div style={profileCardStyle}>
              <div style={avatarStyle}>
                {profile.email
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h2>{profile.email}</h2>

                <span style={roleBadgeStyle}>
                  {profile.role}
                </span>
              </div>
            </div>

            <div style={detailsGridStyle}>
              <div style={cardStyle}>
                <p style={labelStyle}>
                  User ID
                </p>

                <p style={valueStyle}>
                  {profile.id}
                </p>
              </div>

              <div style={cardStyle}>
                <p style={labelStyle}>
                  Email
                </p>

                <p style={valueStyle}>
                  {profile.email}
                </p>
              </div>

              <div style={cardStyle}>
                <p style={labelStyle}>
                  Role
                </p>

                <p style={valueStyle}>
                  {profile.role}
                </p>
              </div>

              <div style={cardStyle}>
                <p style={labelStyle}>
                  Warehouse
                </p>

                <p style={valueStyle}>
                  {profile.warehouse_id ||
                    "All warehouses"}
                </p>
              </div>
            </div>

            <div style={permissionsCardStyle}>
              <h2 style={{ fontSize: 18 }}>
                Permissions
              </h2>

              <p style={subtitleStyle}>
                Access granted by your backend role.
              </p>

              <div style={permissionsStyle}>
                {profile.permissions.length === 0 ? (
                  <span style={emptyStyle}>
                    No permissions assigned.
                  </span>
                ) : (
                  profile.permissions.map(
                    (permission) => (
                      <span
                        key={permission}
                        style={permissionStyle}
                      >
                        {permission}
                      </span>
                    )
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 24,
};

const eyebrowStyle = {
  color: "#ef5350",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 1,
};

const subtitleStyle = {
  color: "#9ba3af",
  marginTop: 6,
};

const profileCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  padding: 24,
  marginBottom: 18,
};

const avatarStyle = {
  width: 64,
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  background: "#ef5350",
  color: "#ffffff",
  fontSize: 26,
  fontWeight: 700,
};

const roleBadgeStyle = {
  display: "inline-block",
  marginTop: 8,
  background: "#252a32",
  color: "#f2c94c",
  padding: "5px 10px",
  borderRadius: 20,
  fontSize: 12,
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const cardStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: 12,
  padding: 20,
};

const labelStyle = {
  color: "#9ba3af",
  fontSize: 12,
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
};

const valueStyle = {
  marginTop: 8,
  wordBreak: "break-word" as const,
};

const permissionsCardStyle = {
  ...cardStyle,
  marginBottom: 18,
};

const permissionsStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
  marginTop: 18,
};

const permissionStyle = {
  background: "#18281f",
  color: "#6ed890",
  border: "1px solid #294635",
  borderRadius: 20,
  padding: "6px 10px",
  fontSize: 12,
};

const emptyStyle = {
  color: "#9ba3af",
};

const logoutButtonStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  border: "1px solid #693333",
  borderRadius: 8,
  padding: "10px 16px",
};

const errorStyle = {
  background: "#3a1d1d",
  color: "#ff9d9d",
  padding: 12,
  borderRadius: 8,
  marginBottom: 18,
};
