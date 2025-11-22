import React from "react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import {
  BookingRef,
  PAYMENT_MODE_LABEL,
  PaymentFormState,
  PaymentMode,
  todayISO,
} from "./payment";

export type PaymentFormProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  bookings: BookingRef[];
  formData: PaymentFormState;
  setFormData: (next: PaymentFormState) => void;
  onSubmit: (data: PaymentFormState) => void;
  onBookingSelect?: (bookingId: string) => void; // optional: parent can auto-generate receipt
  isSubmitting?: boolean;
};

const PaymentForm: React.FC<PaymentFormProps> = ({
  isOpen,
  onClose,
  title = "Record New Payment",
  bookings,
  formData,
  setFormData,
  onSubmit,
  onBookingSelect,
  isSubmitting = false,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking *
            </label>
            <select
              required
              value={formData.booking_id}
              disabled={isSubmitting}
              onChange={(e) => {
                const id = e.target.value;
                setFormData({ ...formData, booking_id: id });
                onBookingSelect?.(id);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Booking</option>
              {bookings
                .filter((b) => b.balance_amount > 0)
                .map((b) => (
                  <option key={b.booking_id} value={b.booking_id}>
                    {b.package_name} - {b.customer_name} (Balance: ₹
                    {b.balance_amount.toLocaleString()})
                  </option>
                ))}
            </select>
            {formData.booking_id && (
              <p className="text-sm text-gray-500 mt-1">
                Outstanding balance: ₹
                {
                  bookings.find((b) => b.booking_id === formData.booking_id)
                    ?.balance_amount
                }
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              required
              value={formData.payment_date || todayISO()}
              disabled={isSubmitting}
              onChange={(e) =>
                setFormData({ ...formData, payment_date: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              disabled={isSubmitting}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Mode *
            </label>
            <select
              required
              value={formData.payment_mode}
              disabled={isSubmitting}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  payment_mode: e.target.value as PaymentMode,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(PaymentMode).map((mode) => (
                <option key={mode} value={mode}>
                  {PAYMENT_MODE_LABEL[mode as PaymentMode]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receipt Number *
            </label>
            <input
              type="text"
              required
              value={formData.receipt_number}
              disabled={isSubmitting}
              onChange={(e) =>
                setFormData({ ...formData, receipt_number: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            disabled={isSubmitting}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Add any additional notes..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting} className="flex gap-3">
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentForm;
