/* eslint-disable @typescript-eslint/no-explicit-any */
import { CreditCard, Plus, Receipt, Search } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent, CardHeader } from "../ui/Card";
import Pagination from "../ui/Pagination";
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
          package_name: record?.packageName || "Untitled Package",
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

  const mapPaymentRecord = (record: any): PaymentRow | null => {
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
        record?.paymentMode ?? record?.payment_mode ?? record?.mode
      ),
      receipt_number: receipt ? String(receipt) : "",
      notes: record?.notes ? String(record.notes) : undefined,
      currency: record?.currency ? String(record.currency) : undefined,
      payment_type: record?.paymentType ?? record?.payment_type,
    };
  };

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
        params: { limit: itemsPerPage, offset },
      });

      const items = Array.isArray(res?.data) ? res.data : [];
      const mapped = items
        .map((item: any) => mapPaymentRecord(item))
        .filter((item): item is PaymentRow => Boolean(item));

      mapped.sort(
        (a, b) =>
          new Date(b.payment_date).getTime() -
          new Date(a.payment_date).getTime()
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
  }, [currentPage, itemsPerPage]);

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
          "Link a customer account before recording a payment for this booking."
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
    [bookingsMap, fetchBookings, fetchPayments, saveInFlight]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
        (payment) => payment.payment_type?.toUpperCase() === "RECEIVABLE"
      ),
    [payments]
  );

  const filteredPayments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return receivablePayments;

    return receivablePayments.filter((payment) => {
      const booking = bookingsMap.get(payment.booking_id);
      const receiptMatch =
        payment.receipt_number?.toLowerCase().includes(q) ?? false;
      const packageMatch =
        booking?.package_name?.toLowerCase().includes(q) ?? false;
      const customerMatch =
        booking?.customer_name?.toLowerCase().includes(q) ?? false;

      return receiptMatch || packageMatch || customerMatch;
    });
  }, [receivablePayments, bookingsMap, searchTerm]);

  const isLoading = loadingPayments || loadingBookings || loadingCustomers;

  const handleOpenModal = () => {
    setFormData({
      booking_id: "",
      payment_date: todayISO(),
      amount: 0,
      payment_mode: PaymentMode.CASH,
      receipt_number: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

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

  const stats = useMemo(() => {
    const totalPayments = receivablePayments.length;
    const totalAmount = receivablePayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    const now = new Date();
    const thisMonthAmount = receivablePayments
      .filter((p) => {
        const d = new Date(p.payment_date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalPayments, totalAmount, thisMonthAmount };
  }, [receivablePayments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Management
          </h1>
          <p className="text-gray-600">Track and manage customer payments</p>
        </div>
        <Button onClick={handleOpenModal} icon={Plus}>
          Record Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalPayments}
            </p>
            <p className="text-sm text-gray-600">Total Payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              ₹{stats.totalAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              ₹{stats.thisMonthAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">
            Payment History
          </h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Receipt No.</TableCell>
                <TableCell header>Booking Details</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Payment Mode</TableCell>
                <TableCell header>Notes</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="py-6 text-center text-sm text-gray-500">
                      Loading payments...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="py-6 text-center text-sm text-gray-500">
                      No payments found.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((p) => {
                  const booking = bookingsMap.get(p.booking_id);
                  return (
                    <TableRow key={p.payment_id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Receipt className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm">
                            {p.receipt_number || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking?.package_name || "---"}
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
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loadingPayments && filteredPayments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[5, 10, 20, 50, 100]}
        />
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
