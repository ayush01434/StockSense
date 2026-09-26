import AppShell from "../../components/layout/AppShell";

const deliveries = [
  {
    reference: "DEL-2031",
    customer: "Nova Retail",
    warehouse: "Main Warehouse",
    date: "26 Sep 2026",
    status: "Waiting",
  },
  {
    reference: "DEL-2030",
    customer: "Orbit Stores",
    warehouse: "Warehouse 2",
    date: "25 Sep 2026",
    status: "Ready",
  },
  {
    reference: "DEL-2029",
    customer: "City Mart",
    warehouse: "Main Warehouse",
    date: "24 Sep 2026",
    status: "Done",
  },
];

export default function DeliveriesPage() {
  return (
    <AppShell>
      <div style={headerStyle}>
        <div>
          <h1>Deliveries</h1>
          <p style={subtitleStyle}>Track outgoing goods and customer shipments.</p>
        </div>

        <button style={buttonStyle}>+ New Delivery</button>
      </div>

      <div style={tableWrapperStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Reference", "Customer", "Warehouse", "Date", "Status"].map(
                (heading) => (
                  <th key={heading} style={headingStyle}>
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {deliveries.map((delivery) => (
              <tr key={delivery.reference}>
                <td style={cellStyle}>{delivery.reference}</td>
                <td style={cellStyle}>{delivery.customer}</td>
                <td style={cellStyle}>{delivery.warehouse}</td>
                <td style={cellStyle}>{delivery.date}</td>
                <td style={cellStyle}>{delivery.status}</td>
              </tr>
            ))}
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
  border: "none",
  color: "white",
  borderRadius: "8px",
  padding: "10px 16px",
};

const tableWrapperStyle = {
  background: "#15181d",
  border: "1px solid #2b3038",
  borderRadius: "12px",
  overflow: "hidden",
};

const headingStyle = {
  textAlign: "left" as const,
  padding: "16px",
  color: "#9ba3af",
  borderBottom: "1px solid #2b3038",
};

const cellStyle = {
  padding: "16px",
  borderBottom: "1px solid #2b3038",
};