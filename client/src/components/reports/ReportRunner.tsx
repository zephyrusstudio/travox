import {
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
} from "lucide-react";
import React from "react";
import { PageHeader, StatCard } from "../../design-system/patterns";
import { apiRequest } from "../../utils/apiConnector";
import { errorToast } from "../../utils/toasts";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Spinner from "../ui/Spinner";
import Table, { TableBody, TableCell, TableHeader, TableRow } from "../ui/Table";
import { downloadCSV, downloadXML, printReport } from "./reportingExport";
import {
  getReportUIConfig,
  PAYMENT_MODE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
} from "./reportingRegistry";
import {
  ReportCatalogItem,
  ReportCatalogResponse,
  ReportColumn,
  ReportResponse,
  ReportRow,
} from "./reportingTypes";

interface ReportRunnerProps {
  reportId: string;
}

interface EntityListResponse {
  status: string;
  data: Array<{ id: string; name: string }>;
  count?: number;
}

type EntityListItem = EntityListResponse["data"][number];

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 3);

  const toInputDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: toInputDate(start),
    endDate: toInputDate(end),
  };
};

const formatCellValue = (column: ReportColumn, row: ReportRow): string => {
  const raw = row[column.key];
  if (raw === null || raw === undefined || raw === "") return "-";

  if (column.type === "date" && typeof raw === "string") {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    }
  }

  if (column.type === "currency" && typeof raw === "number") {
    return `₹${raw.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }

  if (column.type === "number" && typeof raw === "number") {
    return raw.toLocaleString("en-IN");
  }

  return String(raw);
};

const sortEntitiesByName = (items: EntityListItem[]): EntityListItem[] =>
  [...items].sort((left, right) =>
    left.name.localeCompare(right.name, "en-IN", { sensitivity: "base" }) ||
    left.id.localeCompare(right.id)
  );

const fetchAllEntities = async (url: string): Promise<EntityListItem[]> => {
  const limit = 500;
  let offset = 0;
  let count: number | undefined;
  const items: EntityListItem[] = [];

  do {
    const response = await apiRequest<EntityListResponse>({
      method: "GET",
      url,
      params: { limit, offset },
    });
    const page = response.data ?? [];
    items.push(...page);
    count = typeof response.count === "number" ? response.count : count;
    offset += page.length;

    if (page.length === 0) {
      break;
    }
  } while (count === undefined ? page.length === limit : offset < count);

  return sortEntitiesByName(items);
};

const ReportRunner: React.FC<ReportRunnerProps> = ({ reportId }) => {
  const [catalogItem, setCatalogItem] = React.useState<ReportCatalogItem | null>(null);
  const [columns, setColumns] = React.useState<ReportColumn[]>([]);
  const [rows, setRows] = React.useState<ReportRow[]>([]);
  const [meta, setMeta] = React.useState<ReportResponse["meta"] | null>(null);

  const [customers, setCustomers] = React.useState<Array<{ id: string; name: string }>>([]);
  const [vendors, setVendors] = React.useState<Array<{ id: string; name: string }>>([]);

  const [loading, setLoading] = React.useState(false);
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const [applyNonce, setApplyNonce] = React.useState(0);

  const defaultRange = React.useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = React.useState(defaultRange.startDate);
  const [endDate, setEndDate] = React.useState(defaultRange.endDate);
  const [search, setSearch] = React.useState("");

  const [customerId, setCustomerId] = React.useState("");
  const [vendorId, setVendorId] = React.useState("");
  const [transactionType, setTransactionType] = React.useState("");
  const [paymentMode, setPaymentMode] = React.useState("");
  const [serviceType, setServiceType] = React.useState("");

  const [pendingOnly, setPendingOnly] = React.useState(false);
  const [includeRefunds, setIncludeRefunds] = React.useState(true);
  const [includePaymentDetails, setIncludePaymentDetails] = React.useState(true);
  const [includeZeroBalance, setIncludeZeroBalance] = React.useState(true);

  const config = React.useMemo(() => getReportUIConfig(reportId), [reportId]);

  const loadCatalog = React.useCallback(async () => {
    const response = await apiRequest<ReportCatalogResponse>({
      method: "GET",
      url: "/reports/catalog",
    });
    const matched = response.data.find((item) => item.id === reportId) ?? null;
    setCatalogItem(matched);
  }, [reportId]);

  const loadEntities = React.useCallback(async () => {
    const [customerItems, vendorItems] = await Promise.all([
      fetchAllEntities("/customers"),
      fetchAllEntities("/vendors"),
    ]);
    setCustomers(customerItems);
    setVendors(vendorItems);
  }, []);

  const runReport = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean> = {
        interval: `${startDate},${endDate}`,
        search: search.trim(),
        sortBy: "date",
        sortOrder: "desc",
      };

      if (customerId) params.customerIds = customerId;
      if (vendorId) params.vendorIds = vendorId;
      if (transactionType) params.transactionTypes = transactionType;
      if (paymentMode) params.paymentModes = paymentMode;
      if (serviceType) params.serviceTypes = serviceType;
      if (config.supportsPendingOnly) params.pendingOnly = pendingOnly;
      if (config.supportsIncludeRefunds) params.includeRefunds = includeRefunds;
      if (config.supportsIncludePaymentDetails) {
        params.includePaymentDetails = includePaymentDetails;
      }
      if (config.supportsIncludeZeroBalance) params.includeZeroBalance = includeZeroBalance;

      const response = await apiRequest<ReportResponse>({
        method: "GET",
        url: `/reports/${reportId}`,
        params,
      });

      setColumns(response.columns ?? []);
      setRows(response.data ?? []);
      setMeta(response.meta ?? null);
    } catch {
      errorToast("Failed to load report data");
      setColumns([]);
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [
    customerId,
    endDate,
    includePaymentDetails,
    includeRefunds,
    includeZeroBalance,
    pendingOnly,
    paymentMode,
    reportId,
    search,
    serviceType,
    startDate,
    transactionType,
    vendorId,
    config.supportsPendingOnly,
    config.supportsIncludeRefunds,
    config.supportsIncludePaymentDetails,
    config.supportsIncludeZeroBalance,
  ]);

  React.useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([loadCatalog(), loadEntities()]);
      } catch {
        errorToast("Failed to initialize report filters");
      } finally {
        setApplyNonce((prev) => prev + 1);
      }
    };
    void bootstrap();
  }, [loadCatalog, loadEntities, reportId]);

  React.useEffect(() => {
    setCustomerId("");
    setVendorId("");
    setTransactionType("");
    setPaymentMode("");
    setServiceType("");
    setPendingOnly(false);
    setIncludeRefunds(true);
    setIncludePaymentDetails(true);
    setIncludeZeroBalance(true);
  }, [reportId]);

  React.useEffect(() => {
    if (applyNonce === 0) return;
    void runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyNonce]);

  const totalCards = React.useMemo(() => {
    if (!meta) return [];
    return Object.entries(meta.totals).slice(0, 6);
  }, [meta]);

  const title = catalogItem?.label || "Report";
  const description =
    catalogItem?.description || "Run report filters, inspect rows, and export to CSV/XML or print-ready PDF.";

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button icon={RefreshCw} variant="outline" onClick={() => void runReport()}>
              Refresh
            </Button>
            <div className="relative">
              <Button
                icon={Download}
                variant="outline"
                onClick={() => setShowExportMenu((prev) => !prev)}
              >
                Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      downloadCSV(title, columns, rows);
                      setShowExportMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FileText className="h-4 w-4" />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadXML(title, columns, rows);
                      setShowExportMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export XML (.xls)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (meta) {
                        printReport(title, columns, rows, meta);
                      }
                      setShowExportMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                    Print / PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            End date
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-gray-600 dark:bg-gray-800"
            />
          </label>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300 xl:col-span-2">
            Search
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search rows"
                className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
          </label>

          {config.supportsCustomerFilter && (
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Customer
              <select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="">All customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {config.supportsVendorFilter && (
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Vendor
              <select
                value={vendorId}
                onChange={(event) => setVendorId(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="">All vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {config.supportsTransactionTypeFilter && (
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Transaction Type
              <select
                value={transactionType}
                onChange={(event) => setTransactionType(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="">All types</option>
                {TRANSACTION_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          )}

          {config.supportsPaymentModeFilter && (
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Payment Mode
              <select
                value={paymentMode}
                onChange={(event) => setPaymentMode(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="">All modes</option>
                {PAYMENT_MODE_OPTIONS.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
          )}

          {config.supportsServiceTypeFilter && (
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Product / Service
              <select
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-[var(--color-primary)] dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="">All labels</option>
                {SERVICE_TYPE_OPTIONS.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
            {config.supportsPendingOnly && (
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pendingOnly}
                  onChange={(event) => setPendingOnly(event.target.checked)}
                />
                Pending only
              </label>
            )}
            {config.supportsIncludeRefunds && (
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeRefunds}
                  onChange={(event) => setIncludeRefunds(event.target.checked)}
                />
                Include refunds
              </label>
            )}
            {config.supportsIncludePaymentDetails && (
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includePaymentDetails}
                  onChange={(event) => setIncludePaymentDetails(event.target.checked)}
                />
                Include payment details
              </label>
            )}
            {config.supportsIncludeZeroBalance && (
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeZeroBalance}
                  onChange={(event) => setIncludeZeroBalance(event.target.checked)}
                />
                Include zero balance
              </label>
            )}
          </div>

          <Button variant="primary" onClick={() => void runReport()}>
            Apply Filters
          </Button>
        </div>
      </Card>

      {totalCards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {totalCards.map(([key, value]) => (
            <StatCard
              key={key}
              label={key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}
              value={typeof value === "number" ? value.toLocaleString("en-IN") : String(value)}
              tone="neutral"
            />
          ))}
        </div>
      )}

      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-300">
            No rows found for the selected filters.
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      header
                      className={column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : ""}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={`${index}-${String(row[columns[0]?.key || "id"] || "")}`}>
                    {columns.map((column) => (
                      <TableCell
                        key={`${index}-${column.key}`}
                        className={
                          column.align === "right"
                            ? "text-right tabular-nums"
                            : column.align === "center"
                            ? "text-center"
                            : ""
                        }
                      >
                        {formatCellValue(column, row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportRunner;
