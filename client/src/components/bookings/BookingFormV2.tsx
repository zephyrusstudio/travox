/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CheckCircle,
  ChevronDown,
  Loader,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useRef } from 'react';
import Button from '../ui/Button';
import {
  BookingStatus,
  CustomerLite,
  ModeOfJourney,
  NewCustomerData,
  PAXType,
  SEGMENT_FIELDS_BY_MODE,
  Sex,
  VendorLite,
} from './booking.v2.types';
import { useBookingFormV2 } from './useBookingFormV2';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FormMode = 'create' | 'edit' | 'view';

interface BookingFormV2Props {
  selectedBooking?: any | null;
  customers: CustomerLite[];
  vendors?: VendorLite[];
  onAddCustomer: (data: NewCustomerData) => void;
  onSubmitBooking: (payload: any) => Promise<any>;
  onCancel: () => void;
  mode?: FormMode;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Primitives
// ─────────────────────────────────────────────────────────────────────────────

const Labeled: React.FC<{
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
);

interface AccordionSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
  forceOpen?: boolean;
  disableContent?: boolean;
}

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
  const isControlled = typeof forceOpen === 'boolean';
  const isOpen = isControlled ? forceOpen : open;
  const contentId = React.useId();

  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-start justify-between gap-3 mb-4">
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
            <p className="text-base font-semibold text-gray-900">{title}</p>
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {actions ? <div className="flex-shrink-0">{actions}</div> : null}
      </div>
      {isOpen && (
        <div
          id={contentId}
          className="mt-4"
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

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const BookingFormV2: React.FC<BookingFormV2Props> = ({
  selectedBooking,
  customers,
  vendors = [],
  onAddCustomer,
  onSubmitBooking,
  onCancel,
  mode = 'create',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const readOnlySectionProps = isViewMode
    ? { disableContent: true, forceOpen: true }
    : {};

  const {
    formData,
    paxList,
    itineraries,
    ui,
    balance,
    setFormField,
    handleFileUpload,
    addPax,
    removePax,
    updatePax,
    addItinerary,
    removeItinerary,
    updateItinerary,
    addSegment,
    removeSegment,
    updateSegment,
    updateSegmentMisc,
    handleSubmit,
  } = useBookingFormV2({
    selectedBooking,
    customers,
    vendors,
    onAddCustomer,
    onSubmitBooking,
    onCancel,
    mode,
  });

  return (
    <div className="space-y-6">
      {/* File Upload Area (only for create mode) */}
      {!selectedBooking && !ui.processingComplete && (
        <div
          className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
            ui.isProcessing
              ? 'border-blue-400 bg-blue-50 py-6'
              : ui.uploadedFileName
              ? 'border-green-400 bg-green-50 py-6'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 py-12'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              const event = {
                target: { files },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleFileUpload(event);
            }
          }}
        >
          <div className="text-center">
            {ui.isProcessing ? (
              <>
                <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-blue-900 mb-1">
                  Processing Ticket...
                </h3>
                <p className="text-sm text-blue-700">
                  This will only take a few moments. Do not close this window.
                </p>
              </>
            ) : ui.uploadedFileName ? (
              <>
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-1">
                  File Uploaded
                </h3>
                <p className="text-sm text-green-700 flex items-center justify-center gap-2">
                  {ui.uploadedFileName}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Ticket PDF/Image
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Drag and drop your ticket here, or click to browse
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
                  icon={Upload}
                  className="mx-auto"
                >
                  Choose File
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Booking Information */}
        <AccordionSection
          title="Booking Information"
          description="Core booking details"
          defaultOpen={true}
          {...readOnlySectionProps}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Labeled label="Customer" required>
              <select
                value={formData.customerId}
                onChange={(e) => setFormField('customerId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </Labeled>

            <Labeled label="Booking Date" required>
              <input
                type="date"
                value={formData.bookingDate}
                onChange={(e) => setFormField('bookingDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </Labeled>

            <Labeled label="PNR Number">
              <input
                type="text"
                value={formData.pnrNo}
                onChange={(e) => setFormField('pnrNo', e.target.value)}
                placeholder="e.g., ABC123"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Labeled>

            <Labeled label="Package Name">
              <input
                type="text"
                value={formData.packageName}
                onChange={(e) => setFormField('packageName', e.target.value)}
                placeholder="e.g., Goa Beach Tour"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Labeled>

            <Labeled label="Mode of Journey">
              <select
                value={formData.modeOfJourney}
                onChange={(e) => setFormField('modeOfJourney', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Mode</option>
                {Object.values(ModeOfJourney).map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </Labeled>

            <Labeled label="Status" required>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormField('status', e.target.value as BookingStatus)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.values(BookingStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Labeled>

            <Labeled label="Vendor">
              <select
                value={formData.vendorId}
                onChange={(e) => setFormField('vendorId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Labeled>
          </div>
        </AccordionSection>

        {/* Financial Information */}
        <AccordionSection
          title="Financial Details"
          description="Amounts and currency"
          defaultOpen={true}
          {...readOnlySectionProps}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Labeled label="Currency" required>
              <select
                value={formData.currency}
                onChange={(e) => setFormField('currency', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </Labeled>

            <Labeled label="Total Amount" required>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.totalAmount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setFormField('totalAmount', value ? Math.ceil(value) : '');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </Labeled>

            <Labeled label="Advance Amount">
              <input
                type="number"
                min="0"
                step="1"
                value={formData.advanceAmount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setFormField('advanceAmount', value ? Math.ceil(value) : '');
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Labeled>

            <Labeled label="Balance">
              <input
                type="text"
                value={balance}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
              />
            </Labeled>
          </div>
        </AccordionSection>

        {/* Passengers */}
        <AccordionSection
          title="Passengers"
          description="Add passenger details"
          defaultOpen={true}
          {...readOnlySectionProps}
          actions={
            !isViewMode && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={Plus}
                onClick={addPax}
              >
                Add
              </Button>
            )
          }
        >
          {paxList.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No passengers added yet</p>
          ) : (
            <div className="space-y-3">
              {paxList.map((pax, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Passenger {idx + 1}
                    </span>
                    {!isViewMode && paxList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePax(idx)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Labeled label="Name" required>
                      <input
                        type="text"
                        value={pax.paxName}
                        onChange={(e) => updatePax(idx, 'paxName', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </Labeled>

                    <Labeled label="Type" required>
                      <select
                        value={pax.paxType}
                        onChange={(e) =>
                          updatePax(idx, 'paxType', e.target.value as PAXType)
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select</option>
                        {Object.values(PAXType).map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </Labeled>

                    <Labeled label="Sex">
                      <select
                        value={pax.sex}
                        onChange={(e) =>
                          updatePax(idx, 'sex', e.target.value as Sex)
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        {Object.values(Sex).map((sexOption) => (
                          <option key={sexOption} value={sexOption}>
                            {sexOption}
                          </option>
                        ))}
                      </select>
                    </Labeled>

                    <Labeled label="Passport No">
                      <input
                        type="text"
                        value={pax.passportNo}
                        onChange={(e) => updatePax(idx, 'passportNo', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Labeled>

                    <Labeled label="Date of Birth">
                      <input
                        type="date"
                        value={pax.dob}
                        onChange={(e) => updatePax(idx, 'dob', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Labeled>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AccordionSection>

        {/* Itineraries */}
        <AccordionSection
          title="Itineraries"
          description="Travel segments and routes"
          defaultOpen={false}
          {...readOnlySectionProps}
          actions={
            !isViewMode && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={Plus}
                onClick={addItinerary}
              >
                Add Itinerary
              </Button>
            )
          }
        >
          {itineraries.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No itineraries added yet
            </p>
          ) : (
            <div className="space-y-4">
              {itineraries.map((itin, itinIdx) => (
                <div
                  key={itinIdx}
                  className="rounded-lg border border-gray-300 bg-white p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-800">
                      Itinerary {itinIdx + 1}
                    </span>
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={() => removeItinerary(itinIdx)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <Labeled label="Name" required>
                      <input
                        type="text"
                        value={itin.name}
                        onChange={(e) =>
                          updateItinerary(itinIdx, 'name', e.target.value)
                        }
                        placeholder="e.g., Outbound Journey"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </Labeled>

                    <Labeled label="Sequence No" required>
                      <input
                        type="number"
                        min="1"
                        value={itin.seqNo}
                        onChange={(e) =>
                          updateItinerary(
                            itinIdx,
                            'seqNo',
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </Labeled>
                  </div>

                  {/* Segments */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">
                        Segments
                      </h4>
                      {!isViewMode && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          icon={Plus}
                          onClick={() => addSegment(itinIdx)}
                        >
                          Add Segment
                        </Button>
                      )}
                    </div>

                    {itin.segments.map((seg, segIdx) => (
                      <SegmentEditor
                        key={segIdx}
                        segment={seg}
                        segmentIndex={segIdx}
                        itineraryIndex={itinIdx}
                        isViewMode={isViewMode}
                        onRemove={() => removeSegment(itinIdx, segIdx)}
                        onUpdate={(key, value) =>
                          updateSegment(itinIdx, segIdx, key as any, value)
                        }
                        onUpdateMisc={(miscKey, miscValue) =>
                          updateSegmentMisc(itinIdx, segIdx, miscKey, miscValue)
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AccordionSection>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {!isViewMode && (
            <Button type="submit" disabled={ui.isSubmitting}>
              {ui.isSubmitting
                ? 'Saving...'
                : isEditMode
                ? 'Update Booking'
                : 'Create Booking'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Segment Editor Component
// ─────────────────────────────────────────────────────────────────────────────

interface SegmentEditorProps {
  segment: any;
  segmentIndex: number;
  itineraryIndex: number;
  isViewMode: boolean;
  onRemove: () => void;
  onUpdate: (key: string, value: any) => void;
  onUpdateMisc: (miscKey: string, miscValue: any) => void;
}

const SegmentEditor: React.FC<SegmentEditorProps> = ({
  segment,
  segmentIndex,
  isViewMode,
  onRemove,
  onUpdate,
}) => {
  const mode = segment.modeOfJourney as ModeOfJourney;
  const fieldsConfig = SEGMENT_FIELDS_BY_MODE[mode] || {
    required: [],
    visible: [],
  };

  const isFieldVisible = (field: string) =>
    fieldsConfig.visible.includes(field as any);
  const isFieldRequired = (field: string) =>
    fieldsConfig.required.includes(field as any);

  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-600">
          Segment {segmentIndex + 1}
        </span>
        {!isViewMode && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Labeled label="Mode" required>
          <select
            value={segment.modeOfJourney}
            onChange={(e) => onUpdate('modeOfJourney', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          >
            <option value="">Select</option>
            {Object.values(ModeOfJourney).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Labeled>

        <Labeled label="Seq No" required>
          <input
            type="number"
            min="1"
            value={segment.seqNo}
            onChange={(e) => onUpdate('seqNo', parseInt(e.target.value) || 1)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </Labeled>

        {/* Conditional Fields based on Mode */}
        {isFieldVisible('carrierCode') && (
          <Labeled label="Carrier Code" required={isFieldRequired('carrierCode')}>
            <input
              type="text"
              value={segment.carrierCode}
              onChange={(e) => onUpdate('carrierCode', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('serviceNumber') && (
          <Labeled label="Service No" required={isFieldRequired('serviceNumber')}>
            <input
              type="text"
              value={segment.serviceNumber}
              onChange={(e) => onUpdate('serviceNumber', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('depCode') && (
          <Labeled label="Departure" required={isFieldRequired('depCode')}>
            <input
              type="text"
              value={segment.depCode}
              onChange={(e) => onUpdate('depCode', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('arrCode') && (
          <Labeled label="Arrival" required={isFieldRequired('arrCode')}>
            <input
              type="text"
              value={segment.arrCode}
              onChange={(e) => onUpdate('arrCode', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('depAt') && (
          <Labeled label="Dep At" required={isFieldRequired('depAt')}>
            <input
              type="datetime-local"
              value={segment.depAt}
              onChange={(e) => onUpdate('depAt', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('arrAt') && (
          <Labeled label="Arr At" required={isFieldRequired('arrAt')}>
            <input
              type="datetime-local"
              value={segment.arrAt}
              onChange={(e) => onUpdate('arrAt', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('classCode') && (
          <Labeled label="Class" required={isFieldRequired('classCode')}>
            <input
              type="text"
              value={segment.classCode}
              onChange={(e) => onUpdate('classCode', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('baggage') && (
          <Labeled label="Baggage" required={isFieldRequired('baggage')}>
            <input
              type="text"
              value={segment.baggage}
              onChange={(e) => onUpdate('baggage', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('hotelName') && (
          <Labeled label="Hotel Name" required={isFieldRequired('hotelName')}>
            <input
              type="text"
              value={segment.hotelName}
              onChange={(e) => onUpdate('hotelName', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('hotelAddress') && (
          <Labeled label="Hotel Address" required={isFieldRequired('hotelAddress')}>
            <input
              type="text"
              value={segment.hotelAddress}
              onChange={(e) => onUpdate('hotelAddress', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('checkIn') && (
          <Labeled label="Check In" required={isFieldRequired('checkIn')}>
            <input
              type="datetime-local"
              value={segment.checkIn}
              onChange={(e) => onUpdate('checkIn', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('checkOut') && (
          <Labeled label="Check Out" required={isFieldRequired('checkOut')}>
            <input
              type="datetime-local"
              value={segment.checkOut}
              onChange={(e) => onUpdate('checkOut', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('roomType') && (
          <Labeled label="Room Type" required={isFieldRequired('roomType')}>
            <input
              type="text"
              value={segment.roomType}
              onChange={(e) => onUpdate('roomType', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('mealPlan') && (
          <Labeled label="Meal Plan" required={isFieldRequired('mealPlan')}>
            <input
              type="text"
              value={segment.mealPlan}
              onChange={(e) => onUpdate('mealPlan', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('operatorName') && (
          <Labeled label="Operator" required={isFieldRequired('operatorName')}>
            <input
              type="text"
              value={segment.operatorName}
              onChange={(e) => onUpdate('operatorName', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('boardingPoint') && (
          <Labeled label="Boarding Point" required={isFieldRequired('boardingPoint')}>
            <input
              type="text"
              value={segment.boardingPoint}
              onChange={(e) => onUpdate('boardingPoint', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}

        {isFieldVisible('dropPoint') && (
          <Labeled label="Drop Point" required={isFieldRequired('dropPoint')}>
            <input
              type="text"
              value={segment.dropPoint}
              onChange={(e) => onUpdate('dropPoint', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </Labeled>
        )}
      </div>

      {/* Misc Fields (JSON) */}
      {isFieldVisible('misc') && (
        <div className="mt-3">
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
              Additional Fields (JSON)
            </summary>
            <textarea
              value={JSON.stringify(segment.misc, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  onUpdate('misc', parsed);
                } catch {
                  // Invalid JSON - ignore
                }
              }}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs mt-2 font-mono"
              rows={3}
            />
          </details>
        </div>
      )}
    </div>
  );
};

export default BookingFormV2;
