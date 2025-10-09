/* eslint-disable @typescript-eslint/no-explicit-any */
import { Bot, CheckCircle, Loader, Upload, X } from "lucide-react";
import React, { useRef } from "react";
import Button from "../ui/Button";
import {
  BookingStatus,
  CustomerLite,
  NewCustomerData,
  TravelCategory,
} from "./booking.types";
import { useBookingForm } from "./useBookingForm";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type Props = {
  selectedBooking: any | null; // keep as any to avoid leaking app-specific shape
  customers: CustomerLite[];
  onAddCustomer: (c: NewCustomerData) => void;
  onSubmitBooking: (payload: any) => Promise<any> | any; // app's booking shape
  onCancel: () => void;
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

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

const BookingForm: React.FC<Props> = (props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    // state
    aiData,
    formData,
    newCustomerData,
    ui,
    // derived
    balance,
    // handlers
    handleFileUpload,
    handleCustomerSelect,
    setAiData,
    setFormField,
    setNewCustomerField,
    addPassenger,
    removePassenger,
    updatePassenger,
    handleAddNewCustomer,
    handleSubmit,
  } = useBookingForm(props);

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
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">
              AI Extracted Data (Editable)
            </h4>
            {ui.processingComplete && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
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
              {aiData.paxList.map((pax, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <input
                    type="text"
                    value={pax.name}
                    onChange={(e) =>
                      updatePassenger(index, "name", e.target.value)
                    }
                    placeholder="Passenger name"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={pax.age || ""}
                    onChange={(e) =>
                      updatePassenger(
                        index,
                        "age",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    placeholder="Age"
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={pax.gender || ""}
                    onChange={(e) =>
                      updatePassenger(index, "gender", e.target.value)
                    }
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={pax.isPrimary}
                      onChange={(e) =>
                        updatePassenger(index, "isPrimary", e.target.checked)
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Primary</span>
                  </label>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={X}
                    onClick={() => removePassenger(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-4">
            Manual Data Entry
          </h4>

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
                    <Labeled label="Email">
                      <input
                        type="email"
                        value={newCustomerData.email}
                        onChange={(e) =>
                          setNewCustomerField("email", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </Labeled>
                    <Labeled label="Phone">
                      <input
                        type="tel"
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
              <Labeled label="Number of Passengers *">
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.pax_count}
                  onChange={(e) =>
                    setFormField("pax_count", parseInt(e.target.value))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Labeled>
              <Labeled label="Total Amount *">
                <input
                  type="number"
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
              <Labeled label="Advance Received">
                <input
                  type="number"
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
              <Labeled label="Status *">
                <select
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormField("status", e.target.value as BookingStatus)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={BookingStatus.Pending}>Pending</option>
                  <option value={BookingStatus.Confirmed}>Confirmed</option>
                  <option value={BookingStatus.Cancelled}>Cancelled</option>
                </select>
              </Labeled>
            </div>
          </div>
        </div>

        {formData.total_amount > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Payment Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className="font-semibold">
                  ₹{formData.total_amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Advance Received</p>
                <p className="font-semibold text-green-600">
                  ₹{formData.advance_received.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Balance Amount</p>
                <p className="font-semibold text-red-600">
                  ₹{balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={props.onCancel}>
            Cancel
          </Button>
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
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
