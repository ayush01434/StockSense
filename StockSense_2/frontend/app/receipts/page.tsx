import AppShell from "../../components/layout/AppShell";

const receipts = [
  {
    reference: "REC-1008",
    supplier: "SteelWorks Pvt Ltd",
    warehouse: "Main Warehouse",
    date: "26 Sep 2026",
    status: "Ready",
  },
  {
    reference: "REC-1007",
    supplier: "Metro Supplies",
    warehouse: "Warehouse 2",
    date: "25 Sep 2026",
    status: "Done",
  },
  {
    reference: "REC-1006",
    supplier: "Prime Industrial",
    warehouse: "Main Warehouse",
    date: "24 Sep 2026",
    status: "Waiting",
  },
];

export default function ReceiptsPage() {
  return (
    <AppShell>
      <div style={headerStyle}>
        <div>
          <h1>Receipts</h1>
          <p style={subtitleStyle}>Manage incoming goods from suppliers.</p>
        </div>

        <button style={buttonStyle}>+ New Receipt</button>
      </div>

      <OperationTable
        headings={["Reference", "Supplier", "Warehouse", "Date", "Status"]}
        rows={receipts.map((receipt) => [
          receipt.reference,
          receipt.supplier,
          receipt.warehouse,
          receipt.date,
          receipt.status,
        ])}
      />
    </AppShell>
  );
}

function OperationTable({
  headings,
  rows,
}: {
  headings: string[];
  rows: string[][];
}) {
  return (
    <div style={tableWrapperStyle}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headings.map((heading) => (
              <th key={heading} style={headingStyle}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((value, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} style={cellStyle}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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