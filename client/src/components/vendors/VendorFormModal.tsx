import React from "react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

export type VendorFormState = {
  name: string;
  serviceType: string;
  pocName: string;
  email: string;
  phone: string;
  gstin: string;
  accountId: string;
  // Optional bank fields
  bank_name?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_no?: string;
  upi_id?: string;
};

export type VendorFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: VendorFormState;
  setFormData: (next: VendorFormState) => void;
  onSubmit: React.FormEventHandler;
  serviceTypes: string[];
};

const VendorFormModal: React.FC<VendorFormModalProps> = ({
  isOpen,
  onClose,
  title,
  formData,
  setFormData,
  onSubmit,
  serviceTypes,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type *
            </label>
            <select
              required
              value={formData.serviceType}
              onChange={(e) =>
                setFormData({ ...formData, serviceType: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Service Type</option>
              {serviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={formData.pocName}
              onChange={(e) =>
                setFormData({ ...formData, pocName: e.target.value })
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

        {/* Bank Account section - optional */}
        <div className="pt-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Bank Account
            </h3>
            <span className="text-xs text-gray-500">Optional</span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account ID / Reference
              </label>
              <input
                type="text"
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bank_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bank_name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Name
              </label>
              <input
                type="text"
                value={formData.branch_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, branch_name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formData.account_no || ""}
                onChange={(e) =>
                  setFormData({ ...formData, account_no: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={formData.ifsc_code || ""}
                onChange={(e) =>
                  setFormData({ ...formData, ifsc_code: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoCapitalize="characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UPI ID
              </label>
              <input
                type="text"
                value={formData.upi_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, upi_id: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
};

export default VendorFormModal;
