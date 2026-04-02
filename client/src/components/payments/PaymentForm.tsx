import React from "react";
import { CreditCard } from "lucide-react";
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
        <div className="form-section">
        <div className="form-grid">
          <div>
            <label className="form-label">
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
              className="form-select"
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
              <p className="form-help">
                Outstanding balance: ₹
                {
                  bookings.find((b) => b.booking_id === formData.booking_id)
                    ?.balance_amount
                }
              </p>
            )}
          </div>

          <div>
            <label className="form-label">
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
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">
              Amount *
            </label>
            <input
              type="number"
              required
              min="0"
              step="1"
              value={formData.amount}
              disabled={isSubmitting}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData({
                  ...formData,
                  amount: value ? Math.ceil(value) : 0,
                });
              }}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">
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
              className="form-select"
            >
              {Object.values(PaymentMode).map((mode) => (
                <option key={mode} value={mode}>
                  {PAYMENT_MODE_LABEL[mode as PaymentMode]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">
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
              className="form-input"
            />
          </div>
        </div>
        </div>

        <div className="form-section">
          <label className="form-label">
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
            className="form-textarea"
          />
        </div>

        <div className="form-footer">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting} icon={CreditCard}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentForm;
