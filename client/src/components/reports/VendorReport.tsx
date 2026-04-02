/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Building2,
  Download,
  RefreshCw,
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
interface VendorPayment {
  id: string;
  bookingId?: string;
  amount: number;
  paymentMode: string;
  notes?: string;
  createdAt: string;
}

interface VendorReportItem {
  vendor: {
    id: string;
    name: string;
    serviceType?: string;
    phone?: string;
    email?: string;
  };
  payments: VendorPayment[];
  totalPaid: number;
  paymentCount: number;
}

interface ReportResponse {
  status: string;
  data: VendorReportItem[];
  count: number;
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
  return `Travox - Vendor Payment Report - ${day}-${month}-${year} ${time}.${extension}`;
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  UPI: "UPI",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

const PAYMENT_MODE_BADGES: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  CASH: "success",
  BANK_TRANSFER: "info",
  UPI: "warning",
  CREDIT_CARD: "danger",
  DEBIT_CARD: "default",
  CHEQUE: "default",
  OTHER: "default",
};

const VendorReport: React.FC = () => {
  const [reportData, setReportData] = useState<VendorReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
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
        url: "/vendors/report",
        params: { interval },
      });

      if (res?.status === "success" && Array.isArray(res.data)) {
        setReportData(res.data);
      } else {
        setReportData([]);
      }
    } catch (error: any) {
      errorToast(error?.message || "Failed to load vendor report");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch on initial mount only
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (vendorId: string) => {
    setExpandedVendors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
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
        item.vendor.name.toLowerCase().includes(lowerSearch) ||
        item.vendor.email?.toLowerCase().includes(lowerSearch) ||
        item.vendor.phone?.includes(searchTerm) ||
        item.vendor.serviceType?.toLowerCase().includes(lowerSearch)
    );
  }, [reportData, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const totalVendors = filteredData.length;
    const totalPaid = filteredData.reduce((sum, item) => sum + item.totalPaid, 0);
    const totalPayments = filteredData.reduce((sum, item) => sum + item.paymentCount, 0);
    const avgPayment = totalPayments > 0 ? totalPaid / totalPayments : 0;
    return { totalVendors, totalPaid, totalPayments, avgPayment };
  }, [filteredData]);

  // Export to CSV
  const exportToCSV = () => {
    const rows: string[] = [];
    rows.push("Vendor Name,Service Type,Email,Phone,Payment Date,Amount,Payment Mode,Notes");

    filteredData.forEach((item) => {
      if (item.payments.length === 0) {
        rows.push(
          [
            `"${item.vendor.name}"`,
            `"${item.vendor.serviceType || ""}"`,
            `"${item.vendor.email || ""}"`,
            `"${item.vendor.phone || ""}"`,
            "",
            "0",
            "",
            "",
          ].join(",")
        );
      } else {
        item.payments.forEach((payment) => {
          rows.push(
            [
              `"${item.vendor.name}"`,
              `"${item.vendor.serviceType || ""}"`,
              `"${item.vendor.email || ""}"`,
              `"${item.vendor.phone || ""}"`,
              formatDate(payment.createdAt),
              payment.amount,
              PAYMENT_MODE_LABELS[payment.paymentMode] || payment.paymentMode,
              `"${payment.notes || ""}"`,
            ].join(",")
          );
        });
      }
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
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Vendor Expense Report">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Vendor Name</Data></Cell>
        <Cell><Data ss:Type="String">Service Type</Data></Cell>
        <Cell><Data ss:Type="String">Email</Data></Cell>
        <Cell><Data ss:Type="String">Phone</Data></Cell>
        <Cell><Data ss:Type="String">Payment Date</Data></Cell>
        <Cell><Data ss:Type="String">Amount</Data></Cell>
        <Cell><Data ss:Type="String">Payment Mode</Data></Cell>
        <Cell><Data ss:Type="String">Notes</Data></Cell>
      </Row>`;

    filteredData.forEach((item) => {
      if (item.payments.length === 0) {
        xmlContent += `
      <Row>
        <Cell><Data ss:Type="String">${item.vendor.name}</Data></Cell>
        <Cell><Data ss:Type="String">${item.vendor.serviceType || ""}</Data></Cell>
        <Cell><Data ss:Type="String">${item.vendor.email || ""}</Data></Cell>
        <Cell><Data ss:Type="String">${item.vendor.phone || ""}</Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="Number">0</Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
      </Row>`;
      } else {
        item.payments.forEach((payment) => {
          xmlContent += `
      <Row>
        <Cell><Data ss:Type="String">${item.vendor.name}</Data></Cell>
        <Cell><Data ss:Type="String">${item.vendor.serviceType || ""}</Data></Cell>
        <Cell><Data ss:Type="String">${item.vendor.email || ""}</Data></Cell>
        <Cell><Data ss:Type="String">${item.vendor.phone || ""}</Data></Cell>
        <Cell><Data ss:Type="String">${formatDate(payment.createdAt)}</Data></Cell>
        <Cell><Data ss:Type="Number">${payment.amount}</Data></Cell>
        <Cell><Data ss:Type="String">${PAYMENT_MODE_LABELS[payment.paymentMode] || payment.paymentMode}</Data></Cell>
        <Cell><Data ss:Type="String">${payment.notes || ""}</Data></Cell>
      </Row>`;
        });
      }
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
        <title>Vendor Expense Report - Travox</title>
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
          .amount { text-align: right; color: #e11d48; }
          .stats { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 10px; margin-bottom: 14px; }
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
          <h1>Vendor Expense Report</h1>
          <p class="subtitle">Showing ${stats.totalPayments} payments to ${stats.totalVendors} vendors</p>
          <div class="stats">
            <div class="stat-card"><div class="stat-value">${stats.totalVendors}</div><div class="stat-label">Vendors</div></div>
            <div class="stat-card"><div class="stat-value">${stats.totalPayments}</div><div class="stat-label">Payments</div></div>
            <div class="stat-card"><div class="stat-value">${formatCurrency(stats.totalPaid)}</div><div class="stat-label">Total Paid</div></div>
            <div class="stat-card"><div class="stat-value">${formatCurrency(Math.round(stats.avgPayment))}</div><div class="stat-label">Avg Payment</div></div>
          </div>
          <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Service Type</th>
              <th>Payment Date</th>
              <th class="amount">Amount</th>
              <th>Payment Mode</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.flatMap((item) =>
              item.payments.length === 0
                ? [`<tr><td>${item.vendor.name}</td><td>${item.vendor.serviceType || "-"}</td><td>-</td><td class="amount">₹0</td><td>-</td><td>-</td></tr>`]
                : item.payments.map((payment) => `
                  <tr>
                    <td>${item.vendor.name}</td>
                    <td>${item.vendor.serviceType || "-"}</td>
                    <td>${formatDate(payment.createdAt)}</td>
                    <td class="amount">${formatCurrency(payment.amount)}</td>
                    <td>${PAYMENT_MODE_LABELS[payment.paymentMode] || payment.paymentMode}</td>
                    <td>${payment.notes || "-"}</td>
                  </tr>
                `)
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

  const getServiceTypeBadge = (serviceType?: string) => {
    if (!serviceType) return null;
    const badges: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
      FLIGHT: "info",
      HOTEL: "success",
      TRANSPORT: "warning",
      VISA: "danger",
      INSURANCE: "default",
      MARKETING: "default",
      OFFICE: "default",
      OTHER: "default",
    };
    return (
      <Badge variant={badges[serviceType] || "default"} size="sm">
        {serviceType}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Expense Report"
        description="Analyze vendor-linked expense payments by interval and service type."
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
            <div className="md:col-span-3">
              <label className="form-label">
                Search
              </label>
              <div className="relative">
                <SearchField
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search by vendor name, email, phone, or service type"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard label="Vendors" value={stats.totalVendors.toString()} tone="primary" />
        <StatCard label="Payments" value={stats.totalPayments.toString()} />
        <StatCard label="Total Paid" value={formatCurrency(stats.totalPaid)} />
        <StatCard label="Avg Payment" value={formatCurrency(Math.round(stats.avgPayment))} />
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
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Data Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "No vendors match your search criteria."
                : "No expense payments found in the selected date range."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-700">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-900">
                  <TableCell header>Vendor</TableCell>
                  <TableCell header>Service Type</TableCell>
                  <TableCell header>Contact</TableCell>
                  <TableCell header>Payments</TableCell>
                  <TableCell header>Total Paid</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <React.Fragment key={item.vendor.id}>
                    <TableRow
                      onClick={() => toggleExpand(item.vendor.id)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`transform transition-transform duration-200 ${
                              expandedVendors.has(item.vendor.id) ? "rotate-90" : ""
                            }`}
                          >
                            ▶
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {item.vendor.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getServiceTypeBadge(item.vendor.serviceType)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.vendor.email && (
                            <p className="text-gray-600 dark:text-gray-400">{item.vendor.email}</p>
                          )}
                          {item.vendor.phone && (
                            <p className="text-gray-500 dark:text-gray-500">{item.vendor.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{item.paymentCount} payments</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          {formatCurrency(item.totalPaid)}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Expanded payments */}
                    {expandedVendors.has(item.vendor.id) && item.payments.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-900/50">
                          <div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase">
                                  <th className="text-left py-2 px-2">Date</th>
                                  <th className="text-right py-2 px-2">Amount</th>
                                  <th className="text-center py-2 px-2">Payment Mode</th>
                                  <th className="text-left py-2 px-2">Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.payments.map((payment) => (
                                  <tr
                                    key={payment.id}
                                    className="border-t border-gray-200 dark:border-gray-700"
                                  >
                                    <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                                      {formatDate(payment.createdAt)}
                                    </td>
                                    <td className="py-2 px-2 text-right font-semibold text-rose-600 dark:text-rose-400">
                                      {formatCurrency(payment.amount)}
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <Badge
                                        variant={PAYMENT_MODE_BADGES[payment.paymentMode] || "default"}
                                        size="sm"
                                      >
                                        {PAYMENT_MODE_LABELS[payment.paymentMode] || payment.paymentMode}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                                      {payment.notes || "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Empty state for vendors with no payments in expanded view */}
                    {expandedVendors.has(item.vendor.id) && item.payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-900/50">
                          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                            No payments found for this vendor in the selected date range.
                          </p>
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

export default VendorReport;
