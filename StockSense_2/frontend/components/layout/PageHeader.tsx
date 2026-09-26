export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h1 style={{ margin: 0, fontSize: "32px" }}>{title}</h1>
      {subtitle ? <p style={{ margin: "6px 0 0", color: "#9ba3af" }}>{subtitle}</p> : null}
    </div>
  );
}
