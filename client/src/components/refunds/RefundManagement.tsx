/* eslint-disable @typescript-eslint/no-explicit-any */
import { CreditCard, Plus, RefreshCw } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, StatCard } from "../../design-system/patterns";
import { SearchField } from "../../design-system/primitives";
import { useSearch } from "../../hooks/useSearch";
import { ApiError, apiRequest } from "../../utils/apiConnector";
import { successToast } from "../../utils/toasts";
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
import CreateRefundDialog, { RefundFormData } from "./CreateRefundDialog";
import {
  formatDate,
  fromBackendPaymentMode,
  PAYMENT_MODE_BADGE,
  PAYMENT_MODE_LABEL,
  PaymentMode,
} from "../payments/payment";
import { Booking, Payment } from "../../types";

type RefundRow = {
  refund_id: string;
  payment_id: string;
  booking_id: string;
  refund_date: string;
  refund_amount: number;
  refund_reason: string;
  refund_mode: PaymentMode;
  currency?: string;
};

type ApiBooking = Booking & {
  id?: string;
  packageName?: string;
  customerName?: string;
  customerId?: string;
  primaryPaxName?: string;
};

type ApiCustomer = {
  id: string;
  name: string;
  accountId?: string;
};

const RefundManagement: React.FC = () => {
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [receivablePayments, setReceivablePayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to map API response to RefundRow
  const mapRefundRecord = useCallback((record: any): RefundRow | null => {
    if (!record) return null;
    return {
      refund_id: record.id,
      payment_id: record.refundOfPaymentId || record.refund_of_payment_id || '',
      booking_id: record.bookingId || record.booking_id || '',
      refund_date: record.createdAt || record.created_at || new Date().toISOString(),
      refund_amount: Number(record.amount || 0),
      refund_reason: record.notes || '',
      refund_mode: fromBackendPaymentMode(record.paymentMode || record.payment_mode),
      currency: record.currency || 'INR',
    };
  }, []);

  // Fetch Refunds (Paginated)
  const fetchRefunds = useCallback(async () => {
    setLoadingRefunds(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const res = await apiRequest<any>({
        method: "GET",
        url: "/payments",
        params: { type: "REFUND_OUTBOUND", limit: itemsPerPage, offset },
      });

      const items = Array.isArray(res?.data) ? res.data : [];
      const mapped = items
        .map(mapRefundRecord)
        .filter((item: any): item is RefundRow => Boolean(item));

      mapped.sort(
        (a: any, b:any) =>
          new Date(b.refund_date).getTime() -
          new Date(a.refund_date).getTime()
      );

      setRefunds(mapped);
      setTotalItems(res?.count ?? mapped.length);
    } catch (error) {
      const err = error as ApiError;
      console.error("Failed to fetch refunds:", err.message);
    } finally {
      setLoadingRefunds(false);
    }
  }, [currentPage, itemsPerPage, mapRefundRecord]);

  // Fetch Bookings, Customers, and Receivable Payments
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [bookingsRes, customersRes, paymentsRes] = await Promise.all([
        apiRequest<any>({ method: "GET", url: "/bookings", params: { limit: 200, unmask: true } }),
        apiRequest<any>({ method: "GET", url: "/customers", params: { unmask: true } }),
        apiRequest<any>({ method: "GET", url: "/payments", params: { type: "RECEIVABLE", limit: 200 } }),
      ]);
      
      setBookings(bookingsRes?.data || []);
      
      // Map customers
      const customerItems = Array.isArray(customersRes?.data) ? customersRes.data : [];
      const mappedCustomers = customerItems
        .map((item: any) => ({
          id: item?.id ? String(item.id) : item?.customerId ? String(item.customerId) : "",
          name: item?.name || item?.fullName || item?.customer_name || item?.pocName || "",
          accountId: item?.accountId ?? item?.account_id ?? undefined,
        }))
        .filter((item: ApiCustomer) => Boolean(item.id));
      setCustomers(mappedCustomers);
      
      setReceivablePayments(paymentsRes?.data || []);
    } catch (error) {
      console.error('Error fetching auxiliary data:', error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
    fetchData();
  }, [fetchRefunds, fetchData]);

  const customersMap = useMemo(() => {
    const map = new Map<string, ApiCustomer>();
    customers.forEach((customer) => {
      if (customer?.id) {
        map.set(String(customer.id), customer);
      }
    });
    return map;
  }, [customers]);

  const bookingsMap = useMemo(() => {
    const map = new Map<string, ApiBooking & { resolvedCustomerName?: string }>();
    bookings.forEach(b => {
      const bookingId = b.booking_id || b.id || '';
      const customerId = b.customer_id || b.customerId || '';
      const customer = customerId ? customersMap.get(String(customerId)) : undefined;
      const resolvedCustomerName = customer?.name || b.customer_name || b.customerName || b.primaryPaxName || '';
      map.set(bookingId, { ...b, resolvedCustomerName });
    });
    return map;
  }, [bookings, customersMap]);

  // Search configuration - searchFields only accesses the raw payment data
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    invalidateCache,
  } = useSearch<any>({
    endpoint: "/payments?type=REFUND_OUTBOUND",
    searchFields: (refund) => [
      String(refund.amount || ''),
      String(refund.bookingId || refund.booking_id || ''),
    ],
    initialFetch: true,
    unmask: true,
  });

  // Search handling - enrich results with booking/customer data
  const mappedSearchResults = useMemo(() => {
    return searchResults
      .map(mapRefundRecord)
      .filter((item): item is RefundRow => Boolean(item));
  }, [searchResults, mapRefundRecord]);

  // Filter to only show results that match search term when searching
  const filteredRefunds = useMemo(() => {
    if (!searchTerm) return refunds;
    
    const term = searchTerm.toLowerCase().trim();
    return mappedSearchResults.filter(refund => {
      const booking = bookingsMap.get(refund.booking_id);
      const amount = String(refund.refund_amount || '');
      const packageName = (booking?.packageName || booking?.package_name || '').toLowerCase();
      const customerName = (booking?.resolvedCustomerName || '').toLowerCase();
      
      return amount.includes(term) || packageName.includes(term) || customerName.includes(term);
    });
  }, [searchTerm, mappedSearchResults, refunds, bookingsMap]);

  const handleSubmit = async (data: RefundFormData) => {
    try {
      await apiRequest({
        method: 'POST',
        url: '/payments/outbound-refund',
        data: {
          refundOfPaymentId: data.payment_id,
          notes: data.refund_reason,
        }
      });
      successToast("Refund processed successfully");
      invalidateCache();
      fetchRefunds();
      fetchData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating refund:', error);
    }
  };

  useEffect(() => {
    const handleQuickAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ actionId?: string }>;
      if (customEvent.detail?.actionId === "refund.create") {
        setIsModalOpen(true);
      }
    };

    window.addEventListener("travox:quick-action", handleQuickAction);
    return () =>
      window.removeEventListener("travox:quick-action", handleQuickAction);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refund Management"
        description="Process outbound refunds and track booking-linked refund history."
        actions={
          <>
            <Button
              onClick={() => {
                fetchRefunds();
                fetchData();
              }}
              icon={RefreshCw}
              variant="outline"
              disabled={loadingRefunds || loadingData}
            >
              Refresh
            </Button>
            <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
              Process Refund
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label={searchTerm ? "Search Results" : "Visible Refunds"}
          value={filteredRefunds.length.toString()}
          tone="primary"
        />
        <StatCard
          label="Visible Refund Value"
          value={`₹${filteredRefunds.reduce((sum, item) => sum + item.refund_amount, 0).toLocaleString("en-IN")}`}
        />
        <StatCard label="Eligible Receivable Payments" value={receivablePayments.length.toString()} />
      </div>

      {/* Search */}
      <div className="flex items-center">
        <div className="relative flex-1">
          <SearchField
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search refunds by booking, customer, or amount"
          />
          <Loader isLoading={isSearching} />
        </div>
      </div>

      {/* Pagination */}
      {!loadingRefunds && (
        !searchTerm && filteredRefunds.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPageOptions={[5, 10, 20, 50, 100]}
          />
        )
      )}

      {/* Refunds Table */}
      {loadingRefunds ? (
        <Card className="rounded-2xl">
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-gray-600">Loading refunds...</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredRefunds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            {searchTerm ? "No Refunds Match Your Search" : "No Refunds Found"}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? "Try another keyword or clear search." : "Process a refund to populate this list."}
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-700">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              <span className="font-medium">
                Showing {filteredRefunds.length} refund{filteredRefunds.length === 1 ? "" : "s"}
              </span>
              <span>Each entry maps to a booking payment and keeps audit-ready refund context.</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-900">
                  <TableCell header>Booking Details</TableCell>
                  <TableCell header>Refund Date</TableCell>
                  <TableCell header>Amount</TableCell>
                  <TableCell header>Mode</TableCell>
                  <TableCell header>Reason</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.map((refund) => {
                  const booking = bookingsMap.get(refund.booking_id);
                  return (
                    <TableRow key={refund.refund_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{booking?.package_name || booking?.packageName || "---"}</p>
                          <p className="text-sm text-gray-500">{booking?.resolvedCustomerName || booking?.customer_name || booking?.customerName || "---"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {formatDate(refund.refund_date)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-red-600">
                          ₹{refund.refund_amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={PAYMENT_MODE_BADGE[refund.refund_mode] as any} size="sm">
                          {PAYMENT_MODE_LABEL[refund.refund_mode]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {refund.refund_reason}
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

      <CreateRefundDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        payments={receivablePayments}
        bookings={bookings}
        customers={customers}
        existingRefunds={refunds}
      />
    </div>
  );
};

export default RefundManagement;
