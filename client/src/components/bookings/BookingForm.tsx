// components/bookings/BookingForm.tsx
import { Bot, CheckCircle, Loader, Upload, X } from "lucide-react";
import React, { useRef, useState } from "react";
import { Booking } from "../../types";
import Button from "../ui/Button";
import {
  AIDataState,
  BookingFormState,
  BookingStatus,
  CustomerLite,
  ExtractedData,
  Gender,
  NewCustomerData,
  TravelCategory,
} from "./booking.types";

type Props = {
  selectedBooking: Booking | null;
  customers: CustomerLite[];
  onAddCustomer: (c: NewCustomerData) => void;
  onSubmitBooking: (payload: any) => void; // uses app’s booking shape
  onCancel: () => void;
};

const BookingForm: React.FC<Props> = ({
  selectedBooking,
  customers,
  onAddCustomer,
  onSubmitBooking,
  onCancel,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const [aiData, setAiData] = useState<AIDataState>({
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

  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    passportNo: "",
    gstin: "",
  });

  const extractDataFromFile = async (file: File): Promise<ExtractedData> => {
    await new Promise((r) => setTimeout(r, 3000));
    return {
      paxList: [
        { name: "John Doe", age: 35, gender: Gender.Male, isPrimary: true },
        { name: "Jane Doe", age: 32, gender: Gender.Female, isPrimary: false },
      ],
      bookingDate: new Date().toISOString().split("T")[0],
      journeyDate: new Date(Date.now() + 7 * 864e5).toISOString().split("T")[0],
      journeyTime: "10:30",
      returnDate: new Date(Date.now() + 14 * 864e5).toISOString().split("T")[0],
      pnr: "ABC123",
      bookingAmount: 45000,
      travelCategory: TravelCategory.International,
      airline: "Air India",
      flightNumber: "AI 131",
      route: "DEL-LHR",
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("pdf") && !file.type.includes("image")) {
      alert("Please upload only PDF files or images");
      return;
    }
    setUploadedFile(file);
    setIsProcessing(true);
    setProcessingComplete(false);
    try {
      const extracted = await extractDataFromFile(file);
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
        package_name: `${extracted.route} - ${extracted.travelCategory} Trip`,
        booking_date: extracted.bookingDate,
        travel_start_date: extracted.journeyDate,
        travel_end_date: extracted.returnDate || extracted.journeyDate,
        pax_count: extracted.paxList.length,
        total_amount: extracted.bookingAmount,
      }));
      setProcessingComplete(true);
    } catch {
      alert("Error processing file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.customer_id === customerId);
    if (!customer) return;
    setFormData((s) => ({
      ...s,
      customer_id: customerId,
      customer_name: customer.full_name,
    }));
  };

  const addPassenger = () =>
    setAiData((s) => ({
      ...s,
      paxList: [...s.paxList, { name: "", isPrimary: false }],
    }));

  const removePassenger = (idx: number) =>
    setAiData((s) => ({
      ...s,
      paxList: s.paxList.filter((_, i) => i !== idx),
    }));

  const updatePassenger = (
    idx: number,
    field: keyof AIDataState["paxList"][number],
    value: any
  ) =>
    setAiData((s) => ({
      ...s,
      paxList: s.paxList.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      ),
    }));

  const handleAddNewCustomer = () => {
    if (!newCustomerData.full_name.trim()) {
      alert("Customer name is required");
      return;
    }
    onAddCustomer(newCustomerData);
    setTimeout(() => {
      const newC = customers.find(
        (c) => c.full_name === newCustomerData.full_name
      );
      if (newC) {
        setFormData((prev) => ({
          ...prev,
          customer_id: newC.customer_id,
          customer_name: newC.full_name,
        }));
      }
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) {
      alert("Please select a customer or add a new customer");
      return;
    }
    const payload: any = {
      ...formData,
      balance_amount: formData.total_amount - formData.advance_received,
      ...(aiData.pnr && { pnr: aiData.pnr, ticketId: "generated-ticket-id" }),
    };
    onSubmitBooking(payload);
    onCancel();
  };

  return (
    <div className="space-y-6">
      {!selectedBooking && (
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
              disabled={isProcessing}
              icon={isProcessing ? Loader : Upload}
            >
              {isProcessing ? "Processing..." : "Choose File"}
            </Button>
            {uploadedFile && (
              <p className="text-sm text-gray-600 mt-2">
                Uploaded: {uploadedFile.name}
              </p>
            )}
          </div>
        </div>
      )}

      {isProcessing && (
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

      {!selectedBooking && (
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">
              AI Extracted Data (Editable)
            </h4>
            {processingComplete && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PNR
              </label>
              <input
                type="text"
                value={aiData.pnr}
                onChange={(e) => setAiData({ ...aiData, pnr: e.target.value })}
                placeholder="Enter PNR"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route
              </label>
              <input
                type="text"
                value={aiData.route}
                onChange={(e) =>
                  setAiData({ ...aiData, route: e.target.value })
                }
                placeholder="e.g., DEL-BOM"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Airline
              </label>
              <input
                type="text"
                value={aiData.airline}
                onChange={(e) =>
                  setAiData({ ...aiData, airline: e.target.value })
                }
                placeholder="e.g., Air India"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flight Number
              </label>
              <input
                type="text"
                value={aiData.flightNumber}
                onChange={(e) =>
                  setAiData({ ...aiData, flightNumber: e.target.value })
                }
                placeholder="e.g., AI 131"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Journey Date
              </label>
              <input
                type="date"
                value={aiData.journeyDate}
                onChange={(e) =>
                  setAiData({ ...aiData, journeyDate: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Journey Time
              </label>
              <input
                type="time"
                value={aiData.journeyTime}
                onChange={(e) =>
                  setAiData({ ...aiData, journeyTime: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Date
              </label>
              <input
                type="date"
                value={aiData.returnDate}
                onChange={(e) =>
                  setAiData({ ...aiData, returnDate: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Travel Category
              </label>
              <select
                value={aiData.travelCategory}
                onChange={(e) =>
                  setAiData({
                    ...aiData,
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Amount
              </label>
              <input
                type="number"
                value={aiData.bookingAmount}
                onChange={(e) =>
                  setAiData({
                    ...aiData,
                    bookingAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
                    <option value={Gender.Male}>Male</option>
                    <option value={Gender.Female}>Female</option>
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
              {!showAddCustomer ? (
                <div className="flex space-x-2">
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.full_name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddCustomer(true)}
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
                      onClick={() => setShowAddCustomer(false)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCustomerData.full_name}
                        onChange={(e) =>
                          setNewCustomerData({
                            ...newCustomerData,
                            full_name: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newCustomerData.email}
                        onChange={(e) =>
                          setNewCustomerData({
                            ...newCustomerData,
                            email: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={newCustomerData.phone}
                        onChange={(e) =>
                          setNewCustomerData({
                            ...newCustomerData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Passport Number
                      </label>
                      <input
                        type="text"
                        value={newCustomerData.passportNo}
                        onChange={(e) =>
                          setNewCustomerData({
                            ...newCustomerData,
                            passportNo: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.package_name}
                  onChange={(e) =>
                    setFormData({ ...formData, package_name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.booking_date}
                  onChange={(e) =>
                    setFormData({ ...formData, booking_date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.travel_start_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      travel_start_date: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.travel_end_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      travel_end_date: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Passengers *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.pax_count}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pax_count: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.total_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      total_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Received
                </label>
                <input
                  type="number"
                  min={0}
                  max={formData.total_amount}
                  value={formData.advance_received}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      advance_received: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as BookingStatus,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={BookingStatus.Pending}>Pending</option>
                  <option value={BookingStatus.Confirmed}>Confirmed</option>
                  <option value={BookingStatus.Cancelled}>Cancelled</option>
                </select>
              </div>
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
                  ₹
                  {(
                    formData.total_amount - formData.advance_received
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.customer_id}>
            {selectedBooking ? "Update Booking" : "Add Booking"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
