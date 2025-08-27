import {
  Edit,
  Eye,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import React, { useState } from "react";
import { Customer } from "../../types";
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

const CustomerManagement: React.FC = () => {
  // const { customers, addCustomer, updateCustomer, deleteCustomer, getBookingsByCustomer } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTicketHistoryModalOpen, setIsTicketHistoryModalOpen] =
    useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedCustomerTickets, setSelectedCustomerTickets] = useState<any[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    passport_number: "",
    gstin: "",
  });

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  const handleViewTicketHistory = (customer: Customer) => {
    // Mock ticket history - in real implementation, this would come from the database
    const mockTickets = [
      {
        id: "1",
        fileName: "Delhi_Mumbai_Ticket.pdf",
        uploadDate: "2024-12-01",
        pnr: "ABC123",
        route: "DEL-BOM",
        amount: 15000,
        status: "finalized",
        linkedBookingId: "booking-1",
      },
      {
        id: "2",
        fileName: "International_Flight_Ticket.pdf",
        uploadDate: "2024-11-15",
        pnr: "XYZ789",
        route: "DEL-LHR",
        amount: 85000,
        status: "finalized",
        linkedBookingId: "booking-2",
      },
    ];

    setSelectedCustomer(customer);
    setSelectedCustomerTickets(mockTickets);
    setIsTicketHistoryModalOpen(true);
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        full_name: customer.full_name,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        passport_number: customer.passport_number || "",
        gstin: customer.gstin || "",
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        passport_number: "",
        gstin: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      address: "",
      passport_number: "",
      gstin: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer) {
      updateCustomer(selectedCustomer.customer_id, formData);
    } else {
      addCustomer(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (customerId: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      deleteCustomer(customerId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Management
          </h1>
          <p className="text-gray-600">
            Manage your travel customers and their information
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => (window.location.hash = "#tickets")}
            icon={Upload}
          >
            Upload Tickets
          </Button>
          <Button onClick={() => handleOpenModal()} icon={Plus}>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {customers.length}
            </p>
            <p className="text-sm text-gray-600">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {customers.filter((c) => c.gstin).length}
            </p>
            <p className="text-sm text-gray-600">Business Customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">All Customers</h3>
          <p className="text-sm text-gray-600">
            Manage customer information and view booking history
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Name</TableCell>
                <TableCell header>Contact</TableCell>
                <TableCell header>GSTIN</TableCell>
                <TableCell header>Bookings</TableCell>
                <TableCell header>Created</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const bookings = getBookingsByCustomer(customer.customer_id);
                return (
                  <TableRow key={customer.customer_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {customer.full_name}
                        </p>
                        {customer.passport_number && (
                          <p className="text-sm text-gray-500">
                            Passport: {customer.passport_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {customer.email && (
                          <p className="text-sm text-gray-900">
                            {customer.email}
                          </p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-gray-600">
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.gstin ? (
                        <Badge variant="info" size="sm">
                          {customer.gstin}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" size="sm">
                        {bookings.length} booking
                        {bookings.length !== 1 ? "s" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatDate(customer.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={FileText}
                          onClick={() => handleViewTicketHistory(customer)}
                          title="View Ticket History"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit}
                          onClick={() => handleOpenModal(customer)}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDelete(customer.customer_id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket History Modal */}
      <Modal
        isOpen={isTicketHistoryModalOpen}
        onClose={() => setIsTicketHistoryModalOpen(false)}
        title={`Ticket History - ${selectedCustomer?.full_name}`}
        size="xl"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Customer Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {selectedCustomer?.full_name}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {selectedCustomer?.email || "N/A"}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  {selectedCustomer?.phone || "N/A"}
                </p>
                <p>
                  <span className="font-medium">GSTIN:</span>{" "}
                  {selectedCustomer?.gstin || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">
              Uploaded Tickets
            </h4>
            {selectedCustomerTickets.length > 0 ? (
              <div className="space-y-3">
                {selectedCustomerTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            {ticket.fileName}
                          </span>
                          <Badge variant="success" size="sm">
                            {ticket.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p>
                              <span className="font-medium">PNR:</span>{" "}
                              {ticket.pnr}
                            </p>
                            <p>
                              <span className="font-medium">Route:</span>{" "}
                              {ticket.route}
                            </p>
                          </div>
                          <div>
                            <p>
                              <span className="font-medium">Upload Date:</span>{" "}
                              {new Date(ticket.uploadDate).toLocaleDateString()}
                            </p>
                            <p>
                              <span className="font-medium">Amount:</span> ₹
                              {ticket.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" icon={Eye}>
                          View PDF
                        </Button>
                        {ticket.linkedBookingId && (
                          <Button variant="outline" size="sm">
                            View Booking
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No tickets uploaded for this customer
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setIsTicketHistoryModalOpen(false);
                    window.location.hash = "#tickets";
                  }}
                >
                  Upload Ticket
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCustomer ? "Edit Customer" : "Add New Customer"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
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
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
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
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
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
                value={formData.passport_number}
                onChange={(e) =>
                  setFormData({ ...formData, passport_number: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GSTIN
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) =>
                  setFormData({ ...formData, gstin: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedCustomer ? "Update Customer" : "Add Customer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
