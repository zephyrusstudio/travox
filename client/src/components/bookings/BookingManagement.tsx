// components/bookings/BookingManagement.tsx
import {
  Calendar,
  DollarSign,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import React, { useState } from "react";
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
import BookingForm from "./BookingForm";
import { BookingStatus, TicketData, TravelCategory } from "./booking.types";

const BookingManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedTicketData, setSelectedTicketData] =
    useState<TicketData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const bookings = [];
  const customers = [];
  const addCustomer = (customer: any) => {
    //
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewTicket = (booking: Booking) => {
    const mock: TicketData = {
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
          booking.total_amount > 100000
            ? TravelCategory.International
            : TravelCategory.Domestic,
        route: "DEL-BOM",
      },
    };
    setSelectedTicketData(mock);
    setIsTicketModalOpen(true);
  };

  const resetAndClose = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleOpenModal = (booking?: Booking) => {
    setSelectedBooking(booking || null);
    setIsModalOpen(true);
  };

  const handleDelete = (bookingId: string) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      // deleteBooking(bookingId);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN");

  const getStatusVariant = (status: string) => {
    switch (status as BookingStatus) {
      case BookingStatus.Confirmed:
        return "success";
      case BookingStatus.Pending:
        return "warning";
      case BookingStatus.Cancelled:
        return "danger";
      default:
        return "default";
    }
  };

  const stats = (() => {
    const totalBookings = 10;
    const confirmedBookings = 11;
    const totalRevenue = 11;
    const pendingAmount = 12;
    return { totalBookings, confirmedBookings, totalRevenue, pendingAmount };
  })();

  const submitBooking = (payload: any) => {
    //
  };

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

      {/* Table */}
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
                      {b.customer_name}
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
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {(b as any).ticketId && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleViewTicket(b)}
                          title="View Ticket"
                        />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        onClick={() => handleOpenModal(b)}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(b.booking_id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket Modal */}
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
                {selectedTicketData.extractedData.paxList.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{p.name}</span>
                    {p.isPrimary && (
                      <Badge variant="info" size="sm">
                        Primary
                      </Badge>
                    )}
                  </div>
                ))}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetAndClose}
        title={selectedBooking ? "Edit Booking" : "Add New Booking"}
        size="xl"
      >
        <BookingForm
          selectedBooking={selectedBooking}
          customers={customers as any}
          onAddCustomer={addCustomer}
          onSubmitBooking={submitBooking}
          onCancel={resetAndClose}
        />
      </Modal>
    </div>
  );
};

export default BookingManagement;
