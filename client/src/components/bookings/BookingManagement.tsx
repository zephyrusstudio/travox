/* eslint-disable @typescript-eslint/no-explicit-any */
// components/bookings/BookingManagement.tsx
import {
  Calendar,
  DollarSign,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCachedSearch } from "../../hooks/useCachedSearch";
import { Booking, Customer } from "../../types";
import { ApiError, apiRequest, parseApiError } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent, CardHeader } from "../ui/Card";
import Modal from "../ui/Modal";
import Pagination from "../ui/Pagination";
import Spinner from "../ui/Spinner";
import Table, {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/Table";
import BookingForm from "./BookingForm";
import BookingFormV2 from "./BookingFormV2";
import {
  BookingStatus,
  CustomerLite,
  ModeOfJourneyOption,
  NewCustomerData,
} from "./booking.types";

type BookingRow = Booking & { pnr?: string };

const BookingManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedBookingLoading, setSelectedBookingLoading] = useState(false);
  const [selectedBookingError, setSelectedBookingError] = useState<
    string | null
  >(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [useV2Form, setUseV2Form] = useState(false);

  // ── Search with caching ──────────────────────────────────────────────────────
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    invalidateCache,
  } = useCachedSearch<BookingRow>({
    endpoint: "/bookings",
    searchFields: (booking) => [
      booking.package_name || "",
      booking.customer_name || "",
      booking.status || "",
      (booking as any).pnr || "",
    ],
    initialFetch: true,
    unmask: true,
  });

  const formatToDateInput = (value?: string | Date | null): string => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeBookingForForm = (record: any) => {
    if (!record) return null;

    const itineraries = Array.isArray(record.itineraries)
      ? record.itineraries
      : [];
    const firstItinerary = itineraries[0];
    const segments = Array.isArray(firstItinerary?.segments)
      ? firstItinerary.segments
      : [];
    const firstSegment = segments[0];

    const bookingDateRaw = record.bookingDate ?? record.booking_date ?? null;
    const travelStartRaw =
      record.travelStartDate ??
      record.travelStartAt ??
      record.journeyDate ??
      record.travel_start_date ??
      firstSegment?.checkIn ??
      firstSegment?.depAt ??
      null;
    const travelEndRaw =
      record.travelEndDate ??
      record.travelEndAt ??
      record.returnDate ??
      record.travel_end_date ??
      firstSegment?.checkOut ??
      firstSegment?.arrAt ??
      null;

    const totalAmount = Number(record.totalAmount ?? record.total_amount ?? 0);
    const paidAmount = Number(
      record.paidAmount ?? record.advanceAmount ?? record.advance_received ?? 0
    );
    const dueAmount =
      Number(
        record.dueAmount ?? record.balance_amount ?? totalAmount - paidAmount
      ) || 0;
    const modeOfJourneyValue =
      record.mode_of_journey ??
      record.modeOfJourney ??
      firstSegment?.modeOfJourney ??
      firstSegment?.mode_of_journey ??
      ModeOfJourneyOption.HOTEL;

    const normalized = {
      ...record,
      id: record.id ?? record.booking_id ?? "",
      booking_id: record.id ? String(record.id) : record.booking_id ?? "",
      customer_id:
        record.customerId !== undefined
          ? String(record.customerId)
          : record.customer_id ?? "",
      customer_name:
        record.customerName ??
        record.customer_name ??
        record.customer?.name ??
        "",
      package_name: record.packageName ?? record.package_name ?? "",
      pnr: record.pnr ?? record.pnrNo ?? record.pnr_no ?? "",
      pnrNo: record.pnrNo ?? record.pnr ?? record.pnr_no ?? "",
      pnr_no: record.pnr_no ?? record.pnr ?? record.pnrNo ?? "",
      booking_date: record.booking_date ?? formatToDateInput(bookingDateRaw),
      travel_start_date:
        record.travel_start_date ?? formatToDateInput(travelStartRaw),
      travel_end_date:
        record.travel_end_date ?? formatToDateInput(travelEndRaw),
      pax_count:
        record.pax_count ??
        record.paxCount ??
        (Array.isArray(record.pax) ? record.pax.length : 0),
      total_amount: totalAmount,
      advance_received: paidAmount,
      balance_amount: dueAmount,
      currency: record.currency ?? record.currencyCode ?? "INR",
      mode_of_journey: modeOfJourneyValue,
      status:
        typeof record.status === "string"
          ? record.status
          : record.status?.toString?.() ?? "Draft",
      pax: Array.isArray(record.pax)
        ? record.pax
        : Array.isArray(record.paxList)
        ? record.paxList
        : [],
      itineraries: itineraries,
      vendorInfo: record.vendorInfo ?? null,
      extractionMetadata:
        record.extractionMetadata ?? record.extraction_metadata ?? null,
      customerId: record.customerId ?? record.customer_id ?? "",
      totalAmount,
      advanceAmount: record.advanceAmount ?? paidAmount,
      paidAmount,
      dueAmount,
      bookingDate: bookingDateRaw,
      travelStartDate: travelStartRaw,
      travelEndDate: travelEndRaw,
    };

    return normalized;
  };

  const loadBookingDetails = useCallback(
    async (bookingId: string) => {
      setSelectedBookingLoading(true);
      setSelectedBookingError(null);
      try {
        const res = await apiRequest<any>({
          method: "GET",
          url: `/bookings/${bookingId}`,
          params: { unmask: true },
        });

        if (!res) {
          throw new ApiError("Failed to load booking details");
        }

        if (typeof res.status === "number" && res.status >= 400) {
          const message =
            res.data?.data?.message ||
            res.data?.message ||
            "Failed to load booking details";
          throw new ApiError(message, { status: res.status, data: res.data });
        }

        if (typeof res.status === "string" && res.status !== "success") {
          const message =
            res.data?.message ||
            res.message ||
            "Failed to load booking details";
          throw new ApiError(message);
        }

        const rawBooking = res.data ?? res;
        if (
          !rawBooking ||
          (Array.isArray(rawBooking) && rawBooking.length === 0)
        ) {
          throw new ApiError("Booking not found");
        }

        const normalized = normalizeBookingForForm(rawBooking);
        setSelectedBooking(normalized);
      } catch (error) {
        const apiError =
          error instanceof ApiError ? error : parseApiError(error);
        const message =
          apiError.message || "Unable to load booking for editing.";
        setSelectedBookingError(message);
      } finally {
        setSelectedBookingLoading(false);
      }
    },
    [normalizeBookingForForm, parseApiError]
  );
  const customersMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((customer) => {
      if (customer?.customer_id) {
        map.set(String(customer.customer_id), customer.full_name ?? "");
      }
    });
    return map;
  }, [customers]);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const res = await apiRequest<any>({
        method: "GET",
        url: "/bookings",
        params: { limit: itemsPerPage, offset, unmask: true },
      });
      const items: any[] = Array.isArray(res?.data) ? res.data : [];
      const normalizeStatus = (status: string): BookingStatus => {
        const normalized = (status || "").toLowerCase();
        if (normalized === "confirmed" || status === BookingStatus.CONFIRMED)
          return BookingStatus.CONFIRMED;
        if (normalized === "cancelled" || status === BookingStatus.CANCELLED)
          return BookingStatus.CANCELLED;
        if (normalized === "ticketed" || status === BookingStatus.TICKETED)
          return BookingStatus.TICKETED;
        if (normalized === "in progress" || status === BookingStatus.IN_PROGRESS)
          return BookingStatus.IN_PROGRESS;
        if (normalized === "completed" || status === BookingStatus.COMPLETED)
          return BookingStatus.COMPLETED;
        if (normalized === "refunded" || status === BookingStatus.REFUNDED)
          return BookingStatus.REFUNDED;
        return BookingStatus.DRAFT;
      };

      const mapped: BookingRow[] = items.map((record) => {
        const bookingDateRaw: string | null =
          record?.bookingDate ?? record?.booking_date ?? null;
        const travelStartRaw: string | null =
          record?.travelStartDate ??
          record?.journeyDate ??
          record?.travel_start_date ??
          bookingDateRaw ??
          null;
        const travelEndRaw: string | null =
          record?.travelEndDate ??
          record?.returnDate ??
          record?.travel_end_date ??
          bookingDateRaw ??
          null;
        const bookingDate = formatToDateInput(bookingDateRaw);
        const travelStart = formatToDateInput(travelStartRaw);
        const travelEnd = formatToDateInput(travelEndRaw);
        const paxCount =
          record?.paxCount ??
          (Array.isArray(record?.pax) ? record.pax.length : 0);
        const totalAmount =
          Number(record?.totalAmount ?? record?.total_amount) || 0;
        const paidAmount =
          Number(
            record?.paidAmount ??
              record?.advanceAmount ??
              record?.advance_received
          ) || 0;
        const balanceAmount =
          Number(record?.dueAmount ?? totalAmount - paidAmount) || 0;

        const booking: BookingRow = {
          booking_id: record?.id ? String(record.id) : "",
          customer_id: record?.customerId ? String(record.customerId) : "",
          customer_name: record?.customerName || record?.customer?.name || "",
          package_name: record?.packageName || "Untitled Package",
          booking_date: bookingDate,
          travel_start_date: travelStart,
          travel_end_date: travelEnd,
          pax_count: paxCount,
          total_amount: totalAmount,
          advance_received: paidAmount,
          balance_amount: Math.max(0, balanceAmount),
          status: normalizeStatus(record?.status),
        };

        return { ...booking, pnr: record?.pnrNo || undefined };
      });

      setBookings(mapped);
      // Use count from API response if available
      setTotalItems(res?.count ?? mapped.length);
    } catch (error) {
      const apiError = error as ApiError;
      setBookingsError(apiError.message);
    } finally {
      setBookingsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const fetchCustomers = useCallback(async () => {
    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const res = await apiRequest<{ data: Customer[] }>({
        method: "GET",
        url: "/customers",
      });
      const mapped = (res?.data ?? []).map((c) => ({
        customer_id: c.id,
        full_name: c.name,
        email: c.email,
        phone: c.phone,
        passportNo: c.passportNo,
        gstin: c.gstin,
      }));
      setCustomers(mapped);
    } catch (err) {
      const apiErr = err as ApiError;
      setCustomersError(apiErr.message ?? "Failed to load customers");
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = useCallback(
    async (customer: NewCustomerData) => {
      setCustomersError(null);
      try {
        const payload = {
          name: customer.full_name.trim(),
          email: customer.email || undefined,
          phone: customer.phone || undefined,
          address: customer.address || undefined,
          passportNo: customer.passportNo || undefined,
          gstin: customer.gstin || undefined,
        };

        await apiRequest<any>({
          method: "POST",
          url: "/customers",
          data: payload,
          headers: { Accept: "*/*", "Content-Type": "application/json" },
        });

        successToast("Customer added");
        await fetchCustomers();
      } catch (err) {
        const apiErr = err as ApiError;
        const message = apiErr.message ?? "Failed to add customer";
        setCustomersError(message);
        errorToast(message);
      }
    },
    [fetchCustomers]
  );

  const hydratedBookings = useMemo<BookingRow[]>(() => {
    if (!bookings.length) return bookings;
    return bookings.map((booking) => {
      const mappedName =
        customersMap.get(booking.customer_id) ||
        booking.customer_name ||
        (booking as any).primaryPaxName ||
        "";
      if (mappedName && mappedName !== booking.customer_name) {
        return { ...booking, customer_name: mappedName };
      }
      return booking;
    });
  }, [bookings, customersMap]);

  // Use search results when searching, otherwise use paginated bookings
  const filteredBookings = useMemo(() => {
    let bookingsToSort: BookingRow[];
    
    if (searchTerm) {
      // Hydrate search results with customer names
      bookingsToSort = searchResults.map((booking) => {
        const mappedName =
          customersMap.get(booking.customer_id) ||
          booking.customer_name ||
          (booking as any).primaryPaxName ||
          "";
        if (mappedName && mappedName !== booking.customer_name) {
          return { ...booking, customer_name: mappedName };
        }
        return booking;
      });
    } else {
      bookingsToSort = hydratedBookings;
    }
    
    // Sort by createdAt (newest first)
    return [...bookingsToSort].sort((a, b) => {
      const dateA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const dateB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [searchTerm, searchResults, hydratedBookings, customersMap]);

  console.log(filteredBookings);

  const resetAndClose = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
    setSelectedBookingError(null);
    setSelectedBookingLoading(false);
    setFormMode("create");
  };

  const handleOpenModal = (
    booking?: BookingRow,
    mode: "create" | "edit" | "view" = "create",
    useV2: boolean = false
  ) => {
    setFormMode(mode);
    setUseV2Form(useV2);

    if (!booking) {
      setSelectedBooking(null);
      setSelectedBookingError(null);
      setSelectedBookingLoading(false);
      setIsModalOpen(true);
      return;
    }

    setSelectedBooking(null);
    setSelectedBookingError(null);
    setIsModalOpen(true);
    loadBookingDetails(booking.booking_id);
  };

  const handleDelete = (bookingId: string) => {
    setDeleteTargetId(bookingId);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await apiRequest({
        method: "DELETE",
        url: `/bookings/${deleteTargetId}`,
      });
      successToast("Booking deleted");
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
      invalidateCache(); // Invalidate search cache when data changes
      await fetchBookings();
    } catch (error) {
      const apiError = error as ApiError;
      const message = apiError.message ?? "Failed to delete booking";
      setDeleteError(message);
      errorToast(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (d?: string | Date) => {
    const formatted = formatToDateInput(d ?? null);
    return formatted || "-";
  };

  const getStatusVariant = (status: string) => {
    switch (status as BookingStatus) {
      case BookingStatus.CONFIRMED:
        return "success";
      case BookingStatus.TICKETED:
        return "success";
      case BookingStatus.COMPLETED:
        return "success";
      case BookingStatus.DRAFT:
        return "warning";
      case BookingStatus.IN_PROGRESS:
        return "warning";
      case BookingStatus.CANCELLED:
        return "danger";
      case BookingStatus.REFUNDED:
        return "danger";
      default:
        return "default";
    }
  };

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(
      (b) => b.status === BookingStatus.CONFIRMED
    ).length;
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (Number(b.total_amount) || 0),
      0
    );
    const pendingAmount = bookings.reduce(
      (sum, b) => sum + (Number(b.balance_amount) || 0),
      0
    );
    return { totalBookings, confirmedBookings, totalRevenue, pendingAmount };
  }, [bookings]);

  const submitBooking = useCallback(
    async (payload: any) => {
      const rawBookingId =
        selectedBooking?.booking_id ??
        selectedBooking?.bookingId ??
        selectedBooking?.id ??
        "";
      const bookingId = rawBookingId ? String(rawBookingId) : "";
      const isUpdate = formMode === "edit" && bookingId.length > 0;

      if (formMode === "edit" && !bookingId) {
        errorToast("Unable to update booking: missing booking ID.");
        return;
      }

      try {
        const response = await apiRequest<any>({
          method: isUpdate ? "PUT" : "POST",
          url: isUpdate ? `/bookings/${bookingId}` : "/bookings",
          data: isUpdate ? { ...payload, bookingId } : payload,
          headers: { Accept: "*/*", "Content-Type": "application/json" },
        });

        if (
          response &&
          typeof response === "object" &&
          "status" in response &&
          typeof (response as any).status === "number"
        ) {
          const axiosResponse = response as {
            status: number;
            data?: any;
          };

          if (axiosResponse.status >= 400) {
            const message =
              axiosResponse.data?.data?.message ||
              axiosResponse.data?.message ||
              "Unable to save booking.";
            throw new ApiError(message, {
              status: axiosResponse.status,
              data: axiosResponse.data,
            });
          }
        }

        if (
          response &&
          typeof response === "object" &&
          "status" in response &&
          typeof (response as any).status === "string"
        ) {
          const statusString = String((response as any).status).toLowerCase();
          if (statusString !== "success") {
            const message =
              (response as any).message ||
              (response as any).data?.message ||
              "Unable to save booking.";
            throw new ApiError(message);
          }
        }

        successToast(isUpdate ? "Booking updated" : "Booking added");
        invalidateCache(); // Invalidate search cache when data changes
        await fetchBookings();
        return response;
      } catch (error) {
        const apiError = error as ApiError;
        errorToast(apiError.message);
        throw apiError;
      }
    },
    [fetchBookings, formMode, selectedBooking, invalidateCache]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Booking Management
          </h1>
          <p className="text-gray-600">
            Manage travel bookings and customer reservations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={fetchBookings}
            icon={RefreshCw}
            variant="outline"
            disabled={bookingsLoading}
          >
            Refresh
          </Button>
          {/*<Button
            onClick={() => handleOpenModal(undefined, "create", false)}
            icon={Plus}
            variant="outline"
           
          >
            Create Booking
          </Button>
          */}
          <Button
            onClick={() => handleOpenModal(undefined, "create", true)}
            icon={Plus}
          >
            Create Booking
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalBookings}
            </p>
            <p className="text-sm text-gray-600">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {stats.confirmedBookings}
            </p>
            <p className="text-sm text-gray-600">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              ₹{stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">
              ₹{stats.pendingAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {bookingsError && (
        <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {bookingsError}
        </div>
      )}

      {/* Pagination */}
      {!bookingsLoading && (
        filteredBookings.length > 0 && (
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

      {/* Table */}
      {/* Bookings Table */}
      {bookingsLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-gray-600">Loading bookings...</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Bookings Found
          </h3>
          <p className="text-gray-500">
            No bookings found.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">All Bookings</h3>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Package</TableCell>
                  <TableCell header>Customer</TableCell>
                  <TableCell header>Travel Dates</TableCell>
                  <TableCell header>Pax</TableCell>
                  <TableCell header>Amount</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((b) => (
                  <TableRow key={b.booking_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {b.package_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Booked: {formatDate(b.booking_date)}
                        </p>
                        {(b as any).pnr && (
                          <p className="text-xs text-blue-600 font-mono">
                            PNR: {(b as any).pnr}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900">
                        {b.customer_name || "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-900">
                          {formatDate(b.travel_start_date)}
                        </p>
                        <p className="text-sm text-gray-500">
                          to {formatDate(b.travel_end_date)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" size="sm">
                        {b.pax_count} {b.pax_count === 1 ? "person" : "people"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          ₹{b.total_amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Paid: ₹{b.advance_received.toLocaleString()}
                        </p>
                        {b.balance_amount > 0 && (
                          <p className="text-sm text-red-600">
                            Due: ₹{b.balance_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(b.status) as any}
                        size="sm"
                      >
                        {b.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenModal(b, "view", true)}
                          title="View booking"
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit}
                          onClick={() => handleOpenModal(b, "edit", true)}
                          title="Edit booking"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDelete(b.booking_id)}
                          title="Delete booking"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}
      {/* Delete Confirm Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleteLoading) {
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
            setDeleteError(null);
          }
        }}
        title="Delete booking?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete this booking?
          </p>
          {deleteError && (
            <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteTargetId(null);
                setDeleteError(null);
              }}
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm disabled:opacity-60"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Yes, delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit / View Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetAndClose}
        title={
          formMode === "create"
            ? useV2Form
              ? "Create Booking v2"
              : "Create Booking"
            : formMode === "edit"
            ? useV2Form ? "Edit Booking v2" : "Edit Booking"
            : useV2Form ? "View Booking v2"
            : "View Booking"
        }
        size="xl"
      >
        {customersLoading && (
          <div className="mb-4 flex items-center space-x-2">
            <Spinner size="sm" />
            <span className="text-sm text-gray-600">Loading customers...</span>
          </div>
        )}
        {customersError && (
          <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {customersError}
          </div>
        )}
        {selectedBookingLoading && (
          <div className="mb-4 flex items-center space-x-2">
            <Spinner size="sm" />
            <span className="text-sm text-gray-600">Loading booking details...</span>
          </div>
        )}
        {selectedBookingError && (
          <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {selectedBookingError}
          </div>
        )}
        {(!selectedBookingLoading || selectedBooking) && (
          useV2Form ? (
            <BookingFormV2
              key={
                selectedBooking
                  ? selectedBooking.booking_id || selectedBooking.id
                  : "new-v2"
              }
              selectedBooking={selectedBooking}
              customers={customers}
              onAddCustomer={addCustomer}
              onSubmitBooking={submitBooking}
              onCancel={resetAndClose}
              mode={formMode}
            />
          ) : (
            <BookingForm
              key={
                selectedBooking
                  ? selectedBooking.booking_id || selectedBooking.id
                  : "new"
              }
              selectedBooking={selectedBooking}
              customers={customers}
              onAddCustomer={addCustomer}
              onSubmitBooking={submitBooking}
              onCancel={resetAndClose}
              mode={formMode}
            />
          )
        )}
      </Modal>
    </div>
  );
};

export default BookingManagement;
