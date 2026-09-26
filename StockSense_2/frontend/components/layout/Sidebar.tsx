"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Products", href: "/products" },
  { label: "Inventory", href: "/inventory" },
  { label: "Receipts", href: "/receipts" },
  { label: "Deliveries", href: "/deliveries" },
  { label: "Transfers", href: "/transfers" },
  { label: "Adjustments", href: "/adjustments" },
  { label: "Ledger", href: "/ledger" },
  { label: "Warehouses", href: "/warehouses" },
  { label: "Locations", href: "/locations" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Alerts", href: "/alerts" },
  { label: "Settings", href: "/settings" },
  { label: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{ width: "240px", background: "#12181f", borderRight: "1px solid #2b3038", padding: "24px 16px" }}>
      <div style={{ padding: "0 8px 24px" }}>
        <h1 style={{ margin: 0, color: "#ef5350", fontSize: "24px", fontWeight: 700 }}>StockSense</h1>
        <p style={{ margin: "6px 0 0", color: "#8f96a3", fontSize: "12px" }}>Inventory Control</p>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "11px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                color: active ? "#ffffff" : "#c7ccd4",
                background: active ? "#ef5350" : "transparent",
                fontWeight: active ? 700 : 500,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
