import { ReportColumn, ReportMeta, ReportRow } from "./reportingTypes";

const escapeCell = (value: string): string => {
  return `"${value.replace(/"/g, '""')}"`;
};

const toDisplay = (
  value: string | number | boolean | null | undefined,
  type: ReportColumn["type"]
): string => {
  if (value === null || value === undefined || value === "") return "";
  if (type === "date" && typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN");
    }
  }
  if (type === "currency" && typeof value === "number") {
    return value.toFixed(2);
  }
  return String(value);
};

export function downloadCSV(title: string, columns: ReportColumn[], rows: ReportRow[]): void {
  const header = columns.map((column) => escapeCell(column.label)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => escapeCell(toDisplay(row[column.key], column.type))).join(",")
  );
  const csv = [header, ...body].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadXML(title: string, columns: ReportColumn[], rows: ReportRow[]): void {
  const headerXml = columns
    .map((column) => `<Cell><Data ss:Type="String">${column.label}</Data></Cell>`)
    .join("");

  const rowXml = rows
    .map((row) => {
      const cells = columns
        .map((column) => {
          const raw = row[column.key];
          const displayValue = toDisplay(raw, column.type);
          const numeric =
            typeof raw === "number" && (column.type === "number" || column.type === "currency");
          const type = numeric ? "Number" : "String";
          return `<Cell><Data ss:Type="${type}">${displayValue}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${title}">
    <Table>
      <Row>${headerXml}</Row>
      ${rowXml}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printReport(title: string, columns: ReportColumn[], rows: ReportRow[], meta: ReportMeta): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const header = columns.map((column) => `<th>${column.label}</th>`).join("");
  const body = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${toDisplay(row[column.key], column.type) || "&mdash;"}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const totals = Object.entries(meta.totals)
    .map(([key, value]) => `<div><strong>${key}</strong>: ${value}</div>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 24px; color: #111827; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    .meta { margin-bottom: 16px; font-size: 12px; color: #4b5563; display: grid; gap: 4px; }
    .totals { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
    th { background: #f3f4f6; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    <div>From ${new Date(meta.interval.start).toLocaleDateString("en-IN")} to ${new Date(meta.interval.end).toLocaleDateString("en-IN")}</div>
    <div>Generated at ${new Date(meta.generatedAt).toLocaleString("en-IN")}</div>
  </div>
  <div class="totals">${totals}</div>
  <table>
    <thead><tr>${header}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

