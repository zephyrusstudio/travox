/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Building2,
  Plus,
  IndianRupee,
  RefreshCw,
  Wallet,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, StatCard } from "../../design-system/patterns";
import { SearchField } from "../../design-system/primitives";
import { useSearch } from "../../hooks/useSearch";
import { ApiError, apiRequest } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import Pagination from "../ui/Pagination";
import Spinner from "../ui/Spinner";
import Loader from "../ui/Loader";
import Table, {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/Table";
import ExpenseForm from "./ExpenseForm";
import {
  ACCOUNT_OPTION_PLACEHOLDER_LABEL,
  AccountOption,
  Expense,
  ExpenseFormState,
  PAYMENT_MODE_BADGE,
  PAYMENT_MODE_LABEL,
  PaymentMode,
  VendorOption,
  formatDate,
  fromBackendPaymentMode,
  toBackendPaymentMode,
} from "./expense";

type ExpenseRow = Expense & {
  vendor_name_resolved?: string;
};

const DEFAULT_FORM_STATE: ExpenseFormState = {
  vendor_id: "",
  vendor_account_id: "",
  amount: 0,
  currency: "INR",
  payment_mode: PaymentMode.BANK_TRANSFER,
  receipt_number: "",
  category: "",
  notes: "",
  from_account_id: "",
};

const ExpenseManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([
    { id: "", label: ACCOUNT_OPTION_PLACEHOLDER_LABEL },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] =
    useState<ExpenseFormState>(DEFAULT_FORM_STATE);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [saveInFlight, setSaveInFlight] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const vendorMap = useMemo(() => {
    const map = new Map<string, VendorOption>();
    vendors.forEach((vendor) => {
      map.set(vendor.vendor_id, vendor);
    });
    return map;
  }, [vendors]);

  const enrichedExpenses = useMemo(() => {
    if (!expenses.length) return expenses;
    return expenses.map((expense) => {
      if (expense.vendor_name_resolved) return expense;
      const vendor = expense.vendor_id
        ? vendorMap.get(expense.vendor_id)
        : undefined;
      return {
        ...expense,
        vendor_name_resolved:
          vendor?.vendor_name ?? expense.vendor_name ?? "Unlinked Vendor",
      };
    });
  }, [expenses, vendorMap]);

  // ── Search ──────────────────────────────────────────────────────
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    invalidateCache,
  } = useSearch<any>({
    endpoint: "/payments?type=EXPENSE",
    searchFields: (expense) => [
      String(expense.amount || ''),
      String(expense.vendorId || expense.vendor_id || ''),
    ],
    initialFetch: true,
    unmask: true,
  });

  const fetchVendors = useCallback(async () => {
    setLoadingVendors(true);
    try {
      const res = await apiRequest<any>({
        method: "GET",
        url: "/vendors",
        params: { unmask: true },
      });
      const items = Array.isArray(res?.data) ? res.data : [];
      const mapped: VendorOption[] = items
        .map((item: any) => ({
          vendor_id: item?.id ? String(item.id) : "",
          vendor_name: item?.name || "Unnamed Vendor",
          service_type: item?.serviceType,
          account_id: item?.accountId || item?.account_id || "",
        }))
        .filter((option: VendorOption) => option.vendor_id);
      setVendors(mapped);
    } catch (error) {
      const err = error as ApiError;
      errorToast(err.message || "Failed to load vendors");
      setVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await apiRequest<any>({
        method: "GET",
        url: "/accounts",
      });
      const items = Array.isArray(res?.data) ? res.data : [];
      const mapped: AccountOption[] = [
        { id: "", label: ACCOUNT_OPTION_PLACEHOLDER_LABEL },
        ...items
          .map((item: any) => {
            const id = item?.id ? String(item.id) : "";
            if (!id) return null;
            const bank = item?.bankName || "Account";
            const accountNo = item?.accountNo
              ? `**${String(item.accountNo).slice(-4)}`
              : "";
            const label = [bank, accountNo].filter(Boolean).join(" - ");
            return { id, label: label || bank };
          })
          .filter(Boolean),
      ] as AccountOption[];
      setAccounts(mapped);
    } catch (error) {
      const err = error as ApiError;
      errorToast(err.message || "Failed to load accounts");
      setAccounts([{ id: "", label: ACCOUNT_OPTION_PLACEHOLDER_LABEL }]);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  const ensureIsoString = (value: unknown): string => {
    if (!value) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ms = String(date.getMilliseconds()).padStart(3, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
    }
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    if (
      value &&
      typeof value === "object" &&
      "seconds" in (value as Record<string, unknown>)
    ) {
      const seconds = (value as { seconds?: number }).seconds;
      if (typeof seconds === "number") {
        return new Date(seconds * 1000).toISOString();
      }
    }
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
  };

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const res = await apiRequest<any>({
        method: "GET",
        url: "/payments",
        params: { type: "EXPENSE", limit: itemsPerPage, offset },
      });
      const items = Array.isArray(res?.data) ? res.data : [];
      const mapped: ExpenseRow[] = items
        .map((item: any) => ({
          expense_id: item?.id ? String(item.id) : String(item?.payment_id),
          vendor_id: item?.vendorId ?? item?.vendor_id ?? undefined,
          vendor_name: item?.vendorName ?? item?.vendor_name ?? undefined,
          amount: Number(item?.amount ?? 0) || 0,
          currency: item?.currency || "INR",
          payment_mode: fromBackendPaymentMode(
            item?.paymentMode ?? item?.payment_mode
          ),
          category: item?.category ?? "",
          receipt_number: item?.receiptNo ?? item?.receipt_no ?? "",
          notes: item?.notes ?? "",
          created_at: ensureIsoString(item?.createdAt ?? item?.created_at),
        }));
      mapped.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setExpenses(mapped);
      // Use count from API response if available
      // For expenses, we need to count only EXPENSE type payments
      // If count is not in response, estimate based on results
      if (res?.count !== undefined) {
        setTotalItems(res.count);
      } else if (mapped.length < itemsPerPage && currentPage === 1) {
        setTotalItems(mapped.length);
      } else if (mapped.length < itemsPerPage) {
        setTotalItems(offset + mapped.length);
      } else {
        setTotalItems(offset + mapped.length + 1);
      }
    } catch (error) {
      const err = error as ApiError;
      errorToast(err.message || "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoadingExpenses(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchVendors();
    fetchAccounts();
    fetchExpenses();
  }, [fetchAccounts, fetchExpenses, fetchVendors]);

  const isLoading =
    loadingExpenses || loadingVendors || loadingAccounts || saveInFlight;

  // Map search results to ExpenseRow format
  const mappedSearchResults = useMemo((): ExpenseRow[] => {
    return searchResults.map((item: any): ExpenseRow => ({
      expense_id: item?.id ? String(item.id) : String(item?.payment_id),
      vendor_id: item?.vendorId ?? item?.vendor_id ?? undefined,
      vendor_name: item?.vendorName ?? item?.vendor_name ?? undefined,
      amount: Number(item?.amount ?? 0) || 0,
      currency: item?.currency || "INR",
      payment_mode: fromBackendPaymentMode(
        item?.paymentMode ?? item?.payment_mode
      ),
      category: item?.category ?? "",
      receipt_number: item?.receiptNo ?? item?.receipt_no ?? "",
      notes: item?.notes ?? "",
      created_at: ensureIsoString(item?.createdAt ?? item?.created_at),
    }));
  }, [searchResults]);

  // Use search results when searching, otherwise use paginated expenses
  // Enrich with vendor names and filter by vendor name and amount
  const filteredExpenses = useMemo(() => {
    if (!searchTerm) {
      // No search - just enrich and return all expenses
      return enrichedExpenses.map((expense) => {
        if (expense.vendor_name_resolved) return expense;
        const vendor = expense.vendor_id
          ? vendorMap.get(expense.vendor_id)
          : undefined;
        return {
          ...expense,
          vendor_name_resolved:
            vendor?.vendor_name ?? expense.vendor_name ?? "Unlinked Vendor",
        };
      });
    }
    
    // Searching - enrich search results and filter by vendor name and amount
    const term = searchTerm.toLowerCase().trim();
    return mappedSearchResults
      .map((expense) => {
        if (expense.vendor_name_resolved) return expense;
        const vendor = expense.vendor_id
          ? vendorMap.get(expense.vendor_id)
          : undefined;
        return {
          ...expense,
          vendor_name_resolved:
            vendor?.vendor_name ?? expense.vendor_name ?? "Unlinked Vendor",
        };
      })
      .filter((expense) => {
        const amount = String(expense.amount || '');
        const vendorName = (expense.vendor_name_resolved || '').toLowerCase();
        
        return amount.includes(term) || vendorName.includes(term);
      });
  }, [searchTerm, mappedSearchResults, enrichedExpenses, vendorMap]);

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `EXP${timestamp}${randomNum}`;
  };

  const handleOpenModal = useCallback(() => {
    setFormData({
      ...DEFAULT_FORM_STATE,
      receipt_number: generateReceiptNumber(),
    });
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    const handleQuickAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ actionId?: string }>;
      if (customEvent.detail?.actionId === "expense.create") {
        handleOpenModal();
      }
    };

    window.addEventListener("travox:quick-action", handleQuickAction);
    return () =>
      window.removeEventListener("travox:quick-action", handleQuickAction);
  }, [handleOpenModal]);

  const addExpense = useCallback(
    async (data: ExpenseFormState): Promise<boolean> => {
      if (saveInFlight) return false;
      const vendor = vendorMap.get(data.vendor_id);
      if (!vendor) {
        errorToast("Select a vendor to record an expense.");
        return false;
      }
      const vendorAccountId = data.vendor_account_id || vendor.account_id || "";
      if (!vendorAccountId) {
        errorToast(
          "Selected vendor does not have a linked account. Link one before recording an expense."
        );
        return false;
      }
      if (data.amount <= 0) {
        errorToast("Amount must be greater than zero.");
        return false;
      }

      setSaveInFlight(true);
      try {
        const payload = {
          amount: Number(data.amount),
          currency: data.currency || "INR",
          paymentMode: toBackendPaymentMode(data.payment_mode),
          toAccountId: vendorAccountId,
          category: data.category?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
          receiptNo: data.receipt_number?.trim() || undefined,
          fromAccountId: data.from_account_id || undefined,
        };

        const res = await apiRequest<any>({
          method: "POST",
          url: "/payments/expense",
          data: payload,
          headers: { Accept: "*/*", "Content-Type": "application/json" },
        });

        if (!res || res.status !== "success") {
          const message =
            res?.data?.message ||
            res?.message ||
            "Failed to record expense. Please try again.";
          errorToast(message);
          return false;
        }

        successToast("Expense recorded");
        invalidateCache(); // Invalidate search cache when data changes
        await fetchExpenses();
        return true;
      } catch (error) {
        const err = error as ApiError;
        errorToast(err?.message || "Failed to record expense");
        return false;
      } finally {
        setSaveInFlight(false);
      }
    },
    [fetchExpenses, saveInFlight, vendorMap, invalidateCache]
  );

  const handleSubmit = async (data: ExpenseFormState) => {
    const created = await addExpense(data);
    if (created) {
      setFormData(DEFAULT_FORM_STATE);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Management"
        description="Record vendor payouts and track operating expenses with account-linked controls."
        actions={
          <>
            <Button
              onClick={fetchExpenses}
              icon={RefreshCw}
              variant="outline"
              disabled={loadingExpenses}
            >
              Refresh
            </Button>
            <Button onClick={handleOpenModal} icon={Plus}>
              Record Expense
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={searchTerm ? "Search Results" : "Visible Expenses"}
          value={filteredExpenses.length.toString()}
          tone="primary"
        />
        <StatCard
          label="Visible Spend"
          value={`₹${filteredExpenses.reduce((sum, item) => sum + item.amount, 0).toLocaleString("en-IN")}`}
        />
        <StatCard label="Vendors Available" value={vendors.length.toString()} />
      </div>

      <div className="flex items-center">
        <div className="relative flex-1">
          <SearchField
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search expenses by amount or vendor"
          />
          <Loader isLoading={isSearching} />
        </div>
      </div>

      {/* Pagination */}
      {!searchTerm && filteredExpenses.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      )}

      {/* Expenses Table */}
      {isLoading ? (
        <Card className="rounded-2xl">
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-gray-600">Loading expenses...</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <Wallet className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            {searchTerm ? "No Expenses Match Your Search" : "No Expenses Found"}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? "Try another keyword or clear search." : "Record an expense to populate this list."}
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-700">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              <span className="font-medium">
                Showing {filteredExpenses.length} expense{filteredExpenses.length === 1 ? "" : "s"}
              </span>
              <span>Review vendor, amount, and mode quickly before opening transaction details.</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-900">
                  <TableCell header>Receipt No.</TableCell>
                  <TableCell header>Vendor</TableCell>
                  <TableCell header>Date</TableCell>
                  <TableCell header>Amount</TableCell>
                  <TableCell header>Payment Mode</TableCell>
                  <TableCell header>Category</TableCell>
                  <TableCell header>Notes</TableCell>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                  <TableRow key={expense.expense_id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm">
                          {expense.receipt_number || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {expense.vendor_name_resolved || "Unlinked Vendor"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {formatDate(expense.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-rose-600">
                        ₹{expense.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          PAYMENT_MODE_BADGE[expense.payment_mode] as any
                        }
                        size="sm"
                      >
                        {PAYMENT_MODE_LABEL[expense.payment_mode]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {expense.category || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {expense.notes || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
                }
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}

      <ExpenseForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vendors={vendors}
        accounts={accounts}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={saveInFlight}
      />
    </div>
  );
};

export default ExpenseManagement;
