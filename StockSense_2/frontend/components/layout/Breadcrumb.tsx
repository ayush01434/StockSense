export default function Breadcrumb({ items }: { items: string[] }) {
  return <div style={{ color: "#9ba3af", marginBottom: "18px" }}>{items.join(" / ")}</div>;
}
