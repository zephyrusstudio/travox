import React, { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Payment, Booking } from '../../types';

type ApiPayment = Payment & {
  id?: string;
  bookingId?: string;
  createdAt?: string;
  created_at?: string;
  paymentMode?: string;
  refundOfPaymentId?: string;
  refund_of_payment_id?: string;
};

type ApiBooking = Booking & {
  id?: string;
  packageName?: string;
  customerName?: string;
  customerId?: string;
  primaryPaxName?: string;
};

type ApiCustomer = {
  id: string;
  name: string;
  accountId?: string;
};

interface CreateRefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RefundFormData) => void;
  payments: ApiPayment[];
  bookings: ApiBooking[];
  customers: ApiCustomer[];
  existingRefunds: Array<{ payment_id: string }>;
}

export interface RefundFormData {
  payment_id: string;
  booking_id: string;
  refund_date: string;
  refund_amount: number;
  refund_reason: string;
  refund_mode: string;
}

const REFUND_MODES = ['Bank Transfer', 'Cash', 'UPI', 'Cheque'];

const getTodayDateString = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const getInitialFormData = (): RefundFormData => ({
  payment_id: '',
  booking_id: '',
  refund_date: getTodayDateString(),
  refund_amount: 0,
  refund_reason: '',
  refund_mode: 'Bank Transfer',
});

const CreateRefundDialog: React.FC<CreateRefundDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  payments,
  bookings,
  customers,
  existingRefunds,
}) => {
  const [formData, setFormData] = useState<RefundFormData>(getInitialFormData());

  const customersMap = useMemo(() => {
    const map = new Map<string, ApiCustomer>();
    customers.forEach((customer) => {
      if (customer?.id) {
        map.set(String(customer.id), customer);
      }
    });
    return map;
  }, [customers]);

  const refundedPaymentIds = useMemo(
    () => new Set(existingRefunds.map(r => r.payment_id).filter(Boolean)),
    [existingRefunds]
  );

  const receivablePayments = useMemo(
    () => payments.filter(p => {
      const paymentId = p.payment_id || p.id;
      return paymentId && !refundedPaymentIds.has(paymentId);
    }),
    [payments, refundedPaymentIds]
  );

  const selectedPayment = useMemo(
    () => receivablePayments.find(p => (p.payment_id || p.id) === formData.payment_id),
    [receivablePayments, formData.payment_id]
  );

  const handlePaymentSelect = (paymentId: string) => {
    const payment = receivablePayments.find(p => (p.payment_id || p.id) === paymentId);
    if (payment) {
      setFormData({
        ...formData,
        payment_id: paymentId,
        booking_id: payment.booking_id || payment.bookingId || '',
        refund_amount: payment.amount,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData(getInitialFormData());
    onClose();
  };

  const canSubmit = Boolean(formData.payment_id);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Process Refund" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-section space-y-4">
          <div>
            <label className="form-label">
              Payment to Refund *
            </label>
            <select
              required
              value={formData.payment_id}
              onChange={(e) => handlePaymentSelect(e.target.value)}
              className="form-select"
            >
              <option value="">Select a payment to refund</option>
              {receivablePayments.map(payment => {
                const paymentId = payment.payment_id || payment.id;
                const bookingId = payment.booking_id || payment.bookingId;
                const booking = bookings.find(b => (b.booking_id || b.id) === bookingId);
                const customerId = booking?.customer_id || booking?.customerId || '';
                const customer = customerId ? customersMap.get(String(customerId)) : undefined;
                const customerName = customer?.name || booking?.customer_name || booking?.customerName || booking?.primaryPaxName || 'Unknown Customer';
                const paymentDate = payment.payment_date || payment.createdAt || payment.created_at || '';
                const paymentMode = payment.payment_mode || payment.paymentMode;
                return (
                  <option key={paymentId} value={paymentId}>
                    {booking?.package_name || booking?.packageName || 'Unknown Package'} - {customerName} | {formatDisplayDate(paymentDate)} | ₹{payment.amount.toLocaleString()} ({paymentMode})
                  </option>
                );
              })}
            </select>
            {receivablePayments.length === 0 && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                No payments available for refund
              </p>
            )}
          </div>

          <div className="form-grid">
            <div>
              <label className="form-label">
                Refund Date *
              </label>
              <input
                type="date"
                required
                value={formData.refund_date}
                onChange={(e) => setFormData({ ...formData, refund_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">
                Refund Mode *
              </label>
              <select
                required
                value={formData.refund_mode}
                onChange={(e) => setFormData({ ...formData, refund_mode: e.target.value })}
                className="form-select"
              >
                {REFUND_MODES.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">
              Refund Amount *
            </label>
            <input
              type="number"
              required
              min="0"
              step="1"
              value={formData.refund_amount}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData({ ...formData, refund_amount: value ? Math.ceil(value) : 0 });
              }}
              className="form-input"
            />
            {selectedPayment && (
              <p className="form-help">
                Original payment: ₹{selectedPayment.amount.toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <label className="form-label">
              Refund Reason
            </label>
            <textarea
              rows={3}
              value={formData.refund_reason}
              onChange={(e) => setFormData({ ...formData, refund_reason: e.target.value })}
              placeholder="Explain why the refund is being processed (optional)..."
              className="form-textarea"
            />
          </div>
        </div>

        <div className="form-footer">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            icon={RefreshCw}
            disabled={!canSubmit}
          >
            Process Refund
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRefundDialog;
