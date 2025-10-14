/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import {
  AIDataState,
  BookingFormState,
  CustomerLite,
  ExtractionMetadataForm,
  ItineraryForm,
  ModeOfJourneyOption,
  NewCustomerData,
  Pax,
  PaxTypeOption,
  SegmentForm,
  TravelCategory,
  VendorInfoForm,
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

const createPassenger = (overrides: Partial<Pax> = {}): Pax => ({
  name: "",
  paxType: PaxTypeOption.ADT,
  passportNo: "",
  dob: "",
  age: undefined,
  gender: undefined,
  isPrimary: false,
  ...overrides,
});

const createSegment = (
  mode: ModeOfJourneyOption | string = ModeOfJourneyOption.HOTEL,
  overrides: Partial<SegmentForm> = {}
): SegmentForm => ({
  seqNo: overrides.seqNo ?? 1,
  modeOfJourney: overrides.modeOfJourney ?? mode,
  carrierCode: overrides.carrierCode ?? "",
  serviceNumber: overrides.serviceNumber ?? "",
  depCode: overrides.depCode ?? "",
  arrCode: overrides.arrCode ?? "",
  depAt: overrides.depAt ?? "",
  arrAt: overrides.arrAt ?? "",
  classCode: overrides.classCode ?? "",
  baggage: overrides.baggage ?? "",
  hotelName: overrides.hotelName ?? "",
  hotelAddress: overrides.hotelAddress ?? "",
  checkIn: overrides.checkIn ?? "",
  checkOut: overrides.checkOut ?? "",
  roomType: overrides.roomType ?? "",
  mealPlan: overrides.mealPlan ?? "",
  operatorName: overrides.operatorName ?? "",
  boardingPoint: overrides.boardingPoint ?? "",
  dropPoint: overrides.dropPoint ?? "",
  misc: {
    totalRooms:
      overrides.misc && typeof overrides.misc.totalRooms !== "undefined"
        ? overrides.misc.totalRooms
        : "",
    totalGuests: overrides.misc?.totalGuests ?? "",
    totalNights:
      overrides.misc && typeof overrides.misc.totalNights !== "undefined"
        ? overrides.misc.totalNights
        : "",
  },
});

const toNumberOrBlank = (value: unknown): number | "" => {
  if (value === null || typeof value === "undefined" || value === "") {
    return "";
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : "";
};

export function useBookingForm({
  selectedBooking,
  customers,
  onAddCustomer,
  onSubmitBooking,
  onCancel,
}: UseBookingFormProps) {
  const determineModeOfJourney = useCallback((category: TravelCategory) => {
    switch (category) {
      case TravelCategory.Corporate:
        return ModeOfJourneyOption.CAB;
      default:
        return ModeOfJourneyOption.FLIGHT;
    }
  }, []);

  const derivePaxType = useCallback((age?: number) => {
    if (typeof age !== "number") return PaxTypeOption.ADT;
    if (age < 2) return PaxTypeOption.INF;
    if (age < 12) return PaxTypeOption.CHD;
    return PaxTypeOption.ADT;
  }, []);

  const toIso = useCallback((date?: string, time?: string) => {
    if (!date) return undefined;
    const hasTime = date.includes("T");
    const stamp = hasTime ? date : `${date}T${time ?? "00:00"}`;
    const d = new Date(stamp);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
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
    currency: "INR",
    modeOfJourney: ModeOfJourneyOption.FLIGHT,
    itineraries: [],
    vendorInfo: {
      name: "",
      contact: "",
      email: "",
    },
    extractionMetadata: {
      confidence: "",
      extractedFields: [],
      notes: "",
      schemaVersion: "",
    },
  });

  const setAiData = useCallback(
    (patch: Partial<AIDataState>) =>
      setAiDataState((s) => ({ ...s, ...patch })),
    []
  );

  const initialModeOfJourney =
    selectedBooking?.mode_of_journey ||
    selectedBooking?.modeOfJourney ||
    ModeOfJourneyOption.HOTEL;
  const initialCurrency =
    selectedBooking?.currency || selectedBooking?.currencyCode || "INR";
  const initialStatus =
    typeof selectedBooking?.status === "string" && selectedBooking.status
      ? selectedBooking.status
      : "Draft";
  const initialPnr =
    selectedBooking?.pnrNo ||
    selectedBooking?.pnr ||
    selectedBooking?.pnr_no ||
    "";

  // ── Manual form state ──────────────────────────────────────────────────────
  const [formData, setFormData] = useState<BookingFormState>(
    selectedBooking
      ? {
          customer_id: selectedBooking.customer_id,
          customer_name: selectedBooking.customer_name || "",
          package_name: selectedBooking.package_name,
          pnr_no: initialPnr,
          booking_date: selectedBooking.booking_date,
          travel_start_date: selectedBooking.travel_start_date,
          travel_end_date: selectedBooking.travel_end_date,
          pax_count: selectedBooking.pax_count,
          total_amount: selectedBooking.total_amount,
          advance_received: selectedBooking.advance_received,
          currency: initialCurrency,
          mode_of_journey: initialModeOfJourney,
          status: initialStatus,
        }
      : {
          customer_id: "",
          customer_name: "",
          package_name: "",
          pnr_no: "",
          booking_date: new Date().toISOString().split("T")[0],
          travel_start_date: "",
          travel_end_date: "",
          pax_count: 1,
          total_amount: 0,
          advance_received: 0,
          currency: "INR",
          mode_of_journey: ModeOfJourneyOption.FLIGHT,
          status: "Draft",
        }
  );

  const setFormField = useCallback(
    <K extends keyof BookingFormState>(key: K, value: BookingFormState[K]) =>
      setFormData((s) => ({ ...s, [key]: value })),
    []
  );

  const [passengers, setPassengers] = useState<Pax[]>(() => {
    const raw = Array.isArray((selectedBooking as any)?.pax)
      ? (selectedBooking as any).pax
      : Array.isArray((selectedBooking as any)?.paxList)
      ? (selectedBooking as any).paxList
      : [];
    if (raw.length > 0) {
      return raw.map((p: any, index: number) =>
        createPassenger({
          name: p.paxName || p.name || "",
          paxType:
            (p.paxType as PaxTypeOption) ||
            (typeof p.type === "string"
              ? (p.type as PaxTypeOption)
              : undefined) ||
            PaxTypeOption.ADT,
          passportNo: p.passportNo || "",
          dob: p.dob || "",
          age: typeof p.age === "number" ? p.age : undefined,
          gender: p.gender,
          isPrimary: Boolean(
            typeof p.isPrimary === "boolean" ? p.isPrimary : index === 0
          ),
        })
      );
    }
    return [createPassenger({ isPrimary: true })];
  });

  const [itineraries, setItineraries] = useState<ItineraryForm[]>(() => {
    const raw = Array.isArray((selectedBooking as any)?.itineraries)
      ? (selectedBooking as any).itineraries
      : [];
    if (raw.length > 0) {
      return raw.map((it: any, idx: number) => ({
        name: it?.name || `Itinerary ${idx + 1}`,
        seqNo: Number(it?.seqNo) || idx + 1,
        segments:
          Array.isArray(it?.segments) && it.segments.length > 0
            ? it.segments.map((seg: any, sIdx: number) =>
                createSegment(initialModeOfJourney, {
                  seqNo: Number(seg?.seqNo) || sIdx + 1,
                  modeOfJourney:
                    seg?.modeOfJourney ||
                    seg?.mode_of_journey ||
                    initialModeOfJourney,
                  carrierCode: seg?.carrierCode || seg?.carrier_code || "",
                  serviceNumber:
                    seg?.serviceNumber || seg?.service_number || "",
                  depCode: seg?.depCode || seg?.dep_code || "",
                  arrCode: seg?.arrCode || seg?.arr_code || "",
                  depAt: seg?.depAt || seg?.dep_at || "",
                  arrAt: seg?.arrAt || seg?.arr_at || "",
                  classCode: seg?.classCode || seg?.class_code || "",
                  baggage: seg?.baggage || "",
                  hotelName: seg?.hotelName || seg?.hotel_name || "",
                  hotelAddress: seg?.hotelAddress || seg?.hotel_address || "",
                  checkIn: seg?.checkIn || seg?.check_in || "",
                  checkOut: seg?.checkOut || seg?.check_out || "",
                  roomType: seg?.roomType || seg?.room_type || "",
                  mealPlan: seg?.mealPlan || seg?.meal_plan || "",
                  operatorName: seg?.operatorName || seg?.operator_name || "",
                  boardingPoint:
                    seg?.boardingPoint || seg?.boarding_point || "",
                  dropPoint: seg?.dropPoint || seg?.drop_point || "",
                  misc: {
                    totalRooms: toNumberOrBlank(seg?.misc?.totalRooms),
                    totalGuests: seg?.misc?.totalGuests || "",
                    totalNights: toNumberOrBlank(seg?.misc?.totalNights),
                  },
                })
              )
            : [createSegment(initialModeOfJourney)],
      }));
    }
    return [
      {
        name: "",
        seqNo: 1,
        segments: [createSegment(initialModeOfJourney)],
      },
    ];
  });

  const [vendorInfo, setVendorInfo] = useState<VendorInfoForm>(() => {
    const vendor = (selectedBooking as any)?.vendorInfo;
    if (vendor) {
      return {
        name: vendor.name || "",
        contact: vendor.contact || "",
        email: vendor.email || "",
      };
    }
    return { name: "", contact: "", email: "" };
  });

  const [extractionMetadata, setExtractionMetadata] =
    useState<ExtractionMetadataForm>(() => {
      const metadata = (selectedBooking as any)?.extractionMetadata;
      if (metadata) {
        return {
          confidence: metadata.confidence || "",
          extractedFields: Array.isArray(metadata.extractedFields)
            ? metadata.extractedFields
                .map((field: any) => String(field || "").trim())
                .filter(Boolean)
            : [],
          notes: metadata.notes || "",
          schemaVersion: metadata.schemaVersion || "",
        };
      }
      return {
        confidence: "",
        extractedFields: [],
        notes: "",
        schemaVersion: "",
      };
    });

  useEffect(() => {
    setFormData((prev) =>
      prev.pax_count === passengers.length
        ? prev
        : { ...prev, pax_count: passengers.length }
    );
  }, [passengers.length]);

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
    const rawItineraries = Array.isArray(booking?.itineraries)
      ? booking.itineraries
      : [];

    const normalizedItineraries: ItineraryForm[] =
      rawItineraries.length > 0
        ? rawItineraries.map((it: any, idx: number) => {
            const baseMode =
              it?.segments?.[0]?.modeOfJourney ||
              it?.segments?.[0]?.mode_of_journey ||
              booking?.modeOfJourney ||
              ModeOfJourneyOption.HOTEL;
            const segments =
              Array.isArray(it?.segments) && it.segments.length > 0
                ? it.segments.map((seg: any, sIdx: number) =>
                    createSegment(baseMode, {
                      seqNo: Number(seg?.seqNo) || sIdx + 1,
                      modeOfJourney:
                        seg?.modeOfJourney || seg?.mode_of_journey || baseMode,
                      carrierCode: seg?.carrierCode || seg?.carrier_code || "",
                      serviceNumber:
                        seg?.serviceNumber || seg?.service_number || "",
                      depCode: seg?.depCode || seg?.dep_code || "",
                      arrCode: seg?.arrCode || seg?.arr_code || "",
                      depAt: seg?.depAt || seg?.dep_at || "",
                      arrAt: seg?.arrAt || seg?.arr_at || "",
                      classCode: seg?.classCode || seg?.class_code || "",
                      baggage: seg?.baggage || "",
                      hotelName: seg?.hotelName || seg?.hotel_name || "",
                      hotelAddress:
                        seg?.hotelAddress || seg?.hotel_address || "",
                      checkIn: seg?.checkIn || seg?.check_in || "",
                      checkOut: seg?.checkOut || seg?.check_out || "",
                      roomType: seg?.roomType || seg?.room_type || "",
                      mealPlan: seg?.mealPlan || seg?.meal_plan || "",
                      operatorName:
                        seg?.operatorName || seg?.operator_name || "",
                      boardingPoint:
                        seg?.boardingPoint || seg?.boarding_point || "",
                      dropPoint: seg?.dropPoint || seg?.drop_point || "",
                      misc: {
                        totalRooms: toNumberOrBlank(seg?.misc?.totalRooms),
                        totalGuests: seg?.misc?.totalGuests || "",
                        totalNights: toNumberOrBlank(seg?.misc?.totalNights),
                      },
                    })
                  )
                : [createSegment(baseMode)];
            return {
              name: it?.name || `Itinerary ${idx + 1}`,
              seqNo: Number(it?.seqNo) || idx + 1,
              segments,
            };
          })
        : [
            {
              name: booking?.packageName || "Itinerary 1",
              seqNo: 1,
              segments: [
                createSegment(
                  booking?.modeOfJourney || ModeOfJourneyOption.HOTEL,
                  {
                    hotelName:
                      booking?.hotelName || booking?.vendorInfo?.name || "",
                    hotelAddress:
                      booking?.hotelAddress ||
                      booking?.vendorInfo?.address ||
                      "",
                    checkIn: booking?.checkIn || "",
                    checkOut: booking?.checkOut || "",
                  }
                ),
              ],
            },
          ];

    const firstSegment = normalizedItineraries[0]?.segments?.[0];

    const paxList = Array.isArray(booking?.pax)
      ? booking.pax.map((p: any, i: number) =>
          createPassenger({
            name: p.paxName || "",
            paxType:
              (p.paxType as PaxTypeOption) ||
              (typeof p.pax_type === "string"
                ? (p.pax_type as PaxTypeOption)
                : PaxTypeOption.ADT),
            passportNo: p.passportNo || "",
            dob: p.dob || "",
            age: typeof p.age === "number" ? p.age : undefined,
            gender: p.gender,
            isPrimary: Boolean(
              typeof p.isPrimary === "boolean" ? p.isPrimary : i === 0
            ),
          })
        )
      : [createPassenger({ isPrimary: true })];

    const vendor: VendorInfoForm = {
      name: booking?.vendorInfo?.name || "",
      contact: booking?.vendorInfo?.contact || "",
      email: booking?.vendorInfo?.email || "",
    };

    const metadata: ExtractionMetadataForm = {
      confidence: booking?.extractionMetadata?.confidence || "",
      extractedFields: Array.isArray(
        booking?.extractionMetadata?.extractedFields
      )
        ? booking.extractionMetadata.extractedFields
            .map((field: any) => String(field || "").trim())
            .filter(Boolean)
        : [],
      notes: booking?.extractionMetadata?.notes || "",
      schemaVersion: booking?.extractionMetadata?.schemaVersion || "",
    };

    const currency = booking?.currency || "INR";
    const modeOfJourney =
      booking?.modeOfJourney ||
      firstSegment?.modeOfJourney ||
      ModeOfJourneyOption.HOTEL;

    const checkIn = firstSegment?.checkIn || firstSegment?.depAt || "";
    const checkOut = firstSegment?.checkOut || firstSegment?.arrAt || "";

    const isDomestic =
      (firstSegment?.hotelAddress || "").toLowerCase().includes("india") ||
      (currency || "").toUpperCase() === "INR";

    return {
      pnr: booking?.pnrNo || "",
      route:
        firstSegment?.hotelName ||
        firstSegment?.depCode ||
        booking?.packageName ||
        "Itinerary",
      airline: booking?.airline || "",
      flightNumber: booking?.flightNumber || "",
      journeyDate: checkIn,
      journeyTime: booking?.journeyTime || "",
      returnDate: checkOut,
      bookingAmount: Number(booking?.totalAmount || 0),
      travelCategory: isDomestic
        ? TravelCategory.Domestic
        : TravelCategory.International,
      paxList,
      bookingDate:
        booking?.bookingDate || new Date().toISOString().slice(0, 10),
      currency,
      modeOfJourney,
      itineraries: normalizedItineraries,
      vendorInfo: vendor,
      extractionMetadata: metadata,
      status: booking?.status || "Draft",
      totalAmount: Number(booking?.totalAmount || 0),
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
          currency: extracted.currency,
          modeOfJourney: extracted.modeOfJourney,
          itineraries: extracted.itineraries,
          vendorInfo: extracted.vendorInfo,
          extractionMetadata: extracted.extractionMetadata,
        });

        setPassengers(extracted.paxList);
        setItineraries(extracted.itineraries);
        setVendorInfo(extracted.vendorInfo);
        setExtractionMetadata(extracted.extractionMetadata);

        setFormData((prev) => ({
          ...prev,
          package_name:
            booking.packageName ||
            `${extracted.route} - ${extracted.travelCategory} Trip`,
          pnr_no: extracted.pnr,
          booking_date: extracted.bookingDate,
          travel_start_date: extracted.journeyDate,
          travel_end_date: extracted.returnDate || extracted.journeyDate,
          pax_count: extracted.paxList.length,
          total_amount: extracted.totalAmount ?? extracted.bookingAmount,
          currency: extracted.currency,
          mode_of_journey: extracted.modeOfJourney,
          status: extracted.status || prev.status,
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

  const addPassenger = useCallback(() => {
    setPassengers((prev) => {
      const next = [
        ...prev,
        createPassenger({
          isPrimary: prev.length === 0,
        }),
      ];
      return next;
    });
  }, []);

  const removePassenger = useCallback((idx: number) => {
    setPassengers((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) {
        return [createPassenger({ isPrimary: true })];
      }
      if (next.every((p) => !p.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }, []);

  const updatePassenger = useCallback(
    (idx: number, field: keyof Pax, value: any) => {
      setPassengers((prev) => {
        return prev.map((p, i) => {
          if (i !== idx) {
            if (field === "isPrimary" && value === true) {
              return { ...p, isPrimary: false };
            }
            return p;
          }

          if (field === "age") {
            const ageValue =
              value === "" || value === null ? undefined : Number(value);
            return {
              ...p,
              age: Number.isFinite(ageValue as number) ? ageValue : undefined,
            };
          }

          if (field === "paxType" && value === "") {
            return { ...p, paxType: PaxTypeOption.ADT };
          }

          if (field === "isPrimary") {
            return { ...p, isPrimary: Boolean(value) };
          }

          return { ...p, [field]: value };
        });
      });
    },
    []
  );

  const addItinerary = useCallback(() => {
    setItineraries((prev) => [
      ...prev,
      {
        name: "",
        seqNo: prev.length + 1,
        segments: [
          createSegment(formData.mode_of_journey || ModeOfJourneyOption.HOTEL, {
            seqNo: 1,
          }),
        ],
      },
    ]);
  }, [formData.mode_of_journey]);

  const removeItinerary = useCallback(
    (idx: number) => {
      setItineraries((prev) => {
        const next = prev
          .filter((_, i) => i !== idx)
          .map((it, index) => ({
            ...it,
            seqNo: index + 1,
          }));
        return next.length > 0
          ? next
          : [
              {
                name: "",
                seqNo: 1,
                segments: [
                  createSegment(
                    formData.mode_of_journey || ModeOfJourneyOption.HOTEL,
                    { seqNo: 1 }
                  ),
                ],
              },
            ];
      });
    },
    [formData.mode_of_journey]
  );

  const updateItineraryField = useCallback(
    (idx: number, field: keyof ItineraryForm, value: any) => {
      setItineraries((prev) =>
        prev.map((it, i) =>
          i === idx
            ? {
                ...it,
                [field]: field === "seqNo" ? Number(value) || it.seqNo : value,
              }
            : it
        )
      );
    },
    []
  );

  const addSegment = useCallback(
    (itineraryIdx: number) => {
      setItineraries((prev) =>
        prev.map((it, i) =>
          i === itineraryIdx
            ? {
                ...it,
                segments: [
                  ...it.segments,
                  createSegment(
                    formData.mode_of_journey || ModeOfJourneyOption.HOTEL,
                    { seqNo: it.segments.length + 1 }
                  ),
                ],
              }
            : it
        )
      );
    },
    [formData.mode_of_journey]
  );

  const removeSegment = useCallback(
    (itineraryIdx: number, segmentIdx: number) => {
      setItineraries((prev) =>
        prev.map((it, i) => {
          if (i !== itineraryIdx) return it;
          const nextSegments = it.segments
            .filter((_, idx) => idx !== segmentIdx)
            .map((seg, index) => ({ ...seg, seqNo: index + 1 }));
          return {
            ...it,
            segments:
              nextSegments.length > 0
                ? nextSegments
                : [
                    createSegment(
                      formData.mode_of_journey || ModeOfJourneyOption.HOTEL,
                      { seqNo: 1 }
                    ),
                  ],
          };
        })
      );
    },
    [formData.mode_of_journey]
  );

  const updateSegmentField = useCallback(
    (
      itineraryIdx: number,
      segmentIdx: number,
      field: keyof SegmentForm,
      value: any
    ) => {
      setItineraries((prev) =>
        prev.map((it, i) => {
          if (i !== itineraryIdx) return it;
          return {
            ...it,
            segments: it.segments.map((seg, idx) => {
              if (idx !== segmentIdx) return seg;
              if (field === "seqNo") {
                return { ...seg, seqNo: Number(value) || seg.seqNo };
              }
              if (field === "misc") {
                return seg;
              }
              return { ...seg, [field]: value };
            }),
          };
        })
      );
    },
    []
  );

  const updateSegmentMiscField = useCallback(
    (
      itineraryIdx: number,
      segmentIdx: number,
      field: keyof SegmentForm["misc"],
      value: any
    ) => {
      setItineraries((prev) =>
        prev.map((it, i) => {
          if (i !== itineraryIdx) return it;
          return {
            ...it,
            segments: it.segments.map((seg, idx) => {
              if (idx !== segmentIdx) return seg;
              const parsedValue =
                field === "totalRooms" || field === "totalNights"
                  ? toNumberOrBlank(value)
                  : value;
              return {
                ...seg,
                misc: {
                  ...seg.misc,
                  [field]: parsedValue,
                },
              };
            }),
          };
        })
      );
    },
    []
  );

  const setVendorInfoField = useCallback(
    (field: keyof VendorInfoForm, value: string) => {
      setVendorInfo((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const setExtractionMetadataField = useCallback(
    (field: keyof ExtractionMetadataForm, value: string) => {
      setExtractionMetadata((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addExtractionField = useCallback(() => {
    setExtractionMetadata((prev) => ({
      ...prev,
      extractedFields: [...prev.extractedFields, ""],
    }));
  }, []);

  const updateExtractionField = useCallback((idx: number, value: string) => {
    setExtractionMetadata((prev) => ({
      ...prev,
      extractedFields: prev.extractedFields.map((field, i) =>
        i === idx ? value : field
      ),
    }));
  }, []);

  const removeExtractionField = useCallback((idx: number) => {
    setExtractionMetadata((prev) => ({
      ...prev,
      extractedFields: prev.extractedFields.filter((_, i) => i !== idx),
    }));
  }, []);

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

        const paxSource = passengers.length
          ? passengers
          : [
              createPassenger({
                name:
                  selectedCustomerDetails?.full_name ||
                  formData.customer_name ||
                  "Primary Passenger",
                isPrimary: true,
              }),
            ];

        const paxPayload = paxSource.map((pax, index) => {
          const paxName =
            pax.name?.trim() ||
            selectedCustomerDetails?.full_name ||
            formData.customer_name ||
            `Passenger ${index + 1}`;
          const paxType =
            pax.paxType && pax.paxType !== ""
              ? pax.paxType
              : derivePaxType(pax.age);
          return {
            paxName,
            paxType,
            passportNo:
              pax.passportNo && pax.passportNo.trim().length > 0
                ? pax.passportNo.trim()
                : pax.isPrimary && selectedCustomerDetails?.passportNo
                ? selectedCustomerDetails.passportNo
                : null,
            dob: pax.dob && pax.dob.trim().length > 0 ? pax.dob.trim() : null,
          };
        });

        const itinerariesPayload = itineraries.map((itinerary, idx) => ({
          name: itinerary.name?.trim() || `Itinerary ${idx + 1}`,
          seqNo: itinerary.seqNo || idx + 1,
          segments: itinerary.segments.map((segment, segmentIdx) => ({
            seqNo: segment.seqNo || segmentIdx + 1,
            modeOfJourney:
              segment.modeOfJourney ||
              formData.mode_of_journey ||
              aiData.modeOfJourney ||
              determineModeOfJourney(aiData.travelCategory),
            carrierCode: segment.carrierCode || null,
            serviceNumber: segment.serviceNumber || null,
            depCode: segment.depCode || null,
            arrCode: segment.arrCode || null,
            depAt: segment.depAt || null,
            arrAt: segment.arrAt || null,
            classCode: segment.classCode || null,
            baggage: segment.baggage || null,
            hotelName: segment.hotelName || null,
            hotelAddress: segment.hotelAddress || null,
            checkIn: segment.checkIn || null,
            checkOut: segment.checkOut || null,
            roomType: segment.roomType || null,
            mealPlan: segment.mealPlan || null,
            operatorName: segment.operatorName || null,
            boardingPoint: segment.boardingPoint || null,
            dropPoint: segment.dropPoint || null,
            misc: {
              totalRooms:
                segment.misc.totalRooms === "" ? null : segment.misc.totalRooms,
              totalGuests: segment.misc.totalGuests || null,
              totalNights:
                segment.misc.totalNights === ""
                  ? null
                  : segment.misc.totalNights,
            },
          })),
        }));

        const metadataPayload = {
          confidence: extractionMetadata.confidence || "UNKNOWN",
          extractedFields: extractionMetadata.extractedFields
            .map((field) => field.trim())
            .filter(Boolean),
          notes: extractionMetadata.notes || "",
          schemaVersion: extractionMetadata.schemaVersion || "",
        };

        const payload: Record<string, any> = {
          customerId: formData.customer_id,
          packageName: formData.package_name.trim(),
          pnrNo: formData.pnr_no?.trim() || null,
          bookingDate: formData.booking_date
            ? toIso(formData.booking_date)
            : null,
          totalAmount: formData.total_amount,
          currency: formData.currency || aiData.currency || "INR",
          advanceAmount: formData.advance_received,
          modeOfJourney:
            formData.mode_of_journey ||
            aiData.modeOfJourney ||
            determineModeOfJourney(aiData.travelCategory),
          pax: paxPayload,
          itineraries: itinerariesPayload,
          vendorInfo: {
            name: vendorInfo.name || "",
            contact: vendorInfo.contact || "",
            email: vendorInfo.email || "",
          },
          status: formData.status || "Draft",
          extractionMetadata: metadataPayload,
        };

        if (!payload.pnrNo && aiData.pnr) {
          payload.pnrNo = aiData.pnr.trim();
        }
        if (formData.travel_start_date)
          payload.travelStartDate = toIso(formData.travel_start_date);
        if (formData.travel_end_date)
          payload.travelEndDate = toIso(formData.travel_end_date);
        if (aiData.journeyDate)
          payload.journeyDate = toIso(aiData.journeyDate, aiData.journeyTime);
        if (aiData.returnDate) payload.returnDate = toIso(aiData.returnDate);
        if (aiData.route) payload.route = aiData.route;
        if (aiData.airline) payload.airline = aiData.airline;
        if (aiData.flightNumber) payload.flightNumber = aiData.flightNumber;
        if (aiData.vendorInfo?.name && !payload.vendorInfo?.name) {
          payload.vendorInfo.name = aiData.vendorInfo.name;
        }
        if (aiData.vendorInfo?.contact && !payload.vendorInfo?.contact) {
          payload.vendorInfo.contact = aiData.vendorInfo.contact;
        }
        if (aiData.vendorInfo?.email && !payload.vendorInfo?.email) {
          payload.vendorInfo.email = aiData.vendorInfo.email;
        }

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
      aiData.currency,
      aiData.modeOfJourney,
      aiData.travelCategory,
      customers,
      extractionMetadata.confidence,
      extractionMetadata.extractedFields,
      extractionMetadata.notes,
      extractionMetadata.schemaVersion,
      formData.advance_received,
      formData.booking_date,
      formData.currency,
      formData.customer_id,
      formData.customer_name,
      formData.mode_of_journey,
      formData.pnr_no,
      formData.package_name,
      formData.status,
      formData.total_amount,
      formData.travel_end_date,
      formData.travel_start_date,
      itineraries,
      determineModeOfJourney,
      derivePaxType,
      onCancel,
      onSubmitBooking,
      passengers,
      vendorInfo.contact,
      vendorInfo.email,
      vendorInfo.name,
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
    passengers,
    itineraries,
    vendorInfo,
    extractionMetadata,
    ui,
    // derived
    balance,
    // mutators
    setAiData,
    setFormField,
    setNewCustomerField,
    setVendorInfoField,
    setExtractionMetadataField,
    addExtractionField,
    updateExtractionField,
    removeExtractionField,
    // handlers
    handleFileUpload,
    handleCustomerSelect,
    addPassenger,
    removePassenger,
    updatePassenger,
    addItinerary,
    removeItinerary,
    updateItineraryField,
    addSegment,
    removeSegment,
    updateSegmentField,
    updateSegmentMiscField,
    handleAddNewCustomer,
    handleSubmit,
  };
}
