/* eslint-disable @typescript-eslint/no-explicit-any */
// components/bookings/BookingManagement.tsx
import {
  Calendar,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, StatCard } from "../../design-system/patterns";
import { SearchField } from "../../design-system/primitives";
import { Booking, Customer } from "../../types";
import { ApiError, apiRequest, parseApiError } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import ConfirmDestructionModal from "../ui/common/ConfirmDestructionModal";
import Modal from "../ui/Modal";
import Pagination from "../ui/Pagination";
import Spinner from "../ui/Spinner";
import Table, {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/Table";
import BookingFormV2 from "./BookingFormV2";
import BookingFilter, { BookingFilterParams } from "./BookingFilter";
import {
  BookingStatus,
  CustomerLite,
  ModeOfJourney,
  NewCustomerData,
  VendorLite,
} from "./booking.v2.types";
import Loader from "../ui/Loader";

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
  const [vendors, setVendors] = useState<VendorLite[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | "view">(
    "create"
  );

  // ── Stats state ───────────────────────────────────────────────────────
  const [stats, setStats] = useState<{
    totalBookings: number;
    confirmedBookings: number;
    revenueForecast: number;
    totalRevenue: number;
    pendingAmount: number;
  }>({
    totalBookings: 0,
    confirmedBookings: 0,
    revenueForecast: 0,
    totalRevenue: 0,
    pendingAmount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Search state ──────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<BookingRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  // ── Filter state ──────────────────────────────────────────────────────
  const [filterResults, setFilterResults] = useState<BookingRow[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeFilters, setActiveFilters] = useState<BookingFilterParams | null>(null);
  const filterAbortRef = useRef<AbortController | null>(null);

  const formatToDateInput = (value?: string | Date | null): string => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateTime = (value?: string | Date | null): string => {
    if (!value) return "-";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // ── Search function using new /bookings/search endpoint ──────────────────
  const performSearch = useCallback(async (term: string) => {
    // Cancel any ongoing search
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }

    const trimmedTerm = term.trim();
    if (!trimmedTerm) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const abortController = new AbortController();
    searchAbortRef.current = abortController;

    try {
      const res = await apiRequest<any>({
        method: "GET",
        url: "/bookings/search",
        params: { q: trimmedTerm, unmask: true },
      });

      if (abortController.signal.aborted) return;

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
        // Use dueAmount from backend, fallback to balance_amount for old data
        const balanceAmount =
          Number(record?.dueAmount ?? record?.balance_amount ?? (totalAmount - paidAmount)) || 0;

        const booking: BookingRow = {
          booking_id: record?.id ? String(record.id) : "",
          customer_id: record?.customerId ? String(record.customerId) : "",
          customer_name: record?.customerName || record?.customer?.name || "",
          package_name: record?.packageName || "-",
          booking_date: bookingDate,
          travel_start_date: travelStart,
          travel_end_date: travelEnd,
          pax_count: paxCount,
          total_amount: totalAmount,
          advance_received: paidAmount,
          balance_amount: Math.max(0, balanceAmount),
          status: normalizeStatus(record?.status),
        };

        return {
          ...booking,
          pnr: record?.pnrNo || undefined,
          travelStartAt: record?.travelStartAt || null,
          travelEndAt: record?.travelEndAt || null,
          createdAt: record?.createdAt || null,
        };
      });

      setSearchResults(mapped);
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error("Search failed:", error);
        setSearchResults([]);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsSearching(false);
        searchAbortRef.current = null;
      }
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        performSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
      if (filterAbortRef.current) {
        filterAbortRef.current.abort();
      }
    };
  }, []);

  // ── Filter function using /bookings/filter endpoint ──────────────────
  const performFilter = useCallback(async (params: BookingFilterParams) => {
    // Cancel any ongoing filter request
    if (filterAbortRef.current) {
      filterAbortRef.current.abort();
    }

    // Check if we have any actual filters
    const hasFilters = Object.values(params).some(
      (v) => v !== undefined && v !== ""
    );

    if (!hasFilters) {
      setFilterResults([]);
      setActiveFilters(null);
      return;
    }

    setIsFiltering(true);
    setActiveFilters(params);
    const abortController = new AbortController();
    filterAbortRef.current = abortController;

    try {
      // Build query params in the format the API expects (comma-separated ranges)
      const queryParams: Record<string, string> = { unmask: "true" };

      if (params.status) {
        queryParams.status = params.status;
      }

      if (params.paymentStatus) {
        queryParams.paymentStatus = params.paymentStatus;
      }

      // Build date range params
      if (params.bookingDateFrom || params.bookingDateTo) {
        queryParams.bookingDate = `${params.bookingDateFrom || ""},${params.bookingDateTo || ""}`;
      }

      if (params.travelStartFrom || params.travelStartTo) {
        // Convert datetime-local format to API expected format
        const from = params.travelStartFrom ? params.travelStartFrom.replace("T", " ") : "";
        const to = params.travelStartTo ? params.travelStartTo.replace("T", " ") : "";
        queryParams.travelStartAt = `${from},${to}`;
      }

      if (params.travelEndFrom || params.travelEndTo) {
        const from = params.travelEndFrom ? params.travelEndFrom.replace("T", " ") : "";
        const to = params.travelEndTo ? params.travelEndTo.replace("T", " ") : "";
        queryParams.travelEndAt = `${from},${to}`;
      }

      if (params.dueAmountMin !== undefined || params.dueAmountMax !== undefined) {
        queryParams.dueAmount = `${params.dueAmountMin ?? ""},${params.dueAmountMax ?? ""}`;
      }

      const res = await apiRequest<any>({
        method: "GET",
        url: "/bookings/filter",
        params: queryParams,
      });

      if (abortController.signal.aborted) return;

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
        // Use dueAmount from backend, fallback to balance_amount for old data
        const balanceAmount =
          Number(record?.dueAmount ?? record?.balance_amount ?? (totalAmount - paidAmount)) || 0;

        const booking: BookingRow = {
          booking_id: record?.id ? String(record.id) : "",
          customer_id: record?.customerId ? String(record.customerId) : "",
          customer_name: record?.customerName || record?.customer?.name || "",
          package_name: record?.packageName || "-",
          booking_date: bookingDate,
          travel_start_date: travelStart,
          travel_end_date: travelEnd,
          pax_count: paxCount,
          total_amount: totalAmount,
          advance_received: paidAmount,
          balance_amount: Math.max(0, balanceAmount),
          status: normalizeStatus(record?.status),
        };

        return {
          ...booking,
          pnr: record?.pnrNo || undefined,
          travelStartAt: record?.travelStartAt || null,
          travelEndAt: record?.travelEndAt || null,
          createdAt: record?.createdAt || null,
        };
      });

      setFilterResults(mapped);
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error("Filter failed:", error);
        setFilterResults([]);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsFiltering(false);
        filterAbortRef.current = null;
      }
    }
  }, []);

  const clearFilters = useCallback(() => {
    setFilterResults([]);
    setActiveFilters(null);
  }, []);

  const normalizeBookingForForm = useCallback((record: any) => {
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
    // Use dueAmount from backend as primary source
    const dueAmount =
      Number(record.dueAmount ?? record.balance_amount ?? (totalAmount - paidAmount)) || 0;
    const modeOfJourneyValue =
      record.mode_of_journey ??
      record.modeOfJourney ??
      firstSegment?.modeOfJourney ??
      firstSegment?.mode_of_journey ??
      ModeOfJourney.HOTEL;

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
      paidAmount,
      dueAmount,
      bookingDate: bookingDateRaw,
      travelStartDate: travelStartRaw,
      travelEndDate: travelEndRaw,
    };

    return normalized;
  }, []);

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
    [normalizeBookingForForm]
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
        // Use dueAmount from backend, fallback to balance_amount for old data
        const balanceAmount =
          Number(record?.dueAmount ?? record?.balance_amount ?? (totalAmount - paidAmount)) || 0;

        const booking: BookingRow = {
          booking_id: record?.id ? String(record.id) : "",
          customer_id: record?.customerId ? String(record.customerId) : "",
          customer_name: record?.customerName || record?.customer?.name || "",
          package_name: record?.packageName || "-",
          booking_date: bookingDate,
          travel_start_date: travelStart,
          travel_end_date: travelEnd,
          pax_count: paxCount,
          total_amount: totalAmount,
          advance_received: paidAmount,
          balance_amount: Math.max(0, balanceAmount),
          status: normalizeStatus(record?.status),
        };

        return {
          ...booking,
          pnr: record?.pnrNo || undefined,
          travelStartAt: record?.travelStartAt || null,
          travelEndAt: record?.travelEndAt || null,
        };
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

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiRequest<{
        data: {
          totalBookings: number;
          confirmedBookings: number;
          totalRevenue: number;
          revenueForecast: number;
          pendingAmount: number;
        };
      }>({
        method: "GET",
        url: "/bookings/stats",
      });
      if (res?.data) {
        setStats(res.data);
      }
    } catch (error) {
      // Silently fail - stats are not critical
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [fetchBookings, fetchStats]);

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

  const fetchVendors = useCallback(async () => {
    try {
      const res = await apiRequest<{ data: Array<{ id: string; name: string; email?: string; phone?: string; serviceType?: string }> }>({
        method: "GET",
        url: "/vendors",
      });
      const mapped: VendorLite[] = (res?.data ?? []).map((v) => ({
        id: v.id,
        name: v.name,
        email: v.email,
        phone: v.phone,
        serviceType: v.serviceType,
      }));
      setVendors(mapped);
    } catch (err) {
      // Silently fail - vendors are optional
      console.error("Failed to fetch vendors:", err);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

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

  // Use search results when searching, filter results when filtering, otherwise use paginated bookings
  const filteredBookings = useMemo(() => {
    let bookingsToSort: BookingRow[];
    
    // Priority: search > filter > all bookings
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
    } else if (activeFilters) {
      // Hydrate filter results with customer names
      bookingsToSort = filterResults.map((booking) => {
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
  }, [searchTerm, searchResults, activeFilters, filterResults, hydratedBookings, customersMap]);

  const resetAndClose = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
    setSelectedBookingError(null);
    setSelectedBookingLoading(false);
    setFormMode("create");
  };

  const handleOpenModal = useCallback((
    booking?: BookingRow,
    mode: "create" | "edit" | "view" = "create"
  ) => {
    setFormMode(mode);

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
  }, [loadBookingDetails]);

  useEffect(() => {
    const handleQuickAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ actionId?: string }>;
      if (customEvent.detail?.actionId === "booking.create") {
        handleOpenModal(undefined, "create");
      }
    };

    window.addEventListener("travox:quick-action", handleQuickAction);
    return () =>
      window.removeEventListener("travox:quick-action", handleQuickAction);
  }, [handleOpenModal]);

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
      // Clear search results if searching, then refresh bookings
      if (searchTerm) {
        performSearch(searchTerm);
      }
      await fetchBookings();
      await fetchStats();
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
    if (!d) return "-";
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return "-";
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
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
        // Refresh search results if searching, then refresh bookings
        if (searchTerm) {
          performSearch(searchTerm);
        }
        await fetchBookings();
        await fetchStats();
        return response;
      } catch (error) {
        const apiError = error as ApiError;
        if (
          apiError.status !== 409 ||
          !apiError.message.startsWith("Duplicate booking warning")
        ) {
          errorToast(apiError.message);
        }
        throw apiError;
      }
    },
    [fetchBookings, fetchStats, formMode, selectedBooking, searchTerm, performSearch]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Management"
        description="Manage bookings, OCR-prefill records, and status-driven reservation workflows."
        actions={
          <>
            <Button
              onClick={() => {
                fetchBookings();
                fetchStats();
              }}
              icon={RefreshCw}
              variant="outline"
              disabled={bookingsLoading || statsLoading}
            >
              Refresh
            </Button>
            <Button
              onClick={() => handleOpenModal(undefined, "create")}
              icon={Plus}
            >
              Create Booking
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Bookings" value={stats.totalBookings.toString()} tone="primary" />
        <StatCard label="Confirmed" value={stats.confirmedBookings.toString()} />
        <StatCard label="Revenue" value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`} />
        <StatCard label="Pending" value={`₹${stats.pendingAmount.toLocaleString("en-IN")}`} />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <SearchField
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              if (value && activeFilters) {
                clearFilters();
              }
            }}
            placeholder="Search bookings by package, customer, or amount"
          />
          <Loader isLoading={isSearching} />
        </div>
        <BookingFilter
          onFilter={(params) => {
            // Clear search when filtering
            if (searchTerm) {
              setSearchTerm("");
              setSearchResults([]);
            }
            performFilter(params);
          }}
          onClear={clearFilters}
          isLoading={isFiltering}
        />
      </div>

      {bookingsError && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {bookingsError}
        </div>
      )}

      {/* Pagination - hidden when search or filter is active */}
      {!bookingsLoading && !searchTerm && !activeFilters && (
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
      {bookingsLoading || isSearching || isFiltering ? (
        <Card className="rounded-2xl">
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex items-center space-x-3">
              <Spinner size="md" />
              <span className="text-gray-600">
                {isSearching ? "Searching..." : isFiltering ? "Filtering..." : "Loading bookings..."}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            {searchTerm ? "No Bookings Match Your Search" : activeFilters ? "No Bookings Match Current Filters" : "No Bookings Found"}
          </h3>
          <p className="text-gray-500">
            {searchTerm || activeFilters
              ? "Try refining search or clearing filters."
              : "Create your first booking to get started."}
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-700">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              <span className="font-medium">
                Showing {filteredBookings.length} booking{filteredBookings.length === 1 ? "" : "s"}
              </span>
              <span>Tip: use filters to narrow by status, payment state, date, or due amount.</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-900">
                  <TableCell header>Package</TableCell>
                  <TableCell header>Customer</TableCell>
                  <TableCell header>Booking Date</TableCell>
                  <TableCell header>Travel Start</TableCell>
                  <TableCell header>Travel End</TableCell>
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
                      <p className="text-sm text-gray-900">
                        {formatDate(b.booking_date)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-900">
                        {formatDateTime((b as any).travelStartAt)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-900">
                        {formatDateTime((b as any).travelEndAt)}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      {b.pax_count} {b.pax_count === 1 ? "person" : "people"}
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenModal(b, "view")}
                          title="View booking"
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit}
                          onClick={() => handleOpenModal(b, "edit")}
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
      <ConfirmDestructionModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleteLoading) {
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
            setDeleteError(null);
          }
        }}
        title="Delete booking?"
        message="Are you sure you want to delete this booking?"
        error={deleteError}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        confirmText="Yes, delete"
      />

      {/* Add / Edit / View Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetAndClose}
        title={
          formMode === "create" ? "Create Booking" : formMode === "edit" ? "Edit Booking" : "View Booking"
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
          <div className="mb-4 border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
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
          <div className="mb-4 border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {selectedBookingError}
          </div>
        )}
        {(!selectedBookingLoading || selectedBooking) && (
          <BookingFormV2
            key={
              selectedBooking
                ? selectedBooking.booking_id || selectedBooking.id
                : "new-v2"
            }
            selectedBooking={selectedBooking}
            customers={customers}
            vendors={vendors}
            onAddCustomer={addCustomer}
            onSubmitBooking={submitBooking}
            onCancel={resetAndClose}
            mode={formMode}
          />
        )}
      </Modal>
    </div>
  );
};

export default BookingManagement;
