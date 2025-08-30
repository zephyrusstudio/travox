import {
  Bot,
  Calendar,
  CheckCircle,
  DollarSign,
  Edit,
  Eye,
  Loader,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { Booking } from "../../types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent, CardHeader } from "../ui/Card";
import Modal from "../ui/Modal";
import Table, {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/Table";

interface ExtractedData {
  paxList: Array<{
    name: string;
    age?: number;
    gender?: string;
    isPrimary: boolean;
  }>;
  bookingDate: string;
  journeyDate: string;
  journeyTime: string;
  returnDate?: string;
  pnr: string;
  bookingAmount: number;
  travelCategory: "Domestic" | "International" | "Corporate";
  airline?: string;
  flightNumber?: string;
  route?: string;
}

const BookingManagement: React.FC = () => {
  const {
    bookings,
    customers,
    addBooking,
    updateBooking,
    deleteBooking,
    getPaymentsByBooking,
    addCustomer,
  } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedTicketData, setSelectedTicketData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Extracted Data (Editable)
  const [aiData, setAiData] = useState({
    pnr: "",
    route: "",
    airline: "",
    flightNumber: "",
    journeyDate: "",
    journeyTime: "",
    returnDate: "",
    bookingAmount: 0,
    travelCategory: "Domestic" as "Domestic" | "International" | "Corporate",
    paxList: [] as Array<{
      name: string;
      age?: number;
      gender?: string;
      isPrimary: boolean;
    }>,
  });

  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    package_name: "",
    booking_date: "",
    travel_start_date: "",
    travel_end_date: "",
    pax_count: 1,
    total_amount: 0,
    advance_received: 0,
    status: "pending" as "confirmed" | "pending" | "cancelled",
  });

  const [newCustomerData, setNewCustomerData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    passportNo: "",
    gstin: "",
  });

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mock AI extraction function
  const extractDataFromFile = async (file: File): Promise<ExtractedData> => {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mock extracted data
    return {
      paxList: [
        { name: "John Doe", age: 35, gender: "Male", isPrimary: true },
        { name: "Jane Doe", age: 32, gender: "Female", isPrimary: false },
      ],
      bookingDate: new Date().toISOString().split("T")[0],
      journeyDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      journeyTime: "10:30",
      returnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      pnr: "ABC123",
      bookingAmount: 45000,
      travelCategory: "International",
      airline: "Air India",
      flightNumber: "AI 131",
      route: "DEL-LHR",
    };
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
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

      // Populate AI data fields
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

      // Auto-fill manual form data
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
    } catch (error) {
      alert("Error processing file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNewCustomer = () => {
    if (!newCustomerData.full_name.trim()) {
      alert("Customer name is required");
      return;
    }

    addCustomer(newCustomerData);

    // Find the newly added customer and select them
    setTimeout(() => {
      const newCustomer = customers.find(
        (c) => c.full_name === newCustomerData.full_name
      );
      if (newCustomer) {
        setFormData((prev) => ({
          ...prev,
          customer_id: newCustomer.customer_id,
          customer_name: newCustomer.full_name,
        }));
      }
    }, 100);

    // Reset form and hide add customer section
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

  const handleViewTicket = (booking: Booking) => {
    // Mock ticket data - in real implementation, this would come from the booking
    const mockTicketData = {
      fileName: `${booking.package_name.replace(/\s+/g, "_")}_ticket.pdf`,
      pnr: (booking as any).pnr || "ABC123",
      extractedData: {
        paxList: Array.from({ length: booking.pax_count }, (_, i) => ({
          name: i === 0 ? booking.customer_name : `Passenger ${i + 1}`,
          isPrimary: i === 0,
        })),
        journeyDate: booking.travel_start_date,
        returnDate: booking.travel_end_date,
        bookingAmount: booking.total_amount,
        travelCategory:
          booking.total_amount > 100000 ? "International" : "Domestic",
        route: "DEL-BOM",
      },
    };

    setSelectedTicketData(mockTicketData);
    setIsTicketModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      customer_name: "",
      package_name: "",
      booking_date: new Date().toISOString().split("T")[0],
      travel_start_date: "",
      travel_end_date: "",
      pax_count: 1,
      total_amount: 0,
      advance_received: 0,
      status: "pending",
    });
    setAiData({
      pnr: "",
      route: "",
      airline: "",
      flightNumber: "",
      journeyDate: "",
      journeyTime: "",
      returnDate: "",
      bookingAmount: 0,
      travelCategory: "Domestic",
      paxList: [],
    });
    setUploadedFile(null);
    setProcessingComplete(false);
    setShowAddCustomer(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenModal = (booking?: Booking) => {
    if (booking) {
      setSelectedBooking(booking);
      setFormData({
        customer_id: booking.customer_id,
        customer_name: booking.customer_name || "",
        package_name: booking.package_name,
        booking_date: booking.booking_date,
        travel_start_date: booking.travel_start_date,
        travel_end_date: booking.travel_end_date,
        pax_count: booking.pax_count,
        total_amount: booking.total_amount,
        advance_received: booking.advance_received,
        status: booking.status,
      });
    } else {
      setSelectedBooking(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      alert("Please select a customer or add a new customer");
      return;
    }

    const bookingData = {
      ...formData,
      balance_amount: formData.total_amount - formData.advance_received,
      ...(aiData.pnr && { pnr: aiData.pnr, ticketId: "generated-ticket-id" }),
    };

    if (selectedBooking) {
      updateBooking(selectedBooking.booking_id, bookingData);
    } else {
      addBooking(bookingData);
    }
    handleCloseModal();
  };

  const handleDelete = (bookingId: string) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      deleteBooking(bookingId);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.customer_id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customer_id: customerId,
        customer_name: customer.full_name,
      });
    }
  };

  const addPassenger = () => {
    setAiData((prev) => ({
      ...prev,
      paxList: [...prev.paxList, { name: "", isPrimary: false }],
    }));
  };

  const removePassenger = (index: number) => {
    setAiData((prev) => ({
      ...prev,
      paxList: prev.paxList.filter((_, i) => i !== index),
    }));
  };

  const updatePassenger = (index: number, field: string, value: any) => {
    setAiData((prev) => ({
      ...prev,
      paxList: prev.paxList.map((pax, i) =>
        i === index ? { ...pax, [field]: value } : pax
      ),
    }));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const getBookingStats = () => {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(
      (b) => b.status === "confirmed"
    ).length;
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + b.advance_received,
      0
    );
    const pendingAmount = bookings.reduce(
      (sum, b) => sum + b.balance_amount,
      0
    );

    return { totalBookings, confirmedBookings, totalRevenue, pendingAmount };
  };

  const stats = getBookingStats();

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
        <Button onClick={() => handleOpenModal()} icon={Plus}>
          Add Booking
        </Button>
      </div>

      {/* Stats Cards */}
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

      {/* Bookings Table */}
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
              {filteredBookings.map((booking) => (
                <TableRow key={booking.booking_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.package_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Booked: {formatDate(booking.booking_date)}
                      </p>
                      {(booking as any).pnr && (
                        <p className="text-xs text-blue-600 font-mono">
                          PNR: {(booking as any).pnr}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-gray-900">
                      {booking.customer_name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-gray-900">
                        {formatDate(booking.travel_start_date)}
                      </p>
                      <p className="text-sm text-gray-500">
                        to {formatDate(booking.travel_end_date)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" size="sm">
                      {booking.pax_count}{" "}
                      {booking.pax_count === 1 ? "person" : "people"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        ₹{booking.total_amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Paid: ₹{booking.advance_received.toLocaleString()}
                      </p>
                      {booking.balance_amount > 0 && (
                        <p className="text-sm text-red-600">
                          Due: ₹{booking.balance_amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(booking.status) as any}
                      size="sm"
                    >
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {(booking as any).ticketId && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleViewTicket(booking)}
                          title="View Ticket"
                        />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        onClick={() => handleOpenModal(booking)}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(booking.booking_id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket View Modal */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Ticket Information"
        size="lg"
      >
        {selectedTicketData && (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">
                Ticket Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <span className="font-medium">File:</span>{" "}
                    {selectedTicketData.fileName}
                  </p>
                  <p>
                    <span className="font-medium">PNR:</span>{" "}
                    {selectedTicketData.pnr}
                  </p>
                  <p>
                    <span className="font-medium">Route:</span>{" "}
                    {selectedTicketData.extractedData.route}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">Journey:</span>{" "}
                    {new Date(
                      selectedTicketData.extractedData.journeyDate
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Return:</span>{" "}
                    {new Date(
                      selectedTicketData.extractedData.returnDate
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Category:</span>{" "}
                    {selectedTicketData.extractedData.travelCategory}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Passenger List
              </h4>
              <div className="space-y-2">
                {selectedTicketData.extractedData.paxList.map(
                  (pax: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium">{pax.name}</span>
                      {pax.isPrimary && (
                        <Badge variant="info" size="sm">
                          Primary
                        </Badge>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">
                Booking Amount
              </h4>
              <p className="text-2xl font-bold text-green-700">
                ₹
                {selectedTicketData.extractedData.bookingAmount.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Booking Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedBooking ? "Edit Booking" : "Add New Booking"}
        size="xl"
      >
        <div className="space-y-6">
          {/* Ticket Upload Section - Only for new bookings */}
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

          {/* Processing Status */}
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

          {/* AI Extracted Data Section (Always visible, editable) */}
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
                    onChange={(e) =>
                      setAiData({ ...aiData, pnr: e.target.value })
                    }
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
                        travelCategory: e.target.value as any,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Domestic">Domestic</option>
                    <option value="International">International</option>
                    <option value="Corporate">Corporate</option>
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

              {/* Passenger List */}
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
                            updatePassenger(
                              index,
                              "isPrimary",
                              e.target.checked
                            )
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

          {/* Manual Data Entry Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-4">
                Manual Data Entry
              </h4>

              {/* Customer Selection */}
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
                        {customers.map((customer) => (
                          <option
                            key={customer.customer_id}
                            value={customer.customer_id}
                          >
                            {customer.full_name}
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

                {/* Rest of the form */}
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
                        setFormData({
                          ...formData,
                          package_name: e.target.value,
                        })
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
                        setFormData({
                          ...formData,
                          booking_date: e.target.value,
                        })
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
                      min="1"
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
                      min="0"
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
                      min="0"
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
                          status: e.target.value as any,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {formData.total_amount > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Payment Summary
                </h4>
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
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.customer_id}>
                {selectedBooking ? "Update Booking" : "Add Booking"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default BookingManagement;
