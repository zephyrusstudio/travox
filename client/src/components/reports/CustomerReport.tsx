/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Download,
  RefreshCw,
  Users,
  Filter,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, StatCard } from "../../design-system/patterns";
import { SearchField } from "../../design-system/primitives";
import { apiRequest } from "../../utils/apiConnector";
import { errorToast } from "../../utils/toasts";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import Spinner from "../ui/Spinner";
import Table, {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/Table";

// Types
interface CustomerBooking {
  id: string;
  packageName?: string;
  primaryPaxName?: string;
  bookingDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  travelStartAt?: string;
  travelEndAt?: string;
  payments?: BookingPayment[];
  paymentCount?: number;
  paymentModeBreakdown?: BookingPaymentModeBreakdown[];
}

interface BookingPayment {
  id: string;
  paymentType: string;
  direction: "IN" | "OUT";
  amount: number;
  paymentMode: string;
  createdAt: string;
  receiptNo?: string;
  notes?: string;
}

interface BookingPaymentModeBreakdown {
  paymentMode: string;
  amount: number;
  count: number;
}

interface CustomerReportItem {
  customer: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  bookings: CustomerBooking[];
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
  bookingCount: number;
}

interface ReportResponse {
  status: string;
  data: CustomerReportItem[];
  count: number;
  pendingOnly: boolean;
  interval: {
    start: string;
    end: string;
  };
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

const getDefaultDateRange = (): { start: string; end: string } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 4, now.getDate());
  const end = now;
  
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    start: formatLocalDate(start),
    end: formatLocalDate(end),
  };
};

const calculateWeeksBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.round(diffDays / 7);
};

const getExportFileName = (extension: string): string => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = now.toLocaleString('en-IN', { month: 'short' });
  const year = now.getFullYear();
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '');
  return `Travox - Customer Payment Report - ${day}-${month}-${year} ${time}.${extension}`;
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  NETBANKING: "Net Banking",
  CHEQUE: "Cheque",
  WALLET: "Wallet",
  OTHER: "Other",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
};

const PAYMENT_MODE_BADGES: Record<
  string,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  CASH: "success",
  CARD: "warning",
  UPI: "info",
  BANK_TRANSFER: "default",
  NETBANKING: "info",
  CHEQUE: "default",
  WALLET: "info",
  OTHER: "default",
  CREDIT_CARD: "danger",
  DEBIT_CARD: "warning",
};

const getPaymentModeLabel = (paymentMode?: string): string => {
  if (!paymentMode) return "Unknown";
  const normalized = paymentMode.toUpperCase();
  return PAYMENT_MODE_LABELS[normalized] || normalized;
};

const getPaymentModeBadgeVariant = (
  paymentMode?: string
): "default" | "success" | "warning" | "danger" | "info" => {
  if (!paymentMode) return "default";
  const normalized = paymentMode.toUpperCase();
  return PAYMENT_MODE_BADGES[normalized] || "default";
};

const CustomerReport: React.FC = () => {
  const [reportData, setReportData] = useState<CustomerReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Date range state
  const defaultDates = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const interval = `${startDate},${endDate}`;
      const res = await apiRequest<ReportResponse>({
        method: "GET",
        url: "/customers/report",
        params: { interval, pendingOnly },
      });
      
      if (res?.status === "success" && Array.isArray(res.data)) {
        setReportData(res.data);
      } else {
        setReportData([]);
      }
    } catch (error: any) {
      errorToast(error?.message || "Failed to load customer report");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, pendingOnly]);

  // Fetch on initial mount only
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (customerId: string) => {
    setExpandedCustomers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  // Filter by search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return reportData;
    const lowerSearch = searchTerm.toLowerCase();
    return reportData.filter(
      (item) =>
        item.customer.name.toLowerCase().includes(lowerSearch) ||
        item.customer.email?.toLowerCase().includes(lowerSearch) ||
        item.customer.phone?.includes(searchTerm) ||
        item.bookings.some(
          (b) =>
            b.packageName?.toLowerCase().includes(lowerSearch) ||
            b.primaryPaxName?.toLowerCase().includes(lowerSearch)
        )
    );
  }, [reportData, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const totalCustomers = filteredData.length;
    const totalAmount = filteredData.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalPaid = filteredData.reduce((sum, item) => sum + item.totalPaid, 0);
    const totalDue = filteredData.reduce((sum, item) => sum + item.totalDue, 0);
    const totalBookings = filteredData.reduce((sum, item) => sum + item.bookingCount, 0);
    return { totalCustomers, totalAmount, totalPaid, totalDue, totalBookings };
  }, [filteredData]);

  type ExportRow = {
    customerName: string;
    email: string;
    phone: string;
    packageName: string;
    primaryPaxName: string;
    bookingDate: string;
    travelStartDate: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
    paymentDate: string;
    paymentMode: string;
    receiptNo: string;
    paymentAmount: string;
    paymentTypeDirection: string;
    notes: string;
  };

  const getExportRows = useCallback((): ExportRow[] => {
    const rows: ExportRow[] = [];

    filteredData.forEach((item) => {
      if (!item.bookings.length) {
        rows.push({
          customerName: item.customer.name,
          email: item.customer.email || "",
          phone: item.customer.phone || "",
          packageName: "",
          primaryPaxName: "",
          bookingDate: "",
          travelStartDate: "",
          totalAmount: 0,
          paidAmount: 0,
          dueAmount: 0,
          status: "",
          paymentDate: "",
          paymentMode: "",
          receiptNo: "",
          paymentAmount: "",
          paymentTypeDirection: "",
          notes: "",
        });
        return;
      }

      item.bookings.forEach((booking) => {
        const payments = booking.payments || [];

        if (!payments.length) {
          rows.push({
            customerName: item.customer.name,
            email: item.customer.email || "",
            phone: item.customer.phone || "",
            packageName: booking.packageName || "",
            primaryPaxName: booking.primaryPaxName || "",
            bookingDate: formatDate(booking.bookingDate),
            travelStartDate: formatDate(booking.travelStartAt),
            totalAmount: booking.totalAmount,
            paidAmount: booking.paidAmount,
            dueAmount: booking.dueAmount,
            status: booking.status,
            paymentDate: "",
            paymentMode: "",
            receiptNo: "",
            paymentAmount: "",
            paymentTypeDirection: "",
            notes: "",
          });
          return;
        }

        payments.forEach((payment) => {
          rows.push({
            customerName: item.customer.name,
            email: item.customer.email || "",
            phone: item.customer.phone || "",
            packageName: booking.packageName || "",
            primaryPaxName: booking.primaryPaxName || "",
            bookingDate: formatDate(booking.bookingDate),
            travelStartDate: formatDate(booking.travelStartAt),
            totalAmount: booking.totalAmount,
            paidAmount: booking.paidAmount,
            dueAmount: booking.dueAmount,
            status: booking.status,
            paymentDate: formatDate(payment.createdAt),
            paymentMode: getPaymentModeLabel(payment.paymentMode),
            receiptNo: payment.receiptNo || "",
            paymentAmount: `${payment.direction === "OUT" ? "-" : ""}${payment.amount}`,
            paymentTypeDirection: `${payment.paymentType} (${payment.direction})`,
            notes: payment.notes || "",
          });
        });
      });
    });

    return rows;
  }, [filteredData]);

  // Export to CSV
  const exportToCSV = () => {
    const exportRows = getExportRows();
    const rows: string[] = [];
    rows.push(
      "Customer Name,Email,Phone,Package,Primary Pax,Booking Date,Travel Start,Total Amount,Paid Amount,Due Amount,Status,Payment Date,Payment Mode,Receipt No,Payment Amount,Payment Type/Direction,Notes"
    );

    exportRows.forEach((row) => {
      rows.push(
        [
          `"${row.customerName}"`,
          `"${row.email}"`,
          `"${row.phone}"`,
          `"${row.packageName}"`,
          `"${row.primaryPaxName}"`,
          `"${row.bookingDate}"`,
          `"${row.travelStartDate}"`,
          row.totalAmount,
          row.paidAmount,
          row.dueAmount,
          `"${row.status}"`,
          `"${row.paymentDate}"`,
          `"${row.paymentMode}"`,
          `"${row.receiptNo}"`,
          `"${row.paymentAmount}"`,
          `"${row.paymentTypeDirection}"`,
          `"${row.notes}"`,
        ].join(",")
      );
    });

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", getExportFileName('csv'));
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Export to Excel (XLSX format using XML)
  const exportToExcel = () => {
    const exportRows = getExportRows();
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Customer Report">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Customer Name</Data></Cell>
        <Cell><Data ss:Type="String">Email</Data></Cell>
        <Cell><Data ss:Type="String">Phone</Data></Cell>
        <Cell><Data ss:Type="String">Package</Data></Cell>
        <Cell><Data ss:Type="String">Primary Pax</Data></Cell>
        <Cell><Data ss:Type="String">Booking Date</Data></Cell>
        <Cell><Data ss:Type="String">Travel Start</Data></Cell>
        <Cell><Data ss:Type="String">Total Amount</Data></Cell>
        <Cell><Data ss:Type="String">Paid Amount</Data></Cell>
        <Cell><Data ss:Type="String">Due Amount</Data></Cell>
        <Cell><Data ss:Type="String">Status</Data></Cell>
        <Cell><Data ss:Type="String">Payment Date</Data></Cell>
        <Cell><Data ss:Type="String">Payment Mode</Data></Cell>
        <Cell><Data ss:Type="String">Receipt No</Data></Cell>
        <Cell><Data ss:Type="String">Payment Amount</Data></Cell>
        <Cell><Data ss:Type="String">Payment Type/Direction</Data></Cell>
        <Cell><Data ss:Type="String">Notes</Data></Cell>
      </Row>`;

    exportRows.forEach((row) => {
      xmlContent += `
      <Row>
        <Cell><Data ss:Type="String">${row.customerName}</Data></Cell>
        <Cell><Data ss:Type="String">${row.email}</Data></Cell>
        <Cell><Data ss:Type="String">${row.phone}</Data></Cell>
        <Cell><Data ss:Type="String">${row.packageName}</Data></Cell>
        <Cell><Data ss:Type="String">${row.primaryPaxName}</Data></Cell>
        <Cell><Data ss:Type="String">${row.bookingDate}</Data></Cell>
        <Cell><Data ss:Type="String">${row.travelStartDate}</Data></Cell>
        <Cell><Data ss:Type="Number">${row.totalAmount}</Data></Cell>
        <Cell><Data ss:Type="Number">${row.paidAmount}</Data></Cell>
        <Cell><Data ss:Type="Number">${row.dueAmount}</Data></Cell>
        <Cell><Data ss:Type="String">${row.status}</Data></Cell>
        <Cell><Data ss:Type="String">${row.paymentDate}</Data></Cell>
        <Cell><Data ss:Type="String">${row.paymentMode}</Data></Cell>
        <Cell><Data ss:Type="String">${row.receiptNo}</Data></Cell>
        <Cell><Data ss:Type="String">${row.paymentAmount}</Data></Cell>
        <Cell><Data ss:Type="String">${row.paymentTypeDirection}</Data></Cell>
        <Cell><Data ss:Type="String">${row.notes}</Data></Cell>
      </Row>`;
    });

    xmlContent += `
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", getExportFileName('xls'));
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Export to PDF
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Bookings Report - Travox</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');
          :root {
            --primary: #3730A3;
            --primary-soft: #E8E7FF;
            --border: #E5E7EB;
            --muted: #6B7280;
            --bg-soft: #F8FAFC;
            --ink: #111827;
          }
          * { box-sizing: border-box; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; color: var(--ink); background: white; }
          .page { padding: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; padding: 16px 20px; border: 1px solid var(--border); border-radius: 14px; background: linear-gradient(135deg, var(--primary-soft) 0%, #ffffff 100%); }
          .brand { display: flex; align-items: center; gap: 12px; }
          .brand-logo { width: 34px; height: 34px; border-radius: 10px; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; }
          .brand-name { font-size: 20px; font-weight: 800; color: #1F2937; line-height: 1; }
          .brand-tagline { margin-top: 4px; font-size: 11px; color: var(--muted); }
          .meta-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
          .meta-value { margin-top: 2px; font-size: 13px; font-weight: 600; color: #111827; }
          h1 { color: #111827; margin: 0 0 4px; font-size: 20px; }
          .subtitle { color: var(--muted); margin-bottom: 16px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
          th, td { border: 1px solid var(--border); padding: 7px 8px; text-align: left; vertical-align: top; }
          th { background-color: var(--primary); color: white; font-weight: 700; letter-spacing: .02em; }
          tbody tr:nth-child(even) { background: var(--bg-soft); }
          .amount { text-align: right; }
          .due { color: #B45309; }
          .paid { color: #047857; }
          .stats { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 10px; margin-bottom: 14px; }
          .stat-card { background: #fff; padding: 12px; border: 1px solid var(--border); border-radius: 10px; }
          .stat-value { font-size: 16px; font-weight: 800; color: #111827; }
          .stat-label { margin-top: 2px; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
          .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid var(--border); text-align: center; font-size: 10px; color: #9CA3AF; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { padding: 12px; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="brand">
              <div class="brand-logo">T</div>
              <div>
                <div class="brand-name">Travox</div>
                <div class="brand-tagline">B2B Travel Management Platform</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="meta-label">Generated on</div>
              <div class="meta-value">${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
          </div>
          <h1>Customer Bookings Report</h1>
          <p class="subtitle">Showing ${stats.totalBookings} bookings from ${stats.totalCustomers} customers</p>
          <div class="stats">
            <div class="stat-card"><div class="stat-value">${stats.totalCustomers}</div><div class="stat-label">Customers</div></div>
            <div class="stat-card"><div class="stat-value">${stats.totalBookings}</div><div class="stat-label">Bookings</div></div>
            <div class="stat-card"><div class="stat-value">${formatCurrency(stats.totalAmount)}</div><div class="stat-label">Total Amount</div></div>
            <div class="stat-card"><div class="stat-value paid">${formatCurrency(stats.totalPaid)}</div><div class="stat-label">Total Paid</div></div>
            <div class="stat-card"><div class="stat-value due">${formatCurrency(stats.totalDue)}</div><div class="stat-label">Total Due</div></div>
          </div>
          <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Package</th>
              <th>Primary Pax</th>
              <th>Booking Date</th>
              <th>Travel Date</th>
              <th class="amount">Amount</th>
              <th class="amount">Paid</th>
              <th class="amount">Due</th>
              <th>Status</th>
              <th>Payment Date</th>
              <th>Payment Mode</th>
              <th>Receipt No</th>
              <th class="amount">Payment Amount</th>
              <th>Payment Type/Direction</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.flatMap((item) =>
              item.bookings.length === 0
                ? [
                    `<tr><td>${item.customer.name}</td><td>-</td><td>-</td><td>-</td><td>-</td><td class="amount">${formatCurrency(0)}</td><td class="amount paid">${formatCurrency(0)}</td><td class="amount">${formatCurrency(0)}</td><td>-</td><td>-</td><td>-</td><td>-</td><td class="amount">-</td><td>-</td><td>-</td></tr>`,
                  ]
                : item.bookings.flatMap((booking) => {
                    const payments = booking.payments || [];
                    if (!payments.length) {
                      return [
                        `<tr><td>${item.customer.name}</td><td>${booking.packageName || "-"}</td><td>${booking.primaryPaxName || "-"}</td><td>${formatDate(booking.bookingDate)}</td><td>${formatDate(booking.travelStartAt)}</td><td class="amount">${formatCurrency(booking.totalAmount)}</td><td class="amount paid">${formatCurrency(booking.paidAmount)}</td><td class="amount ${booking.dueAmount > 0 ? "due" : ""}">${formatCurrency(booking.dueAmount)}</td><td>${booking.status}</td><td>-</td><td>-</td><td>-</td><td class="amount">-</td><td>-</td><td>-</td></tr>`,
                      ];
                    }

                    return payments.map(
                      (payment) => `
                      <tr>
                        <td>${item.customer.name}</td>
                        <td>${booking.packageName || "-"}</td>
                        <td>${booking.primaryPaxName || "-"}</td>
                        <td>${formatDate(booking.bookingDate)}</td>
                        <td>${formatDate(booking.travelStartAt)}</td>
                        <td class="amount">${formatCurrency(booking.totalAmount)}</td>
                        <td class="amount paid">${formatCurrency(booking.paidAmount)}</td>
                        <td class="amount ${booking.dueAmount > 0 ? "due" : ""}">${formatCurrency(booking.dueAmount)}</td>
                        <td>${booking.status}</td>
                        <td>${formatDate(payment.createdAt)}</td>
                        <td>${getPaymentModeLabel(payment.paymentMode)}</td>
                        <td>${payment.receiptNo || "-"}</td>
                        <td class="amount">${payment.direction === "OUT" ? "-" : ""}${formatCurrency(payment.amount)}</td>
                        <td>${payment.paymentType} (${payment.direction})</td>
                        <td>${payment.notes || "-"}</td>
                      </tr>
                    `
                    );
                  })
            ).join("")}
          </tbody>
          </table>
          <div class="footer">
            <p>This report was generated by Travox - B2B Travel Management Platform</p>
            <p>© ${new Date().getFullYear()} Zephyrus. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    setShowExportMenu(false);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "confirmed") return <Badge variant="success">{status}</Badge>;
    if (statusLower === "pending") return <Badge variant="warning">{status}</Badge>;
    if (statusLower === "cancelled" || statusLower === "refunded")
      return <Badge variant="danger">{status}</Badge>;
    return <Badge variant="default">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Bookings Report"
        description="Analyze customer bookings, payment progress, and pending dues by date interval."
        actions={
          <>
            <Button onClick={fetchReport} icon={RefreshCw} variant="outline" disabled={loading}>
              Refresh
            </Button>
            <div className="relative">
              <Button
                onClick={() => setShowExportMenu(!showExportMenu)}
                icon={Download}
                disabled={loading || filteredData.length === 0}
              >
                Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 z-10 mt-2 w-52 rounded-2xl border border-gray-200 bg-white/95 p-1 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
                  <button
                    onClick={exportToCSV}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-[var(--color-primary-soft)] dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <FileText className="h-4 w-4" /> Export as CSV
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-[var(--color-primary-soft)] dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Export as Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-[var(--color-primary-soft)] dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Download className="h-4 w-4" /> Export as PDF
                  </button>
                </div>
              )}
            </div>
          </>
        }
      />

      {/* Filters */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="form-label">
                Booking Date <span className="text-blue-600 dark:text-blue-400 text-xs">Range From</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">
                Booking Date <span className="text-blue-600 dark:text-blue-400 text-xs">Range To</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">
                Filter
              </label>
              <button
                onClick={() => setPendingOnly(!pendingOnly)}
                className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors ${
                  pendingOnly
                    ? "bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300"
                    : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-[var(--color-primary-soft)] dark:hover:bg-gray-800"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>{pendingOnly ? "Pending Payment" : "All Bookings"}</span>
              </button>
            </div>
            <div>
              <label className="form-label">
                {calculateWeeksBetween(startDate, endDate)} weeks selected
              </label>
              <Button
                onClick={fetchReport}
                variant="primary"
                disabled={loading}
                className="w-full"
              >
                Apply
              </Button>
            </div>
            <div className="md:col-span-2">
              <label className="form-label">
                Search
              </label>
              <div className="relative">
                <SearchField
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search by customer name, email, phone, or package"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <StatCard label="Customers" value={stats.totalCustomers.toString()} tone="primary" />
        <StatCard label="Bookings" value={stats.totalBookings.toString()} />
        <StatCard label="Total Amount" value={formatCurrency(stats.totalAmount)} />
        <StatCard label="Total Paid" value={formatCurrency(stats.totalPaid)} />
        <StatCard label="Total Due" value={formatCurrency(stats.totalDue)} />
      </div>

      {/* Report Table */}
      {loading ? (
        <Card className="rounded-2xl">
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-gray-600 dark:text-gray-400">Loading report...</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredData.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Data Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "No customers match your search criteria."
                : "No bookings found in the selected date range."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-900">
                  <TableCell header>Customer</TableCell>
                  <TableCell header>Contact</TableCell>
                  <TableCell header>Bookings</TableCell>
                  <TableCell header>Total Amount</TableCell>
                  <TableCell header>Paid</TableCell>
                  <TableCell header>Due</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <React.Fragment key={item.customer.id}>
                    <TableRow
                      onClick={() => toggleExpand(item.customer.id)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`transform transition-transform duration-200 ${
                              expandedCustomers.has(item.customer.id) ? "rotate-90" : ""
                            }`}
                          >
                            ▶
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {item.customer.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.customer.email && (
                            <p className="text-gray-600 dark:text-gray-400">{item.customer.email}</p>
                          )}
                          {item.customer.phone && (
                            <p className="text-gray-500 dark:text-gray-500">{item.customer.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{item.bookingCount} bookings</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(item.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(item.totalPaid)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            item.totalDue > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {formatCurrency(item.totalDue)}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Expanded bookings */}
                    {expandedCustomers.has(item.customer.id) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50 dark:bg-gray-900/50">
                          <div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase">
                                  <th className="text-left py-2 px-2">Package</th>
                                  <th className="text-left py-2 px-2">Pax</th>
                                  <th className="text-left py-2 px-2">Booking Date</th>
                                  <th className="text-left py-2 px-2">Travel Date</th>
                                  <th className="text-right py-2 px-2">Amount</th>
                                  <th className="text-right py-2 px-2">Paid</th>
                                  <th className="text-right py-2 px-2">Due</th>
                                  <th className="text-center py-2 px-2">Status</th>
                                  <th className="text-center py-2 px-2">Payments</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.bookings.map((booking) => {
                                  const bookingPayments = booking.payments || [];

                                  return (
                                    <React.Fragment key={booking.id}>
                                      <tr className="border-t border-gray-200 dark:border-gray-700">
                                        <td className="py-2 px-2 text-gray-900 dark:text-gray-100">
                                          {booking.packageName || "-"}
                                        </td>
                                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                                          {booking.primaryPaxName || "-"}
                                        </td>
                                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                                          {formatDate(booking.bookingDate)}
                                        </td>
                                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                                          {formatDate(booking.travelStartAt)}
                                        </td>
                                        <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-100">
                                          {formatCurrency(booking.totalAmount)}
                                        </td>
                                        <td className="py-2 px-2 text-right text-green-600 dark:text-green-400">
                                          {formatCurrency(booking.paidAmount)}
                                        </td>
                                        <td
                                          className={`py-2 px-2 text-right ${
                                            booking.dueAmount > 0
                                              ? "text-amber-600 dark:text-amber-400"
                                              : "text-gray-500 dark:text-gray-400"
                                          }`}
                                        >
                                          {formatCurrency(booking.dueAmount)}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          {getStatusBadge(booking.status)}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          <Badge variant="info">
                                            {booking.paymentCount ?? bookingPayments.length} payments
                                          </Badge>
                                        </td>
                                      </tr>
                                      <tr className="border-t border-gray-200 dark:border-gray-700">
                                        <td colSpan={9} className="py-3 px-2 bg-white/70 dark:bg-gray-950/40">
                                          <div className="space-y-3">
                                            {bookingPayments.length > 0 ? (
                                              <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                  <thead>
                                                    <tr className="text-gray-500 dark:text-gray-400 uppercase">
                                                      <th className="text-left py-2 px-2">Date</th>
                                                      <th className="text-left py-2 px-2">Mode</th>
                                                      <th className="text-left py-2 px-2">Receipt</th>
                                                      <th className="text-right py-2 px-2">Amount</th>
                                                      <th className="text-center py-2 px-2">Type</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {bookingPayments.map((payment) => (
                                                      <tr
                                                        key={`${booking.id}-${payment.id}`}
                                                        className="border-t border-gray-200 dark:border-gray-700"
                                                      >
                                                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                                                          {formatDate(payment.createdAt)}
                                                        </td>
                                                        <td className="py-2 px-2">
                                                          <Badge
                                                            variant={getPaymentModeBadgeVariant(payment.paymentMode)}
                                                            size="sm"
                                                          >
                                                            {getPaymentModeLabel(payment.paymentMode)}
                                                          </Badge>
                                                        </td>
                                                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                                                          {payment.receiptNo || "-"}
                                                        </td>
                                                        <td
                                                          className={`py-2 px-2 text-right font-semibold ${
                                                            payment.direction === "OUT"
                                                              ? "text-red-600 dark:text-red-400"
                                                              : "text-green-600 dark:text-green-400"
                                                          }`}
                                                        >
                                                          {payment.direction === "OUT" ? "-" : ""}
                                                          {formatCurrency(payment.amount)}
                                                        </td>
                                                        <td className="py-2 px-2 text-center">
                                                          <Badge
                                                            variant={
                                                              payment.direction === "OUT" ? "danger" : "success"
                                                            }
                                                            size="sm"
                                                          >
                                                            {payment.paymentType} ({payment.direction})
                                                          </Badge>
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            ) : (
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                No payment transactions recorded for this booking.
                                              </p>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerReport;
