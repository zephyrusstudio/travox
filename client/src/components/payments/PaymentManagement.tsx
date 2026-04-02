/* eslint-disable @typescript-eslint/no-explicit-any */
import { CreditCard, IndianRupee, Plus, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, StatCard } from "../../design-system/patterns";
import { SearchField } from "../../design-system/primitives";
import { useSearch } from "../../hooks/useSearch";
import { ApiError, apiRequest } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import Loader from "../ui/Loader";
import Pagination from "../ui/Pagination";
import Spinner from "../ui/Spinner";
import Table, {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/Table";
import PaymentForm from "./PaymentForm";
import {
  BookingRef,
  formatDate,
  fromBackendPaymentMode,
  PAYMENT_MODE_BADGE,
  PAYMENT_MODE_LABEL,
  PaymentFormState,
  PaymentMode,
  toBackendPaymentMode,
  todayISO,
} from "./payment";

type ApiCustomer = {
  id: string;
  name: string;
  accountId?: string;
};

type ApiBooking = {
  id: string;
  customerId?: string;
  customerName?: string;
  primaryPaxName?: string;
  packageName?: string;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  currency?: string;
};

type BookingOption = BookingRef & {
  customer_id: string;
  currency: string;
  account_id?: string;
  total_amount: number;
  paid_amount: number;
};

type PaymentRow = {
  payment_id: string;
  booking_id: string;
  payment_date: string;
  amount: number;
  payment_mode: PaymentMode;
  receipt_number: string;
  notes?: string;
  currency?: string;
  payment_type?: string;
  pnrNo?: string;
};

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [rawBookings, setRawBookings] = useState<ApiBooking[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [saveInFlight, setSaveInFlight] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const customersMap = useMemo(() => {
    const map = new Map<string, ApiCustomer>();
    customers.forEach((customer) => {
      if (customer?.id) {
        map.set(String(customer.id), customer);
      }
    });
    return map;
  }, [customers]);

  const bookings = useMemo<BookingOption[]>(() => {
    if (!rawBookings.length) return [];

    return rawBookings
      .map((record) => {
        const bookingId = record?.id ? String(record.id) : "";
        if (!bookingId) return null;
        const customerId = record?.customerId ? String(record.customerId) : "";
        const customer = customerId ? customersMap.get(customerId) : undefined;

        const total = Number(record?.totalAmount ?? 0) || 0;
        const paid = Number(record?.paidAmount ?? 0) || 0;
        const dueFromRecord =
          typeof record?.dueAmount === "number"
            ? Number(record.dueAmount)
            : total - paid;
        const balance =
          Number.isFinite(dueFromRecord) && !Number.isNaN(dueFromRecord)
            ? Math.max(dueFromRecord, 0)
            : 0;

        const customerName =
          customer?.name ||
          record?.customerName ||
          record?.primaryPaxName ||
          "";

        return {
          booking_id: bookingId,
          package_name: record?.packageName || "-",
          customer_name: customerName,
          balance_amount: balance,
          customer_id: customerId,
          currency: record?.currency || "INR",
          account_id: customer?.accountId,
          total_amount: total,
          paid_amount: paid,
        } as BookingOption;
      })
      .filter((item): item is BookingOption => Boolean(item));
  }, [rawBookings, customersMap]);

  const bookingsMap = useMemo(() => {
    const map = new Map<string, BookingOption>();
    bookings.forEach((booking) => {
      map.set(booking.booking_id, booking);
    });
    return map;
  }, [bookings]);

  // ── Search ──────────────────────────────────────────────────────
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    invalidateCache,
  } = useSearch<any>({
    endpoint: "/payments?type=RECEIVABLE",
    searchFields: (payment) => [
      String(payment.amount || ""),
      String(payment.bookingId || payment.booking_id || ""),
    ],
    initialFetch: true,
    unmask: true,
  });

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

  const mapPaymentRecord = useCallback((record: any): PaymentRow | null => {
    if (!record) return null;
    const paymentId = record?.id ?? record?.payment_id;
    const bookingId = record?.bookingId ?? record?.booking_id ?? "";
    if (!paymentId) return null;

    const paymentDate =
      record?.paymentDate ||
      record?.payment_date ||
      record?.createdAt ||
      record?.created_at;

    const receipt =
      record?.receiptNo ?? record?.receipt_no ?? record?.receiptNumber;

    return {
      payment_id: String(paymentId),
      booking_id: String(bookingId),
      payment_date: ensureIsoString(paymentDate),
      amount: Number(record?.amount ?? 0) || 0,
      payment_mode: fromBackendPaymentMode(
        record?.paymentMode ?? record?.payment_mode ?? record?.mode,
      ),
      receipt_number: receipt ? String(receipt) : "",
      notes: record?.notes ? String(record.notes) : undefined,
      currency: record?.currency ? String(record.currency) : undefined,
      payment_type: record?.paymentType ?? record?.payment_type,
      pnrNo: record?.pnrNo ?? record?.pnr_no ?? undefined,
    };
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const res = await apiRequest<any>({
        method: "GET",
        url: "/customers",
        params: { unmask: true },
      });
      const items = Array.isArray(res?.data) ? res.data : [];
      const mapped = items
        .map((item: any) => ({
          id: item?.id
            ? String(item.id)
            : item?.customerId
              ? String(item.customerId)
              : "",
          name:
            item?.name ||
            item?.fullName ||
            item?.customer_name ||
            item?.pocName ||
            "",
          accountId: item?.accountId ?? item?.account_id ?? undefined,
        }))
        .filter((item: ApiCustomer) => Boolean(item.id));
      setCustomers(mapped);
    } catch (error) {
      const err = error as ApiError;
      if (err?.message) {
        console.error("Failed to fetch customers:", err.message);
      }
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await apiRequest<any>({
        method: "GET",
        url: "/bookings",
        params: { limit: 200, unmask: true },
      });
      const items = Array.isArray(res?.data) ? res.data : [];
      const mapped = items
        .map((item: any) => ({
          id: item?.id ? String(item.id) : "",
          customerId: item?.customerId ?? item?.customer_id,
          customerName: item?.customerName,
          primaryPaxName: item?.primaryPaxName,
          packageName: item?.packageName,
          totalAmount: item?.totalAmount,
          paidAmount: item?.paidAmount,
          dueAmount: item?.dueAmount,
          currency: item?.currency,
        }))
        .filter((item: ApiBooking) => Boolean(item.id));
      setRawBookings(mapped);
    } catch (error) {
      const err = error as ApiError;
      if (err?.message) {
        console.error("Failed to fetch bookings:", err.message);
      }
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const res = await apiRequest<any>({
        method: "GET",
        url: "/payments",
        params: { type: "RECEIVABLE", limit: itemsPerPage, offset },
      });

      const items = Array.isArray(res?.data) ? res.data : [];
      const mapped = items
        .map((item: any) => mapPaymentRecord(item))
        .filter((item: PaymentRow | null): item is PaymentRow => Boolean(item));

      mapped.sort(
        (a: PaymentRow, b: PaymentRow) =>
          new Date(b.payment_date).getTime() -
          new Date(a.payment_date).getTime(),
      );

      setPayments(mapped);
      // Use count from API response if available
      setTotalItems(res?.count ?? mapped.length);
    } catch (error) {
      const err = error as ApiError;
      if (err?.message) {
        console.error("Failed to fetch payments:", err.message);
      }
    } finally {
      setLoadingPayments(false);
    }
  }, [currentPage, itemsPerPage, mapPaymentRecord]);

  useEffect(() => {
    fetchCustomers();
    fetchBookings();
    fetchPayments();
  }, [fetchCustomers, fetchBookings, fetchPayments]);

  const addPayment = useCallback(
    async (data: PaymentFormState): Promise<boolean> => {
      if (saveInFlight) return false;
      const booking = bookingsMap.get(data.booking_id);

      if (!booking) {
        errorToast("Please select a booking to record the payment.");
        return false;
      }

      if (!booking.account_id) {
        errorToast(
          "Link a customer account before recording a payment for this booking.",
        );
        return false;
      }

      if (!data.amount || Number(data.amount) <= 0) {
        errorToast("Enter a valid payment amount greater than zero.");
        return false;
      }

      setSaveInFlight(true);
      try {
        const payload = {
          bookingId: booking.booking_id,
          amount: Number(data.amount),
          currency: booking.currency || "INR",
          paymentMode: toBackendPaymentMode(data.payment_mode),
          fromAccountId: booking.account_id,
          notes: data.notes?.trim() ? data.notes.trim() : undefined,
          receiptNo: data.receipt_number?.trim()
            ? data.receipt_number.trim()
            : undefined,
          category: "booking_payment",
        };

        const res = await apiRequest<any>({
          method: "POST",
          url: "/payments/receivable",
          data: payload,
          headers: { Accept: "*/*", "Content-Type": "application/json" },
        });

        if (!res || res.status !== "success") {
          const message =
            res?.data?.message ||
            res?.message ||
            "Failed to record payment. Please try again.";
          errorToast(message);
          return false;
        }

        successToast("Payment recorded");
        invalidateCache(); // Invalidate search cache when data changes
        await Promise.all([fetchPayments(), fetchBookings()]);
        return true;
      } catch (error) {
        const err = error as ApiError;
        errorToast(err?.message || "Failed to record payment");
        return false;
      } finally {
        setSaveInFlight(false);
      }
    },
    [bookingsMap, fetchBookings, fetchPayments, saveInFlight, invalidateCache],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PaymentFormState>({
    booking_id: "",
    payment_date: todayISO(),
    amount: 0,
    payment_mode: PaymentMode.CASH,
    receipt_number: "",
    notes: "",
  });

  const receivablePayments = useMemo(
    () =>
      payments.filter(
        (payment) => payment.payment_type?.toUpperCase() === "RECEIVABLE",
      ),
    [payments],
  );

  // Map search results to PaymentRow format
  const mappedSearchResults = useMemo(() => {
    return searchResults
      .map((record: any) => mapPaymentRecord(record))
      .filter((item: PaymentRow | null): item is PaymentRow => Boolean(item));
  }, [searchResults, mapPaymentRecord]);

  // Use search results when searching, otherwise use receivable payments
  const filteredPayments = useMemo(() => {
    if (!searchTerm) return receivablePayments;

    const term = searchTerm.toLowerCase().trim();
    return mappedSearchResults.filter((payment) => {
      const booking = bookingsMap.get(payment.booking_id);
      const amount = String(payment.amount || "");
      const packageName = (booking?.package_name || "").toLowerCase();
      const customerName = (booking?.customer_name || "").toLowerCase();

      return (
        amount.includes(term) ||
        packageName.includes(term) ||
        customerName.includes(term)
      );
    });
  }, [searchTerm, mappedSearchResults, receivablePayments, bookingsMap]);

  const isLoading = loadingPayments || loadingBookings || loadingCustomers;

  const handleOpenModal = useCallback(() => {
    setFormData({
      booking_id: "",
      payment_date: todayISO(),
      amount: 0,
      payment_mode: PaymentMode.CASH,
      receipt_number: "",
      notes: "",
    });
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    const handleQuickAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ actionId?: string }>;
      if (customEvent.detail?.actionId === "payment.create") {
        handleOpenModal();
      }
    };

    window.addEventListener("travox:quick-action", handleQuickAction);
    return () =>
      window.removeEventListener("travox:quick-action", handleQuickAction);
  }, [handleOpenModal]);

  const handleSubmit = async (data: PaymentFormState) => {
    const created = await addPayment(data);
    if (created) {
      setFormData({
        booking_id: "",
        payment_date: todayISO(),
        amount: 0,
        payment_mode: PaymentMode.CASH,
        receipt_number: "",
        notes: "",
      });
      setIsModalOpen(false);
    }
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `RCPT${timestamp}${randomNum}`;
  };

  const onBookingSelect = (bookingId: string) => {
    const booking = bookingsMap.get(bookingId);
    setFormData((prev) => ({
      ...prev,
      booking_id: bookingId,
      amount:
        booking && Number(booking.balance_amount) > 0
          ? Number(booking.balance_amount)
          : prev.amount,
      receipt_number: generateReceiptNumber(),
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Management"
        description="Track receivable payments, booking balances, and receipt-backed collections."
        actions={
          <>
            <Button
              onClick={fetchPayments}
              icon={RefreshCw}
              variant="outline"
              disabled={loadingPayments}
            >
              Refresh
            </Button>
            <Button onClick={handleOpenModal} icon={Plus}>
              Record Payment
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={searchTerm ? "Search Results" : "Visible Payments"}
          value={filteredPayments.length.toString()}
          tone="primary"
        />
        <StatCard
          label="Visible Amount"
          value={`₹${filteredPayments.reduce((sum, item) => sum + item.amount, 0).toLocaleString("en-IN")}`}
        />
        <StatCard label="Receivable Records" value={receivablePayments.length.toString()} />
      </div>

      {/* Search */}
      <div className="flex items-center">
        <div className="relative flex-1">
          <SearchField
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search payments by amount, customer, or package"
          />
          <Loader isLoading={isSearching} />
        </div>
      </div>

      {/* Pagination */}
      {!loadingPayments && !searchTerm && filteredPayments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      )}

      {/* Payments Table */}
      {isLoading ? (
        <Card className="rounded-2xl">
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-gray-600">Loading payments...</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            {searchTerm ? "No Payments Match Your Search" : "No Payments Found"}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? "Try another keyword or clear search." : "Record a payment to populate this list."}
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-700">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              <span className="font-medium">
                Showing {filteredPayments.length} payment{filteredPayments.length === 1 ? "" : "s"}
              </span>
              <span>Scan receipt, booking, mode, and notes in one row before drilling down.</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-900">
                  <TableCell header>Receipt No.</TableCell>
                  <TableCell header>Booking Details</TableCell>
                  <TableCell header>Date</TableCell>
                  <TableCell header>Amount</TableCell>
                  <TableCell header>Payment Mode</TableCell>
                  <TableCell header>Notes</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((p) => {
                  const booking = bookingsMap.get(p.booking_id);
                  return (
                    <TableRow key={p.payment_id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <IndianRupee className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm">
                            {p.receipt_number || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking?.package_name && booking.package_name !== "-"
                              ? booking.package_name
                              : p.pnrNo
                              ? `PNR: ${p.pnrNo}`
                              : "Untitled Booking"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {booking?.customer_name || "---"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {formatDate(p.payment_date)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          ₹{p.amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={PAYMENT_MODE_BADGE[p.payment_mode] as any}
                          size="sm"
                        >
                          {PAYMENT_MODE_LABEL[p.payment_mode]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {p.notes || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Record Payment Modal */}
      <PaymentForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookings={bookings}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onBookingSelect={onBookingSelect}
        isSubmitting={saveInFlight}
      />
    </div>
  );
};

export default PaymentManagement;
