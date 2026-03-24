/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Calendar,
  Download,
  IndianRupee,
  RefreshCw,
  Search,
  Users,
  Filter,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 15px 20px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
          .brand { display: flex; align-items: center; gap: 12px; }
          .brand-logo { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
          .brand-logo svg { width: 36px; height: 36px; color: white; }
          .brand-name { font-size: 24px; font-weight: bold; color: white; }
          .brand-tagline { font-size: 11px; color: rgba(255,255,255,0.8); }
          h1 { color: #1f2937; margin-bottom: 5px; margin-top: 0; }
          .subtitle { color: #6b7280; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
          th { background-color: #3b82f6; color: white; font-weight: 600; }
          .amount { text-align: right; }
          .due { color: #d97706; }
          .paid { color: #059669; }
          .stats { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
          .stat-card { background: #f9fafb; padding: 15px 20px; text-align: center; border: 1px solid #e5e7eb; }
          .stat-value { font-size: 22px; font-weight: bold; color: #1f2937; }
          .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <div class="brand-logo"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg></div>
            <div>
              <div class="brand-name">Travox</div>
              <div class="brand-tagline">B2B Travel Management Platform</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: rgba(255,255,255,0.8);">Generated on</div>
            <div style="font-weight: 600; color: white;">${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</div>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Customer Bookings Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View customer bookings and payment status within a date range
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
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
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={exportToCSV}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FileText className="w-4 h-4 mr-2" /> Export as CSV
                </button>
                <button
                  onClick={exportToExcel}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Export as Excel
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" /> Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Booking Date <span className="text-blue-600 dark:text-blue-400 text-xs">Range From</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Booking Date <span className="text-blue-600 dark:text-blue-400 text-xs">Range To</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter
              </label>
              <button
                onClick={() => setPendingOnly(!pendingOnly)}
                className={`w-full flex items-center justify-center space-x-2 border rounded-md px-3 py-2 transition-colors ${
                  pendingOnly
                    ? "bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>{pendingOnly ? "Pending Payment" : "All Bookings"}</span>
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by customer name, email, phone, package..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalCustomers}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalBookings}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <IndianRupee className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(stats.totalAmount)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(stats.totalPaid)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(stats.totalDue)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Due</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Table */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-gray-600 dark:text-gray-400">Loading report...</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredData.length === 0 ? (
        <Card>
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
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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

