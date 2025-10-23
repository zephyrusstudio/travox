/* eslint-disable @typescript-eslint/no-explicit-any */
import { Bot, CheckCircle, ChevronDown, Loader, Upload, X } from "lucide-react";
import React, { useRef } from "react";
import Button from "../ui/Button";
import {
  BookingStatus,
  CustomerLite,
  ModeOfJourneyOption,
  NewCustomerData,
  PaxTypeOption,
  TravelCategory,
} from "./booking.types";
import { useBookingForm } from "./useBookingForm";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type FormMode = "create" | "edit" | "view";

type Props = {
  selectedBooking: any | null; // keep as any to avoid leaking app-specific shape
  customers: CustomerLite[];
  onAddCustomer: (c: NewCustomerData) => void;
  onSubmitBooking: (payload: any) => Promise<any> | any; // app's booking shape
  onCancel: () => void;
  mode?: FormMode;
};

// ──────────────────────────────────────────────────────────────────────────────
// Small UI primitives
// ──────────────────────────────────────────────────────────────────────────────

const Labeled: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    {children}
  </div>
);

type AccordionSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
  forceOpen?: boolean;
  disableContent?: boolean;
};

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  description,
  defaultOpen = false,
  actions,
  children,
  forceOpen,
  disableContent = false,
}) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const isControlled = typeof forceOpen === "boolean";
  const isOpen = isControlled ? forceOpen : open;
  const contentId = React.useId();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => {
            if (isControlled) return;
            setOpen((prev) => !prev);
          }}
          className="flex flex-1 items-center justify-between text-left focus:outline-none"
          aria-expanded={isOpen}
          aria-controls={contentId}
          disabled={isControlled}
        >
          <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {description && (
              <p className="mt-1 text-xs text-gray-500">{description}</p>
            )}
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-500 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {actions ? <div className="flex-shrink-0">{actions}</div> : null}
      </div>
      {isOpen && (
        <div
          id={contentId}
          className="border-t border-gray-100 bg-gray-50 px-4 py-4"
        >
          <fieldset
            disabled={disableContent}
            className="space-y-4 border-0 p-0 m-0"
          >
            {children}
          </fieldset>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

const BookingForm: React.FC<Props> = (props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const computedMode: FormMode =
    props.mode ?? (props.selectedBooking ? "edit" : "create");
  const isViewMode = computedMode === "view";
  const readOnlySectionProps = isViewMode
    ? { disableContent: true, forceOpen: true }
    : {};

  const {
    // state
    aiData,
    formData,
    newCustomerData,
    passengers,
    itineraries,
    ui,
    // derived
    balance,
    // handlers
    handleFileUpload,
    handleCustomerSelect,
    setAiData,
    setFormField,
    setNewCustomerField,
    setExtractionMetadataField,
    addExtractionField,
    updateExtractionField,
    removeExtractionField,
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
  } = useBookingForm({
    selectedBooking: props.selectedBooking,
    customers: props.customers,
    onAddCustomer: props.onAddCustomer,
    onSubmitBooking: props.onSubmitBooking,
    onCancel: props.onCancel,
    mode: computedMode,
  });

  const handleFormSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      if (isViewMode) {
        event.preventDefault();
        return;
      }
      handleSubmit(event);
    },
    [handleSubmit, isViewMode]
  );

  return (
    <div className="space-y-6">
      {!props.selectedBooking && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Ticket PDF/Image
            </h3>
            <p className="text-gray-600 mb-4">
              Upload a ticket to auto-extract booking information
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={ui.isProcessing}
              icon={ui.isProcessing ? Loader : Upload}
            >
              {ui.isProcessing ? "Processing..." : "Choose File"}
            </Button>
            {ui.uploadedFileName && (
              <p className="text-sm text-gray-600 mt-2">
                Uploaded: {ui.uploadedFileName}
              </p>
            )}
          </div>
        </div>
      )}

      {ui.isProcessing && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            <div>
              <h4 className="font-semibold text-blue-900">
                Processing Ticket...
              </h4>
              <p className="text-sm text-blue-700">
                AI is extracting booking information from your ticket
              </p>
            </div>
          </div>
        </div>
      )}

      {!props.selectedBooking && (
        <AccordionSection
          title="AI Extracted Data"
          description="Review and adjust the values pulled from the uploaded ticket."
          defaultOpen={ui.isProcessing || ui.processingComplete}
          {...readOnlySectionProps}
          actions={
            ui.processingComplete ? (
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Ready
              </span>
            ) : null
          }
        >
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span>
                AI drafts these fields for you. Update anything that looks off
                before saving.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Labeled label="PNR">
              <input
                type="text"
                value={aiData.pnr}
                onChange={(e) => setAiData({ pnr: e.target.value })}
                placeholder="Enter PNR"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Labeled>
            <Labeled label="Route">
              <input
                type="text"
                value={aiData.route}
                onChange={(e) => setAiData({ route: e.target.value })}
                placeholder="e.g., DEL-BOM"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Labeled>
            <Labeled label="Airline">
              <input
                type="text"
                value={aiData.airline}
                onChange={(e) => setAiData({ airline: e.target.value })}
                placeholder="e.g., Air India"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Labeled>
            <Labeled label="Flight Number">
              <input
                type="text"
                value={aiData.flightNumber}
                onChange={(e) => setAiData({ flightNumber: e.target.value })}
                placeholder="e.g., AI 131"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Labeled>
            <Labeled label="Journey Date">
              <input
                type="date"
                value={aiData.journeyDate}
                onChange={(e) => setAiData({ journeyDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Labeled>
            <Labeled label="Journey Time">
              <input
                type="time"
                required
                value={aiData.journeyTime}
                onChange={(e) => setAiData({ journeyTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Labeled>
            <Labeled label="Return Date">
              <input
                type="date"
                value={aiData.returnDate}
                onChange={(e) => setAiData({ returnDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Labeled>
            <Labeled label="Travel Category">
              <select
                value={aiData.travelCategory}
                onChange={(e) =>
                  setAiData({
                    travelCategory: e.target.value as TravelCategory,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={TravelCategory.Domestic}>Domestic</option>
                <option value={TravelCategory.International}>
                  International
                </option>
                <option value={TravelCategory.Corporate}>Corporate</option>
              </select>
            </Labeled>
            <Labeled label="Booking Amount">
              <input
                type="number"
                step="0.01"
                value={aiData.bookingAmount}
                onChange={(e) =>
                  setAiData({ bookingAmount: parseFloat(e.target.value) || 0 })
                }
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Labeled>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900">Passenger List</h5>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPassenger}
              >
                Add Passenger
              </Button>
            </div>

            <div className="space-y-3">
              {passengers.map((pax, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Passenger {index + 1}
                    </span>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={pax.isPrimary}
                          onChange={(e) =>
                            updatePassenger(
                              index,
                              "isPrimary",
                              e.target.checked
                            )
                          }
                          className="rounded"
                        />
                        <span>Primary</span>
                      </label>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        icon={X}
                        onClick={() => removePassenger(index)}
                        aria-label={`Remove passenger ${index + 1}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={pax.name}
                      onChange={(e) =>
                        updatePassenger(index, "name", e.target.value)
                      }
                      placeholder="Passenger name"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={pax.paxType || ""}
                      onChange={(e) =>
                        updatePassenger(
                          index,
                          "paxType",
                          e.target.value as PaxTypeOption
                        )
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.values(PaxTypeOption).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={pax.passportNo || ""}
                      onChange={(e) =>
                        updatePassenger(index, "passportNo", e.target.value)
                      }
                      placeholder="Passport Number"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="date"
                      value={pax.dob || ""}
                      onChange={(e) =>
                        updatePassenger(index, "dob", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={pax.age ?? ""}
                      onChange={(e) =>
                        updatePassenger(index, "age", e.target.value)
                      }
                      placeholder="Age"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={pax.gender || ""}
                      onChange={(e) =>
                        updatePassenger(index, "gender", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="text"
                      value={pax.isPrimary ? "Primary" : "Secondary"}
                      readOnly
                      className="border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-gray-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AccordionSection>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <AccordionSection
          title="Customer & Booking"
          description="Select the traveller and fill in the core booking information."
          defaultOpen
          {...readOnlySectionProps}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              {!ui.showAddCustomer ? (
                <div className="flex space-x-2">
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Customer</option>
                    {props.customers.map((c) => (
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.full_name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ui.toggleAddCustomer}
                  >
                    Add New
                  </Button>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">
                      Add New Customer
                    </h5>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={X}
                      onClick={ui.toggleAddCustomer}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Labeled label="Full Name *">
                      <input
                        type="text"
                        required
                        value={newCustomerData.full_name}
                        onChange={(e) =>
                          setNewCustomerField("full_name", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Labeled>
                    <Labeled label="Email *">
                      <input
                        type="email"
                        required
                        value={newCustomerData.email}
                        onChange={(e) =>
                          setNewCustomerField("email", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Labeled>
                    <Labeled label="Phone *">
                      <input
                        type="tel"
                        placeholder="Eg. 1234567890"
                        required
                        maxLength={10}
                        value={newCustomerData.phone}
                        onChange={(e) =>
                          setNewCustomerField("phone", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Labeled>
                    <Labeled label="Passport Number">
                      <input
                        type="text"
                        value={newCustomerData.passportNo}
                        onChange={(e) =>
                          setNewCustomerField("passportNo", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Labeled>
                  </div>

                  <div className="mt-3">
                    <Button
                      type="button"
                      onClick={handleAddNewCustomer}
                      size="sm"
                      disabled={
                        !newCustomerData.full_name.trim() ||
                        !newCustomerData.email.trim() ||
                        !newCustomerData.phone.trim()
                      }
                    >
                      Add Customer
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Labeled label="Package Name *">
                <input
                  type="text"
                  required
                  value={formData.package_name}
                  onChange={(e) => setFormField("package_name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Labeled>
              <Labeled label="PNR Number">
                <input
                  type="text"
                  value={formData.pnr_no}
                  onChange={(e) => setFormField("pnr_no", e.target.value)}
                  placeholder="Enter PNR / Reference"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Labeled>
              <Labeled label="Booking Date *">
                <input
                  type="date"
                  required
                  value={formData.booking_date}
                  onChange={(e) => setFormField("booking_date", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Labeled>
              <Labeled label="Travel Start Date *">
                <input
                  type="date"
                  required
                  value={formData.travel_start_date}
                  onChange={(e) =>
                    setFormField("travel_start_date", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Labeled>
              <Labeled label="Travel End Date *">
                <input
                  type="date"
                  required
                  value={formData.travel_end_date}
                  onChange={(e) =>
                    setFormField("travel_end_date", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Labeled>
              <Labeled label="Status">
                <select
                  value={formData.status}
                  onChange={(e) => setFormField("status", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value={BookingStatus.DRAFT}>{BookingStatus.DRAFT}</option>
                  <option value={BookingStatus.CONFIRMED}>{BookingStatus.CONFIRMED}</option>
                  <option value={BookingStatus.TICKETED}>{BookingStatus.TICKETED}</option>
                  <option value={BookingStatus.IN_PROGRESS}>{BookingStatus.IN_PROGRESS}</option>
                  <option value={BookingStatus.COMPLETED}>{BookingStatus.COMPLETED}</option>
                  <option value={BookingStatus.CANCELLED}>{BookingStatus.CANCELLED}</option>
                  <option value={BookingStatus.REFUNDED}>{BookingStatus.REFUNDED}</option>
                </select>
              </Labeled>
              <Labeled label="Mode of Journey *">
                <select
                  required
                  value={formData.mode_of_journey}
                  onChange={(e) =>
                    setFormField(
                      "mode_of_journey",
                      e.target.value as ModeOfJourneyOption
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(ModeOfJourneyOption).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Labeled>
              <Labeled label="Currency">
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormField("currency", e.target.value)}
                  placeholder="INR"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Labeled>
              <Labeled label="Number of Passengers">
                <input
                  type="number"
                  value={passengers.length}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-gray-600"
                />
              </Labeled>
              <Labeled label="Total Amount *">
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0}
                  value={formData.total_amount}
                  onChange={(e) =>
                    setFormField(
                      "total_amount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Labeled>
              <Labeled label="Paid Amount">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={formData.total_amount}
                  value={formData.advance_received}
                  onChange={(e) =>
                    setFormField(
                      "advance_received",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Labeled>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title={`Itineraries & Segments${
            itineraries.length ? ` (${itineraries.length})` : ""
          }`}
          description="Organise trip legs and services. Add more itineraries as needed."
          defaultOpen={Boolean(itineraries.length)}
          {...readOnlySectionProps}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItinerary}
              disabled={isViewMode}
            >
              Add Itinerary
            </Button>
          }
        >
          <div className="space-y-4">
            {itineraries.length === 0 ? (
              <p className="text-sm text-gray-500">
                No itineraries yet. Use &ldquo;Add Itinerary&rdquo; to start
                building the plan.
              </p>
            ) : (
              itineraries.map((itinerary, itineraryIdx) => (
                <div
                  key={`itinerary-${itineraryIdx}`}
                  className="space-y-4 rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-3">
                      <Labeled label="Itinerary Name">
                        <input
                          type="text"
                          value={itinerary.name}
                          onChange={(e) =>
                            updateItineraryField(
                              itineraryIdx,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="e.g. Keys Select Bengaluru Stay"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </Labeled>
                      <Labeled label="Sequence #">
                        <input
                          type="number"
                          min={1}
                          value={itinerary.seqNo}
                          onChange={(e) =>
                            updateItineraryField(
                              itineraryIdx,
                              "seqNo",
                              Number(e.target.value)
                            )
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </Labeled>
                    </div>
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={X}
                        onClick={() => removeItinerary(itineraryIdx)}
                      >
                        Remove Itinerary
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {itinerary.segments.map((segment, segmentIdx) => (
                      <div
                        key={`segment-${itineraryIdx}-${segmentIdx}`}
                        className="space-y-3 rounded-md border border-gray-100 bg-gray-50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Segment {segmentIdx + 1}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Labeled label="Sequence #">
                            <input
                              type="number"
                              min={1}
                              value={segment.seqNo}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "seqNo",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Mode of Journey">
                            <select
                              value={segment.modeOfJourney}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "modeOfJourney",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {Object.values(ModeOfJourneyOption).map(
                                (option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                )
                              )}
                            </select>
                          </Labeled>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Labeled label="Carrier Code">
                            <input
                              type="text"
                              value={segment.carrierCode}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "carrierCode",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Service Number">
                            <input
                              type="text"
                              value={segment.serviceNumber}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "serviceNumber",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Class Code">
                            <input
                              type="text"
                              value={segment.classCode}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "classCode",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Labeled label="Departure Code">
                            <input
                              type="text"
                              value={segment.depCode}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "depCode",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Departure At">
                            <input
                              type="text"
                              value={segment.depAt}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "depAt",
                                  e.target.value
                                )
                              }
                              placeholder="YYYY-MM-DD HH:mm"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Arrival Code">
                            <input
                              type="text"
                              value={segment.arrCode}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "arrCode",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Labeled label="Arrival At">
                            <input
                              type="text"
                              value={segment.arrAt}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "arrAt",
                                  e.target.value
                                )
                              }
                              placeholder="YYYY-MM-DD HH:mm"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Baggage">
                            <input
                              type="text"
                              value={segment.baggage}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "baggage",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Operator Name">
                            <input
                              type="text"
                              value={segment.operatorName}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "operatorName",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Labeled label="Boarding Point">
                            <input
                              type="text"
                              value={segment.boardingPoint}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "boardingPoint",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Drop Point">
                            <input
                              type="text"
                              value={segment.dropPoint}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "dropPoint",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Room Type">
                            <input
                              type="text"
                              value={segment.roomType}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "roomType",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Labeled label="Hotel Name">
                            <input
                              type="text"
                              value={segment.hotelName}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "hotelName",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Meal Plan">
                            <input
                              type="text"
                              value={segment.mealPlan}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "mealPlan",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                        </div>

                        <Labeled label="Hotel Address">
                          <textarea
                            value={segment.hotelAddress}
                            onChange={(e) =>
                              updateSegmentField(
                                itineraryIdx,
                                segmentIdx,
                                "hotelAddress",
                                e.target.value
                              )
                            }
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </Labeled>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Labeled label="Check In">
                            <input
                              type="date"
                              value={segment.checkIn || ""}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "checkIn",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Check Out">
                            <input
                              type="date"
                              value={segment.checkOut || ""}
                              onChange={(e) =>
                                updateSegmentField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "checkOut",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Labeled label="Total Rooms">
                            <input
                              type="number"
                              min={0}
                              value={segment.misc.totalRooms ?? ""}
                              onChange={(e) =>
                                updateSegmentMiscField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "totalRooms",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Total Guests">
                            <input
                              type="text"
                              value={segment.misc.totalGuests || ""}
                              onChange={(e) =>
                                updateSegmentMiscField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "totalGuests",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                          <Labeled label="Total Nights">
                            <input
                              type="number"
                              min={0}
                              value={segment.misc.totalNights ?? ""}
                              onChange={(e) =>
                                updateSegmentMiscField(
                                  itineraryIdx,
                                  segmentIdx,
                                  "totalNights",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </Labeled>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSegment(itineraryIdx)}
                      disabled={isViewMode}
                    >
                      Add Segment
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </AccordionSection>

        {formData.total_amount > 0 && (
          <AccordionSection
            title="Payment Summary"
            description="Quick snapshot of what is due for this booking."
            defaultOpen
            {...readOnlySectionProps}
          >
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className="font-semibold">
                  {(formData.currency || "INR") +
                    " " +
                    formData.total_amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Paid Amount</p>
                <p className="font-semibold text-green-600">
                  {(formData.currency || "INR") +
                    " " +
                    formData.advance_received.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Balance Amount</p>
                <p className="font-semibold text-red-600">
                  {(formData.currency || "INR") +
                    " " +
                    balance.toLocaleString()}
                </p>
              </div>
            </div>
          </AccordionSection>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={props.onCancel}>
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && (
            <Button
              type="submit"
              disabled={!formData.customer_id || ui.isSubmitting}
            >
              {ui.isSubmitting
                ? props.selectedBooking
                  ? "Updating..."
                  : "Saving..."
                : props.selectedBooking
                ? "Update Booking"
                : "Add Booking"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
