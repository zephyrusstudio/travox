/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Building2,
  Calendar,
  CreditCard,
  Download,
  IndianRupee,
  RefreshCw,
  Search,
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
          .amount { text-align: right; color: #e11d48; }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Vendor Expense Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View expense payments made to vendors within a date range
          </p>
        </div>
        <div className="flex items-center space-x-4">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by vendor name, email, phone, service type..."
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalVendors}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalPayments}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <IndianRupee className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(stats.totalPaid)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(Math.round(stats.avgPayment))}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Payment</p>
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
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
