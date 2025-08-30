import axios from "axios";
import { Plus, Upload } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Customer } from "../../types";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import CustomerFormModal, { CustomerFormState } from "./CustomerFormModal";
import CustomerTable from "./CustomerTable";
import TicketHistoryModal from "./TicketHistoryModal";
import useCustomerSearch from "./useCustomerSearch";

const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyN2Y1cEJEblRVYlNtQXN6Y29CaiIsImVtYWlsIjoidGFtYWxjb2Rlc0BnbWFpbC5jb20iLCJyb2xlIjoiT3duZXIiLCJuYW1lIjoiVGFtYWwgRGFzIiwib3JnSWQiOiJ2M1h0WE81QTdOVzh3cTJBcFZDMCIsImlhdCI6MTc1NjUwMTQ5MywiZXhwIjoxNzU3NDAxNDkzLCJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20ifQ.AUJHcPzx2ijx-9DT9bHnt3_o7qJIQmFuCzZMoC8Pyg4tnJZ5AE62YrGRfat7hBVdaTodI1dXCWG5sKdhfuPbfPndqa8bGoyov9YidDbsP8tnp91xHZsjJdE2nyamrx2XAaNf9NRnrzPoXWtwf-0wGxncSlTM_bAfBFqgu1peMhACyRHSZoqXXRgWRyFJ0VqHKj2uzQ3X09rQ23tf3q38xCGIt0e57iNPhGBNw49pXmc_blgIA-tWp4gIypUE6QGvSVVNR3_bxWRRw87CoQQLe0xaKVb40grk7csDYD7pG7JnlL_efwWCZjsb_AL5vFKpyuoedCYkHJ-Vc_HN6fsMrw";

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  // Local state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerFormState | null>(null);
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);

  // Search
  const { searchTerm, setSearchTerm, filtered } = useCustomerSearch(customers);

  // Stats
  const stats = useMemo(
    () => ({
      total: customers.length,
      business: customers.filter((c) => c.gstin).length,
    }),
    [customers]
  );

  // Handlers
  const openForm = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
    } else {
      setSelectedCustomer(null);
    }
    setIsFormOpen(true);
  };

  const confirmDelete = (customerId: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      // deleteCustomer(customerId);
    }
  };

  const viewTicketHistory = (customer: Customer) => {
    // Mock data. Replace with DB query.
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
    setHistoryTickets(mockTickets);
    setIsHistoryOpen(true);
  };

  // placeholder until wired from context/store
  const getBookingsByCustomer = (id: string) => [] as any[];

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get("http://localhost:3000/customers", {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true, // needed for refreshToken cookie
        });
        setCustomers(response.data?.data);
      } catch (err) {
        console.error("Error fetching customers:", err);
      }
    };

    fetchCustomers();
  }, []);

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
          <Button onClick={() => openForm()} icon={Plus}>
            Add Customer
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <div className="relative">
            {/* Search icon preserved in input */}
            <CustomerTable.SearchBox
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
        </div>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {stats.business}
            </p>
            <p className="text-sm text-gray-600">Business Customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <CustomerTable
        customers={filtered}
        onEdit={openForm}
        onDelete={confirmDelete}
        onViewTickets={viewTicketHistory}
        getBookingsByCustomer={getBookingsByCustomer}
      />

      {/* Ticket History Modal */}
      <TicketHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        customer={selectedCustomer}
        tickets={historyTickets}
      />

      {/* Add/Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        title={selectedCustomer ? "Edit Customer" : "Add New Customer"}
        isEditing={Boolean(selectedCustomer)}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
      />
    </div>
  );
};

export default CustomerManagement;
