import type { ReactNode } from "react";

import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f1419" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px 24px", background: "#0b0f14" }}>{children}</main>
    </div>
  );
}
