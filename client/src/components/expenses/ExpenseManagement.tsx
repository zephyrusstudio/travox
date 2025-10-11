/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Building2,
  ClipboardList,
  Plus,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent, CardHeader } from "../ui/Card";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] =
    useState<ExpenseFormState>(DEFAULT_FORM_STATE);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [saveInFlight, setSaveInFlight] = useState(false);

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
        .filter((option) => option.vendor_id);
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
    if (!value) return new Date().toISOString();
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
    return new Date().toISOString();
  };

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const res = await apiRequest<any>({
        method: "GET",
        url: "/payments",
        params: { limit: 200 },
      });
      const items = Array.isArray(res?.data) ? res.data : [];
      const mapped: ExpenseRow[] = items
        .filter((item: any) => {
          const type = item?.paymentType ?? item?.payment_type;
          return String(type || "").toUpperCase() === "EXPENSE";
        })
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
    } catch (error) {
      const err = error as ApiError;
      errorToast(err.message || "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
    fetchAccounts();
    fetchExpenses();
  }, [fetchAccounts, fetchExpenses, fetchVendors]);

  const isLoading =
    loadingExpenses || loadingVendors || loadingAccounts || saveInFlight;

  const filteredExpenses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return enrichedExpenses;
    return enrichedExpenses.filter((expense) => {
      const vendorName = (expense.vendor_name_resolved || "").toLowerCase();
      const category = (expense.category || "").toLowerCase();
      const receipt = (expense.receipt_number || "").toLowerCase();
      const notes = (expense.notes || "").toLowerCase();
      return (
        vendorName.includes(q) ||
        category.includes(q) ||
        receipt.includes(q) ||
        notes.includes(q)
      );
    });
  }, [enrichedExpenses, searchTerm]);

  const stats = useMemo(() => {
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    const now = new Date();
    const thisMonthAmount = expenses
      .filter((expense) => {
        const date = new Date(expense.created_at);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    return { totalExpenses, totalAmount, thisMonthAmount };
  }, [expenses]);

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `EXP${timestamp}${randomNum}`;
  };

  const handleOpenModal = () => {
    setFormData({
      ...DEFAULT_FORM_STATE,
      receipt_number: generateReceiptNumber(),
    });
    setIsModalOpen(true);
  };

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
    [fetchExpenses, saveInFlight, vendorMap]
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Expense Management
          </h1>
          <p className="text-gray-600">
            Record vendor payouts and track operating expenses
          </p>
        </div>
        <Button onClick={handleOpenModal} icon={Plus}>
          Record Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalExpenses}
            </p>
            <p className="text-sm text-gray-600">Total Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-rose-600">
              ₹{stats.totalAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ClipboardList className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              ₹{stats.thisMonthAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">This Month</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">
            Expense History
          </h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Receipt</TableCell>
                <TableCell header>Vendor</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Payment Mode</TableCell>
                <TableCell header>Category</TableCell>
                <TableCell header>Notes</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="py-6 text-center text-sm text-gray-500">
                      Loading expenses...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="py-6 text-center text-sm text-gray-500">
                      No expenses recorded yet.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.expense_id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Receipt className="w-4 h-4 text-gray-400" />
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
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
