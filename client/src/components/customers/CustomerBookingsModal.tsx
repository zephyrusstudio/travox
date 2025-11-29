import { Calendar, IndianRupee, MapPin, Package } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Customer } from "../../types";
import { ApiError, apiRequest } from "../../utils/apiConnector";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";

export type CustomerBookingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
};

type Booking = {
  id: string;
  bookingDate: string;
  packageName?: string;
  travelStartAt?: string;
  travelEndAt?: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  itineraries?: Array<{ destination?: string }>;
};

const CustomerBookingsModal: React.FC<CustomerBookingsModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerBookings = useCallback(async () => {
    if (!customer?.id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<{ data: Booking[] }>({
        method: "GET",
        url: `/customers/${customer.id}/bookings`,
      });
      const data = response?.data ?? response ?? [];
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      const error = err as ApiError;
      setError(error?.message || "Failed to fetch bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [customer?.id]);

  useEffect(() => {
    if (isOpen && customer?.id) {
      fetchCustomerBookings();
    }
  }, [isOpen, customer?.id, fetchCustomerBookings]);

  const getStatusVariant = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("confirm") || statusLower.includes("ticket")) {
      return "success";
    }
    if (statusLower.includes("cancel") || statusLower.includes("refund")) {
      return "danger";
    }
    if (statusLower.includes("draft") || statusLower.includes("pending")) {
      return "warning";
    }
    return "default";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount?: number, currency: string = "INR") => {
    const value = amount ?? 0;
    const currencySymbol = currency === "INR" ? "₹" : currency + " ";
    return `${currencySymbol}${value.toLocaleString("en-IN")}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Booking History - ${customer?.name ?? ""}`}
      size="xl"
    >
      <div>
        {loading ? (
          <div className="text-center py-8">
            <Spinner size="lg" className="mx-auto" />
            <p className="text-gray-500 mt-4">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchCustomerBookings}>
              Retry
            </Button>
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bookings.map((booking) => {
              const dueAmount =
                (booking.totalAmount ?? 0) - (booking.paidAmount ?? 0);
              const destination = booking.itineraries?.[0]?.destination;

              return (
                <div
                  key={booking.id}
                  className="border border-gray-200 p-4 transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Package className="w-12 h-12 text-blue-600" />
                      <div>
                        <h5 className="font-semibold text-gray-900">
                          {booking.packageName || "N/A"}
                        </h5>
                        <p className="text-sm text-gray-500">
                          Booking ID: {booking.id}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 ml-1 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          <span className="font-medium">Booked:</span>{" "}
                          {formatDate(booking.bookingDate)}
                        </span>
                      </div>
                      {booking.travelStartAt && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>
                            <span className="font-medium">Travel:</span>{" "}
                            {formatDate(booking.travelStartAt)}
                            {booking.travelEndAt &&
                              ` - ${formatDate(booking.travelEndAt)}`}
                          </span>
                        </div>
                      )}
                      {destination && (
                        <p className="text-gray-600">
                          <span className="font-medium">Destination:</span>{" "}
                          {destination}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <IndianRupee className="w-4 h-4 mr-2" />
                        <span>
                          <span className="font-medium">Total:</span>{" "}
                          {formatAmount(booking.totalAmount, booking.currency)}
                        </span>
                      </div>
                      <p className="text-gray-600 ml-6">
                        <span className="font-medium">Paid:</span>{" "}
                        {formatAmount(booking.paidAmount, booking.currency)}
                      </p>
                      {dueAmount > 0 && (
                        <p className="text-red-600 ml-6">
                          <span className="font-medium">Due:</span>{" "}
                          {formatAmount(dueAmount, booking.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bookings found for this customer</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CustomerBookingsModal;
