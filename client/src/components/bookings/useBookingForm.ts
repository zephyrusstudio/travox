/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from "react";
import { apiRequest } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import {
  AIDataState,
  BookingFormState,
  BookingStatus,
  CustomerLite,
  Gender,
  NewCustomerData,
  TravelCategory,
} from "./booking.types";

// Props mirrored from BookingForm to keep hook standalone
export type UseBookingFormProps = {
  selectedBooking: any | null;
  customers: CustomerLite[];
  onAddCustomer: (c: NewCustomerData) => void;
  onSubmitBooking: (payload: any) => Promise<any> | any;
  onCancel: () => void;
};

type OcrExtractUploadResponse = {
  status: "success" | "error";
  message: string;
  data?: {
    fileInfo: { name: string; mimeType: string; size: number };
    extractedData?: any; // shape from OCRExtractedBooking if bookingFormat=false
    booking?: any; // booking payload when bookingFormat=true
  };
};

export function useBookingForm({
  selectedBooking,
  customers,
  onAddCustomer,
  onSubmitBooking,
  onCancel,
}: UseBookingFormProps) {
  const determineModeOfJourney = useCallback(
    (category: TravelCategory) => {
      switch (category) {
        case TravelCategory.Corporate:
          return "BUSINESS";
        default:
          return "FLIGHT";
      }
    },
    []
  );

  const derivePaxType = useCallback((age?: number) => {
    if (typeof age !== "number") return "ADULT";
    if (age < 2) return "INFANT";
    if (age < 12) return "CHILD";
    return "ADULT";
  }, []);

  const toIso = useCallback((date?: string, time?: string) => {
    if (!date) return undefined;
    const stamp = `${date}T${time ?? "00:00"}`;
    const iso = new Date(stamp).toISOString();
    return iso;
  }, []);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── AI extracted state ─────────────────────────────────────────────────────
  const [aiData, setAiDataState] = useState<AIDataState>({
    pnr: "",
    route: "",
    airline: "",
    flightNumber: "",
    journeyDate: "",
    journeyTime: "",
    returnDate: "",
    bookingAmount: 0,
    travelCategory: TravelCategory.Domestic,
    paxList: [],
  });

  const setAiData = useCallback(
    (patch: Partial<AIDataState>) =>
      setAiDataState((s) => ({ ...s, ...patch })),
    []
  );

  // ── Manual form state ──────────────────────────────────────────────────────
  const [formData, setFormData] = useState<BookingFormState>(
    selectedBooking
      ? {
          customer_id: selectedBooking.customer_id,
          customer_name: selectedBooking.customer_name || "",
          package_name: selectedBooking.package_name,
          booking_date: selectedBooking.booking_date,
          travel_start_date: selectedBooking.travel_start_date,
          travel_end_date: selectedBooking.travel_end_date,
          pax_count: selectedBooking.pax_count,
          total_amount: selectedBooking.total_amount,
          advance_received: selectedBooking.advance_received,
          status: selectedBooking.status as BookingStatus,
        }
      : {
          customer_id: "",
          customer_name: "",
          package_name: "",
          booking_date: new Date().toISOString().split("T")[0],
          travel_start_date: "",
          travel_end_date: "",
          pax_count: 1,
          total_amount: 0,
          advance_received: 0,
          status: BookingStatus.Pending,
        }
  );

  const setFormField = useCallback(
    <K extends keyof BookingFormState>(key: K, value: BookingFormState[K]) =>
      setFormData((s) => ({ ...s, [key]: value })),
    []
  );

  // ── New customer state ─────────────────────────────────────────────────────
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    passportNo: "",
    gstin: "",
  });

  const setNewCustomerField = useCallback(
    <K extends keyof NewCustomerData>(key: K, value: NewCustomerData[K]) =>
      setNewCustomerData((s) => ({ ...s, [key]: value })),
    []
  );

  // ── Derived ────────────────────────────────────────────────────────────────
  const balance = useMemo(
    () =>
      Math.max(
        0,
        (formData.total_amount || 0) - (formData.advance_received || 0)
      ),
    [formData.total_amount, formData.advance_received]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  function mapOcrToExtracted(booking: any) {
    const seg = booking?.itineraries?.[0]?.segments?.[0];

    const isDomestic =
      (seg?.hotelAddress || "").toLowerCase().includes("india") ||
      (booking?.currency || "").toUpperCase() === "INR";

    const paxList = (booking?.pax || []).map((p: any, i: number) => ({
      name: p.paxName || "",
      age: undefined,
      gender: undefined as Gender | undefined,
      isPrimary: i === 0 && p.paxType === "ADT",
    }));

    const checkIn = seg?.checkIn || "";
    const checkOut = seg?.checkOut || "";

    return {
      // matches your extracted structure
      pnr: booking?.pnrNo || "",
      route: seg?.hotelName || booking?.packageName || "Hotel",
      airline: "", // not applicable
      flightNumber: "", // not applicable
      journeyDate: checkIn,
      journeyTime: "",
      returnDate: checkOut,
      bookingAmount: Number(booking?.totalAmount || 0),
      travelCategory: isDomestic
        ? TravelCategory.Domestic
        : TravelCategory.International,
      paxList,
      bookingDate:
        booking?.bookingDate || new Date().toISOString().slice(0, 10), // fallback: today
    };
  }

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.includes("pdf") && !file.type.includes("image")) {
        alert("Please upload only PDF files or images");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        errorToast("File is larger than the 50 MB OCR limit.");
        return;
      }

      const payload = new FormData();
      payload.append("file", file);

      setUploadedFileName(file.name);
      setIsProcessing(true);

      try {
        const response = await apiRequest<OcrExtractUploadResponse>({
          method: "POST",
          url: "/ocr/extract",
          params: { bookingFormat: true },
          data: payload,
        });

        if (response.status !== "success" || !response.data?.booking) {
          throw new Error(response.message ?? "OCR extraction failed");
        }

        const booking = response.data.booking;
        const extracted = mapOcrToExtracted(booking);

        setAiData({
          pnr: extracted.pnr,
          route: extracted.route || "",
          airline: extracted.airline || "",
          flightNumber: extracted.flightNumber || "",
          journeyDate: extracted.journeyDate,
          journeyTime: extracted.journeyTime,
          returnDate: extracted.returnDate || "",
          bookingAmount: extracted.bookingAmount,
          travelCategory: extracted.travelCategory,
          paxList: extracted.paxList,
        });

        setFormData((prev) => ({
          ...prev,
          package_name:
            booking.packageName ||
            `${extracted.route} - ${extracted.travelCategory} Trip`,
          booking_date: extracted.bookingDate,
          travel_start_date: extracted.journeyDate,
          travel_end_date: extracted.returnDate || extracted.journeyDate,
          pax_count: extracted.paxList.length,
          total_amount: extracted.bookingAmount,
        }));

        successToast("OCR extraction completed successfully.");
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "OCR upload or mapping failed.";
        errorToast(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const handleCustomerSelect = useCallback(
    (customerId: string) => {
      const customer = customers.find((c) => c.customer_id === customerId);
      if (!customer) return;
      setFormData((s) => ({
        ...s,
        customer_id: customerId,
        customer_name: customer.full_name,
      }));
    },
    [customers]
  );

  const addPassenger = useCallback(
    () =>
      setAiDataState((s) => ({
        ...s,
        paxList: [...s.paxList, { name: "", isPrimary: false }],
      })),
    []
  );

  const removePassenger = useCallback(
    (idx: number) =>
      setAiDataState((s) => ({
        ...s,
        paxList: s.paxList.filter((_, i) => i !== idx),
      })),
    []
  );

  const updatePassenger = useCallback(
    (idx: number, field: keyof AIDataState["paxList"][number], value: any) =>
      setAiDataState((s) => ({
        ...s,
        paxList: s.paxList.map((p, i) =>
          i === idx ? { ...p, [field]: value } : p
        ),
      })),
    []
  );

  const handleAddNewCustomer = useCallback(() => {
    if (!newCustomerData.full_name.trim()) {
      alert("Customer name is required");
      return;
    }
    onAddCustomer(newCustomerData);
    setTimeout(() => {
      const newC = customers.find(
        (c) => c.full_name === newCustomerData.full_name
      );
      if (newC)
        setFormData((prev) => ({
          ...prev,
          customer_id: newC.customer_id,
          customer_name: newC.full_name,
        }));
    }, 100);
    setNewCustomerData({
      full_name: "",
      email: "",
      phone: "",
      address: "",
      passportNo: "",
      gstin: "",
    });
    setShowAddCustomer(false);
  }, [customers, newCustomerData, onAddCustomer]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.customer_id) {
        errorToast("Please select a customer or add a new customer");
        return;
      }
      if (!formData.package_name.trim()) {
        errorToast("Package name is required");
        return;
      }

      setIsSubmitting(true);
      try {
        const selectedCustomerDetails = customers.find(
          (c) => c.customer_id === formData.customer_id
        );

        const paxSource =
          aiData.paxList.length > 0
            ? aiData.paxList
            : [
                {
                  name:
                    selectedCustomerDetails?.full_name ||
                    formData.customer_name ||
                    "Primary Passenger",
                  age: undefined,
                  gender: undefined,
                  isPrimary: true,
                },
              ];

        const paxPayload = paxSource.map((pax) => {
          const paxEntry: Record<string, any> = {
            paxName:
              pax.name ||
              selectedCustomerDetails?.full_name ||
              formData.customer_name ||
              "Passenger",
            paxType: derivePaxType(pax.age),
          };
          if (pax.isPrimary && selectedCustomerDetails?.passportNo) {
            paxEntry.passportNo = selectedCustomerDetails.passportNo;
          }
          return paxEntry;
        });

        const payload: Record<string, any> = {
          customerId: formData.customer_id,
          packageName: formData.package_name.trim(),
          totalAmount: formData.total_amount,
          currency: "INR",
          advanceAmount: formData.advance_received,
          status: formData.status.toUpperCase(),
          bookingDate: toIso(formData.booking_date),
          modeOfJourney: determineModeOfJourney(aiData.travelCategory),
          pax: paxPayload,
        };

        if (aiData.pnr) payload.pnrNo = aiData.pnr.trim();
        if (formData.travel_start_date)
          payload.travelStartDate = toIso(formData.travel_start_date);
        if (formData.travel_end_date)
          payload.travelEndDate = toIso(formData.travel_end_date);
        if (aiData.journeyDate)
          payload.journeyDate = toIso(aiData.journeyDate, aiData.journeyTime);
        if (aiData.returnDate)
          payload.returnDate = toIso(aiData.returnDate);
        if (aiData.route) payload.route = aiData.route;
        if (aiData.airline) payload.airline = aiData.airline;
        if (aiData.flightNumber) payload.flightNumber = aiData.flightNumber;

        await onSubmitBooking(payload);
        onCancel();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to create booking. Please try again.";
        errorToast(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      aiData.airline,
      aiData.flightNumber,
      aiData.journeyDate,
      aiData.journeyTime,
      aiData.pnr,
      aiData.returnDate,
      aiData.route,
      aiData.travelCategory,
      aiData.paxList,
      customers,
      formData.advance_received,
      formData.booking_date,
      formData.customer_id,
      formData.customer_name,
      formData.package_name,
      formData.status,
      formData.total_amount,
      formData.travel_end_date,
      formData.travel_start_date,
      determineModeOfJourney,
      derivePaxType,
      onCancel,
      onSubmitBooking,
      toIso,
    ]
  );

  // ── UI helpers object to avoid prop drilling in JSX ────────────────────────
  const ui = useMemo(
    () => ({
      isProcessing,
      processingComplete,
      uploadedFileName,
      showAddCustomer,
      isSubmitting,
      toggleAddCustomer: () => setShowAddCustomer((s) => !s),
    }),
    [
      isProcessing,
      processingComplete,
      uploadedFileName,
      showAddCustomer,
      isSubmitting,
    ]
  );

  return {
    // state
    aiData,
    formData,
    newCustomerData,
    ui,
    // derived
    balance,
    // mutators
    setAiData,
    setFormField,
    setNewCustomerField,
    // handlers
    handleFileUpload,
    handleCustomerSelect,
    addPassenger,
    removePassenger,
    updatePassenger,
    handleAddNewCustomer,
    handleSubmit,
  };
}
