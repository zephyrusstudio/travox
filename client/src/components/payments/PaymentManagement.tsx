import { CreditCard, Plus, Receipt, Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent, CardHeader } from "../ui/Card";
import Table, {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/Table";
import PaymentForm from "./PaymentForm";
import {
  formatDate,
  PAYMENT_MODE_BADGE,
  PAYMENT_MODE_LABEL,
  PaymentFormState,
  PaymentMode,
  todayISO,
} from "./payment";

const PaymentManagement: React.FC = () => {
  const payments = [];
  const bookings = [];
  const addPayment = (data: PaymentFormState) => {};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<PaymentFormState>({
    booking_id: "",
    payment_date: todayISO(),
    amount: 0,
    payment_mode: PaymentMode.CASH,
    receipt_number: "",
    notes: "",
  });

  const filteredPayments = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return payments.filter((p) => {
      const b = bookings.find((x) => x.booking_id === p.booking_id);
      return (
        p.receipt_number.toLowerCase().includes(q) ||
        (b?.package_name?.toLowerCase() || "").includes(q) ||
        (b?.customer_name?.toLowerCase() || "").includes(q)
      );
    });
  }, [payments, bookings, searchTerm]);

  const handleOpenModal = () => {
    setFormData({
      booking_id: "",
      payment_date: todayISO(),
      amount: 0,
      payment_mode: PaymentMode.CASH,
      receipt_number: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (data: PaymentFormState) => {
    addPayment(data);
    setIsModalOpen(false);
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `RCPT${timestamp}${randomNum}`;
  };

  const onBookingSelect = (bookingId: string) => {
    setFormData((prev) => ({
      ...prev,
      booking_id: bookingId,
      receipt_number: generateReceiptNumber(),
    }));
  };

  const stats = useMemo(() => {
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    const now = new Date();
    const thisMonthAmount = payments
      .filter((p) => {
        const d = new Date(p.payment_date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalPayments, totalAmount, thisMonthAmount };
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Management
          </h1>
          <p className="text-gray-600">Track and manage customer payments</p>
        </div>
        <Button onClick={handleOpenModal} icon={Plus}>
          Record Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalPayments}
            </p>
            <p className="text-sm text-gray-600">Total Payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              ₹{stats.totalAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              ₹{stats.thisMonthAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">
            Payment History
          </h3>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Receipt No.</TableCell>
                <TableCell header>Booking Details</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Payment Mode</TableCell>
                <TableCell header>Notes</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((p) => {
                const b = bookings.find((x) => x.booking_id === p.booking_id);
                return (
                  <TableRow key={p.payment_id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm">
                          {p.receipt_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {b?.package_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {b?.customer_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-900">
                        {formatDate(p.payment_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        ₹{p.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={PAYMENT_MODE_BADGE[p.payment_mode] as any}
                        size="sm"
                      >
                        {PAYMENT_MODE_LABEL[p.payment_mode]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {p.notes || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <PaymentForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookings={bookings}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onBookingSelect={onBookingSelect}
      />
    </div>
  );
};

export default PaymentManagement;
