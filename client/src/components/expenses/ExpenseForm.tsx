import React, { useMemo } from "react";
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
  setFormData: (next: ExpenseFormState) => void;
  onSubmit: (data: ExpenseFormState) => void;
  isSubmitting?: boolean;
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  title = "Record New Expense",
  vendors,
  accounts,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor *
            </label>
            <select
              required
              value={formData.vendor_id}
              disabled={isSubmitting}
              onChange={(e) => handleVendorChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <p className="text-xs text-amber-600 mt-1">
                This vendor does not have a linked payout account yet. Link an
                account from the Vendor module before recording an expense.
              </p>
            )}
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
                setFormData((prev) => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                setFormData((prev) => ({
                  ...prev,
                  payment_mode: e.target.value as PaymentMode,
                }))
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional receipt reference"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Vendor payment, Logistics"
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
              setFormData((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            placeholder="Add any additional notes..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between pt-4 flex-wrap gap-3">
          <div className="text-xs text-gray-500">
            All expenses will be logged against the selected vendor. Make sure
            the vendor has a linked bank/UPI account.
          </div>
          <div className="flex items-center space-x-3">
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
