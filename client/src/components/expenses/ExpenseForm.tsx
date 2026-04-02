import React, { useMemo } from "react";
import { Receipt } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import {
  AccountOption,
  ExpenseFormState,
  PAYMENT_MODE_LABEL,
  PaymentMode,
  VendorOption,
} from "./expense";

export type ExpenseFormProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  vendors: VendorOption[];
  accounts: AccountOption[];
  formData: ExpenseFormState;
  setFormData: React.Dispatch<React.SetStateAction<ExpenseFormState>>;
  onSubmit: (data: ExpenseFormState) => void;
  isSubmitting?: boolean;
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  title = "Record New Expense",
  vendors,
  accounts: _accounts,
  formData,
  setFormData,
  onSubmit,
  isSubmitting = false,
}) => {
  const selectedVendor = useMemo(
    () => vendors.find((v) => v.vendor_id === formData.vendor_id),
    [vendors, formData.vendor_id]
  );

  const vendorHasAccount = Boolean(selectedVendor?.account_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find((v) => v.vendor_id === vendorId);
    setFormData((prev) => ({
      ...prev,
      vendor_id: vendorId,
      vendor_account_id: vendor?.account_id || "",
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-section">
        <div className="form-grid">
          <div>
            <label className="form-label">
              Vendor *
            </label>
            <select
              required
              value={formData.vendor_id}
              disabled={isSubmitting}
              onChange={(e) => handleVendorChange(e.target.value)}
              className="form-select"
            >
              <option value="">Select Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.vendor_id} value={vendor.vendor_id}>
                  {vendor.vendor_name}
                  {vendor.service_type ? ` - ${vendor.service_type}` : ""}
                </option>
              ))}
            </select>
            {selectedVendor && !vendorHasAccount && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                This vendor does not have a linked payout account yet. Link an
                account from the Vendor module before recording an expense.
              </p>
            )}
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
                setFormData((prev) => ({
                  ...prev,
                  amount: value ? Math.ceil(value) : 0,
                }));
              }}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">
              Currency *
            </label>
            <input
              type="text"
              required
              value={formData.currency}
              disabled={isSubmitting}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  currency: e.target.value.toUpperCase(),
                }))
              }
              className="form-input uppercase"
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
                setFormData((prev) => ({
                  ...prev,
                  payment_mode: e.target.value as PaymentMode,
                }))
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
              Receipt Number
            </label>
            <input
              type="text"
              value={formData.receipt_number}
              disabled={isSubmitting}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  receipt_number: e.target.value,
                }))
              }
              className="form-input"
              placeholder="Optional receipt reference"
            />
          </div>

          <div>
            <label className="form-label">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              disabled={isSubmitting}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              className="form-input"
              placeholder="e.g. Vendor payment, Logistics"
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
              setFormData((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            placeholder="Add any additional notes..."
            className="form-textarea"
          />
        </div>

        <div className="form-footer !justify-between flex-wrap">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            All expenses will be logged against the selected vendor. Make sure
            the vendor has a linked bank/UPI account. Available internal
            accounts: {_accounts.length}.
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !vendorHasAccount}
              loading={isSubmitting}
              icon={Receipt}
            >
              Record Expense
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseForm;
