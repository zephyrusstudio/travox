/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../utils/apiConnector';
import { errorToast, successToast } from '../../utils/toasts';
import {
  BookingFormStateV2,
  BookingStatus,
  CreateBookingDTO,
  CustomerLite,
  ItineraryDTO,
  ItineraryFormState,
  ModeOfJourney,
  NewCustomerData,
  OCRUploadResponse,
  PAXType,
  PaxDTO,
  PaxFormState,
  SegmentDTO,
  SegmentFormState,
  VendorLite,
} from './booking.v2.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Props
// ─────────────────────────────────────────────────────────────────────────────

export interface UseBookingFormV2Props {
  selectedBooking: any | null;
  customers: CustomerLite[];
  vendors?: VendorLite[];
  onAddCustomer: (data: NewCustomerData) => void;
  onSubmitBooking: (payload: CreateBookingDTO) => Promise<any>;
  onCancel: () => void;
  mode?: 'create' | 'edit' | 'view';
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

const normalizeAmount = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
};

const createEmptyPax = (): PaxFormState => ({
  paxName: '',
  paxType: PAXType.ADT,
  passportNo: '',
  dob: '',
});

const createEmptySegment = (seqNo: number = 1): SegmentFormState => ({
  seqNo,
  modeOfJourney: ModeOfJourney.FLIGHT,
  carrierCode: '',
  serviceNumber: '',
  depCode: '',
  arrCode: '',
  depAt: '',
  arrAt: '',
  classCode: '',
  baggage: '',
  hotelName: '',
  hotelAddress: '',
  checkIn: '',
  checkOut: '',
  roomType: '',
  mealPlan: '',
  operatorName: '',
  boardingPoint: '',
  dropPoint: '',
  misc: {},
});

const createEmptyItinerary = (seqNo: number = 1): ItineraryFormState => ({
  name: '',
  seqNo,
  segments: [createEmptySegment(1)],
});

/**
 * Converts form date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm) to ISO Date string
 */
const toISODate = (dateString: string): string | undefined => {
  if (!dateString) return undefined;
  const trimmed = dateString.trim();
  if (!trimmed) return undefined;

  try {
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
};

/**
 * Converts ISO date string to form input format (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
 */
const fromISODate = (isoString?: string | Date, includeTime: boolean = false): string => {
  if (!isoString) return '';
  
  try {
    const date = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(date.getTime())) return '';
    
    if (includeTime) {
      // Format: YYYY-MM-DDTHH:mm
      return date.toISOString().slice(0, 16);
    } else {
      // Format: YYYY-MM-DD
      return date.toISOString().slice(0, 10);
    }
  } catch {
    return '';
  }
};

/**
 * Transforms PaxFormState to PaxDTO for API payload
 */
const transformPaxToDTO = (pax: PaxFormState): PaxDTO | null => {
  if (!pax.paxName.trim() || !pax.paxType) return null;
  
  return {
    paxName: pax.paxName.trim(),
    paxType: pax.paxType as PAXType,
    passportNo: pax.passportNo.trim() || undefined,
    dob: toISODate(pax.dob),
  };
};

/**
 * Transforms SegmentFormState to SegmentDTO for API payload
 */
const transformSegmentToDTO = (segment: SegmentFormState): SegmentDTO | null => {
  if (!segment.modeOfJourney) return null;

  const dto: SegmentDTO = {
    seqNo: segment.seqNo,
    modeOfJourney: segment.modeOfJourney as ModeOfJourney,
  };

  // Add optional fields only if they have values
  if (segment.carrierCode.trim()) dto.carrierCode = segment.carrierCode.trim();
  if (segment.serviceNumber.trim()) dto.serviceNumber = segment.serviceNumber.trim();
  if (segment.depCode.trim()) dto.depCode = segment.depCode.trim();
  if (segment.arrCode.trim()) dto.arrCode = segment.arrCode.trim();
  if (segment.depAt) dto.depAt = toISODate(segment.depAt);
  if (segment.arrAt) dto.arrAt = toISODate(segment.arrAt);
  if (segment.classCode.trim()) dto.classCode = segment.classCode.trim();
  if (segment.baggage.trim()) dto.baggage = segment.baggage.trim();
  if (segment.hotelName.trim()) dto.hotelName = segment.hotelName.trim();
  if (segment.hotelAddress.trim()) dto.hotelAddress = segment.hotelAddress.trim();
  if (segment.checkIn) dto.checkIn = toISODate(segment.checkIn);
  if (segment.checkOut) dto.checkOut = toISODate(segment.checkOut);
  if (segment.roomType.trim()) dto.roomType = segment.roomType.trim();
  if (segment.mealPlan.trim()) dto.mealPlan = segment.mealPlan.trim();
  if (segment.operatorName.trim()) dto.operatorName = segment.operatorName.trim();
  if (segment.boardingPoint.trim()) dto.boardingPoint = segment.boardingPoint.trim();
  if (segment.dropPoint.trim()) dto.dropPoint = segment.dropPoint.trim();
  if (segment.misc && Object.keys(segment.misc).length > 0) dto.misc = segment.misc;

  return dto;
};

/**
 * Transforms ItineraryFormState to ItineraryDTO for API payload
 */
const transformItineraryToDTO = (itinerary: ItineraryFormState): ItineraryDTO | null => {
  if (!itinerary.name.trim()) return null;
  
  const segments = itinerary.segments
    .map(transformSegmentToDTO)
    .filter((s): s is SegmentDTO => s !== null);
  
  return {
    name: itinerary.name.trim(),
    seqNo: itinerary.seqNo,
    segments,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useBookingFormV2({
  selectedBooking,
  customers,
  vendors = [],
  onAddCustomer,
  onSubmitBooking,
  onCancel,
  mode = 'create',
}: UseBookingFormV2Props) {
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';

  // ─── UI State ────────────────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Form State ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<BookingFormStateV2>({
    customerId: '',
    currency: 'INR',
    totalAmount: '',
    bookingDate: new Date().toISOString().slice(0, 10),
    packageName: '',
    pnrNo: '',
    modeOfJourney: '',
    advanceAmount: '',
    status: BookingStatus.DRAFT,
    vendorId: '',
  });

  const [paxList, setPaxList] = useState<PaxFormState[]>([createEmptyPax()]);
  const [itineraries, setItineraries] = useState<ItineraryFormState[]>([]);

  // ─── New Customer State ──────────────────────────────────────────────────
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    passportNo: '',
    gstin: '',
  });

  // ─── Computed Values ─────────────────────────────────────────────────────
  const totalAmount = typeof formData.totalAmount === 'number' 
    ? formData.totalAmount 
    : normalizeAmount(formData.totalAmount);
  const advanceAmount = typeof formData.advanceAmount === 'number'
    ? formData.advanceAmount
    : normalizeAmount(formData.advanceAmount);
  const balance = totalAmount - advanceAmount;

  // ─── Load Existing Booking (Edit/View Mode) ──────────────────────────────────
  useEffect(() => {
    if (!selectedBooking || (!isEditMode && mode !== 'view')) return;

    try {
      setFormData({
        customerId: selectedBooking.customerId || '',
        currency: selectedBooking.currency || 'INR',
        totalAmount: selectedBooking.totalAmount || '',
        bookingDate: fromISODate(selectedBooking.bookingDate, false),
        packageName: selectedBooking.packageName || '',
        pnrNo: selectedBooking.pnrNo || '',
        modeOfJourney: selectedBooking.modeOfJourney || '',
        advanceAmount: selectedBooking.advanceAmount || '',
        status: selectedBooking.status || BookingStatus.DRAFT,
        vendorId: selectedBooking.vendorId || '',
      });

      // Load pax
      if (selectedBooking.pax && Array.isArray(selectedBooking.pax)) {
        setPaxList(
          selectedBooking.pax.map((p: any) => ({
            paxName: p.paxName || '',
            paxType: p.paxType || PAXType.ADT,
            passportNo: p.passportNo || '',
            dob: fromISODate(p.dob, false),
          }))
        );
      }

      // Load itineraries
      if (selectedBooking.itineraries && Array.isArray(selectedBooking.itineraries)) {
        setItineraries(
          selectedBooking.itineraries.map((itin: any, itinIdx: number) => ({
            name: itin.name || '',
            seqNo: itin.seqNo ?? itinIdx + 1,
            segments: Array.isArray(itin.segments)
              ? itin.segments.map((seg: any, segIdx: number) => ({
                  seqNo: seg.seqNo ?? segIdx + 1,
                  modeOfJourney: seg.modeOfJourney || ModeOfJourney.FLIGHT,
                  carrierCode: seg.carrierCode || '',
                  serviceNumber: seg.serviceNumber || '',
                  depCode: seg.depCode || '',
                  arrCode: seg.arrCode || '',
                  depAt: fromISODate(seg.depAt, true),
                  arrAt: fromISODate(seg.arrAt, true),
                  classCode: seg.classCode || '',
                  baggage: seg.baggage || '',
                  hotelName: seg.hotelName || '',
                  hotelAddress: seg.hotelAddress || '',
                  checkIn: fromISODate(seg.checkIn, true),
                  checkOut: fromISODate(seg.checkOut, true),
                  roomType: seg.roomType || '',
                  mealPlan: seg.mealPlan || '',
                  operatorName: seg.operatorName || '',
                  boardingPoint: seg.boardingPoint || '',
                  dropPoint: seg.dropPoint || '',
                  misc: seg.misc || {},
                }))
              : [createEmptySegment(1)],
          }))
        );
      }
    } catch (error) {
      console.error('Error loading booking for edit/view:', error);
      errorToast('Failed to load booking data');
    }
  }, [selectedBooking, isEditMode, mode]);

  // ─── File Upload Handler ─────────────────────────────────────────────────
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setUploadedFileName(file.name);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', 'true'); // Request pre-formatted booking payload

        const response = await apiRequest<OCRUploadResponse>({
          method: 'POST',
          url: '/scan',
          data: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.status === 'success' && response.data) {
          // When format=true, data is in response.data.booking
          // When format=false, data is in response.data.extractedData
          const extracted = response.data.booking || response.data.extractedData;

          if (!extracted) {
            errorToast('No booking data found in response');
            return;
          }

          // Update form data from extraction
          setFormData((prev) => ({
            ...prev,
            pnrNo: extracted.pnrNo || prev.pnrNo,
            bookingDate: extracted.bookingDate ? fromISODate(extracted.bookingDate, false) : prev.bookingDate,
            totalAmount: extracted.totalAmount ?? prev.totalAmount,
            currency: extracted.currency || prev.currency,
            packageName: extracted.packageName || prev.packageName,
            modeOfJourney: extracted.modeOfJourney || prev.modeOfJourney,
          }));

          // Update pax list from extraction
          if (extracted.pax && extracted.pax.length > 0) {
            setPaxList(
              extracted.pax.map((p) => ({
                paxName: p.paxName || '',
                paxType: p.paxType || PAXType.ADT,
                passportNo: p.passportNo || '',
                dob: fromISODate(p.dob, false),
              }))
            );
          }

          // Update itineraries from extraction
          if (extracted.itineraries && extracted.itineraries.length > 0) {
            setItineraries(
              extracted.itineraries.map((itin, itinIdx) => ({
                name: itin.name || '',
                seqNo: itin.seqNo ?? itinIdx + 1,
                segments: itin.segments.map((seg, segIdx) => ({
                  seqNo: seg.seqNo ?? segIdx + 1,
                  modeOfJourney: seg.modeOfJourney || ModeOfJourney.FLIGHT,
                  carrierCode: seg.carrierCode || '',
                  serviceNumber: seg.serviceNumber || '',
                  depCode: seg.depCode || '',
                  arrCode: seg.arrCode || '',
                  depAt: fromISODate(seg.depAt, true),
                  arrAt: fromISODate(seg.arrAt, true),
                  classCode: seg.classCode || '',
                  baggage: seg.baggage || '',
                  hotelName: seg.hotelName || '',
                  hotelAddress: seg.hotelAddress || '',
                  checkIn: fromISODate(seg.checkIn, true),
                  checkOut: fromISODate(seg.checkOut, true),
                  roomType: seg.roomType || '',
                  mealPlan: seg.mealPlan || '',
                  operatorName: seg.operatorName || '',
                  boardingPoint: seg.boardingPoint || '',
                  dropPoint: seg.dropPoint || '',
                  misc: seg.misc || {},
                })),
              }))
            );
          }

          successToast('Ticket data extracted successfully');
          setProcessingComplete(true);
        } else {
          errorToast(response.message || 'Failed to extract ticket data');
        }
      } catch (error: any) {
        console.error('OCR extraction error:', error);
        errorToast(error?.message || 'Failed to process ticket');
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // ─── Form Field Handlers ─────────────────────────────────────────────────
  const setFormField = useCallback(
    <K extends keyof BookingFormStateV2>(key: K, value: BookingFormStateV2[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ─── Pax Handlers ────────────────────────────────────────────────────────
  const addPax = useCallback(() => {
    setPaxList((prev) => [...prev, createEmptyPax()]);
  }, []);

  const removePax = useCallback((index: number) => {
    setPaxList((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePax = useCallback(
    <K extends keyof PaxFormState>(index: number, key: K, value: PaxFormState[K]) => {
      setPaxList((prev) =>
        prev.map((p, i) => (i === index ? { ...p, [key]: value } : p))
      );
    },
    []
  );

  // ─── Itinerary Handlers ──────────────────────────────────────────────────
  const addItinerary = useCallback(() => {
    setItineraries((prev) => [
      ...prev,
      createEmptyItinerary(prev.length + 1),
    ]);
  }, []);

  const removeItinerary = useCallback((index: number) => {
    setItineraries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItinerary = useCallback(
    <K extends keyof ItineraryFormState>(
      index: number,
      key: K,
      value: ItineraryFormState[K]
    ) => {
      setItineraries((prev) =>
        prev.map((itin, i) => (i === index ? { ...itin, [key]: value } : itin))
      );
    },
    []
  );

  // ─── Segment Handlers ────────────────────────────────────────────────────
  const addSegment = useCallback((itineraryIndex: number) => {
    setItineraries((prev) =>
      prev.map((itin, i) => {
        if (i !== itineraryIndex) return itin;
        const newSeqNo = itin.segments.length + 1;
        return {
          ...itin,
          segments: [...itin.segments, createEmptySegment(newSeqNo)],
        };
      })
    );
  }, []);

  const removeSegment = useCallback((itineraryIndex: number, segmentIndex: number) => {
    setItineraries((prev) =>
      prev.map((itin, i) => {
        if (i !== itineraryIndex) return itin;
        return {
          ...itin,
          segments: itin.segments.filter((_, si) => si !== segmentIndex),
        };
      })
    );
  }, []);

  const updateSegment = useCallback(
    <K extends keyof SegmentFormState>(
      itineraryIndex: number,
      segmentIndex: number,
      key: K,
      value: SegmentFormState[K]
    ) => {
      setItineraries((prev) =>
        prev.map((itin, i) => {
          if (i !== itineraryIndex) return itin;
          return {
            ...itin,
            segments: itin.segments.map((seg, si) =>
              si === segmentIndex ? { ...seg, [key]: value } : seg
            ),
          };
        })
      );
    },
    []
  );

  const updateSegmentMisc = useCallback(
    (itineraryIndex: number, segmentIndex: number, miscKey: string, miscValue: any) => {
      setItineraries((prev) =>
        prev.map((itin, i) => {
          if (i !== itineraryIndex) return itin;
          return {
            ...itin,
            segments: itin.segments.map((seg, si) =>
              si === segmentIndex
                ? { ...seg, misc: { ...seg.misc, [miscKey]: miscValue } }
                : seg
            ),
          };
        })
      );
    },
    []
  );

  // ─── Customer Handlers ───────────────────────────────────────────────────
  const setNewCustomerField = useCallback(
    <K extends keyof NewCustomerData>(key: K, value: NewCustomerData[K]) => {
      setNewCustomerData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleAddNewCustomer = useCallback(async () => {
    if (!newCustomerData.full_name.trim()) {
      errorToast('Customer name is required');
      return;
    }

    try {
      await onAddCustomer(newCustomerData);
      successToast('Customer added successfully');
      setShowAddCustomer(false);
      setNewCustomerData({
        full_name: '',
        email: '',
        phone: '',
        address: '',
        passportNo: '',
        gstin: '',
      });
    } catch (error: any) {
      errorToast(error?.message || 'Failed to add customer');
    }
  }, [newCustomerData, onAddCustomer]);

  // ─── Submit Handler ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (isViewMode) return;

      // Validation
      if (!formData.customerId) {
        errorToast('Please select a customer');
        return;
      }

      if (!formData.currency) {
        errorToast('Currency is required');
        return;
      }

      const totalAmountNum = normalizeAmount(formData.totalAmount);
      if (totalAmountNum <= 0) {
        errorToast('Total amount must be greater than 0');
        return;
      }

      // Transform pax
      const paxDTOs = paxList.map(transformPaxToDTO).filter((p): p is PaxDTO => p !== null);
      if (paxDTOs.length === 0) {
        errorToast('At least one passenger is required');
        return;
      }

      // Transform itineraries (optional)
      const itineraryDTOs = itineraries
        .map(transformItineraryToDTO)
        .filter((i): i is ItineraryDTO => i !== null);

      // Build payload
      const payload: CreateBookingDTO = {
        customerId: formData.customerId,
        currency: formData.currency,
        totalAmount: totalAmountNum,
        pax: paxDTOs,
        itineraries: itineraryDTOs.length > 0 ? itineraryDTOs : undefined,
        bookingDate: toISODate(formData.bookingDate),
        packageName: formData.packageName.trim() || undefined,
        pnrNo: formData.pnrNo.trim() || undefined,
        modeOfJourney: formData.modeOfJourney.trim() || undefined,
        advanceAmount: normalizeAmount(formData.advanceAmount) || undefined,
        status: formData.status,
        vendorId: formData.vendorId.trim() || undefined,
      };

      setIsSubmitting(true);
      try {
        await onSubmitBooking(payload);
        successToast(`Booking ${isEditMode ? 'updated' : 'created'} successfully`);
        onCancel();
      } catch (error: any) {
        errorToast(error?.message || `Failed to ${isEditMode ? 'update' : 'create'} booking`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      paxList,
      itineraries,
      isEditMode,
      isViewMode,
      onSubmitBooking,
      onCancel,
    ]
  );

  // ─── Return Hook API ─────────────────────────────────────────────────────
  return {
    // State
    formData,
    paxList,
    itineraries,
    newCustomerData,
    ui: {
      isProcessing,
      processingComplete,
      uploadedFileName,
      showAddCustomer,
      isSubmitting,
    },

    // Computed
    totalAmount,
    advanceAmount,
    balance,
    customers,
    vendors,

    // Handlers
    setFormField,
    handleFileUpload,
    
    // Pax
    addPax,
    removePax,
    updatePax,
    
    // Itinerary
    addItinerary,
    removeItinerary,
    updateItinerary,
    
    // Segment
    addSegment,
    removeSegment,
    updateSegment,
    updateSegmentMisc,
    
    // Customer
    setNewCustomerField,
    handleAddNewCustomer,
    setShowAddCustomer,
    
    // Form
    handleSubmit,
  };
}
