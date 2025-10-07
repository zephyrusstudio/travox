import axios from "axios";
import React, { useEffect, useState } from "react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

export type CustomerFormState = {
  id: string;
  orgId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  passportNo?: string;
  aadhaarNo?: string;
  visaNo?: string;
  gstin?: string;
  // New optional bank fields
  bank_name?: string;
  ifsc_code?: string;
  branch_name?: string;
  account_no?: string;
  upi_id?: string;

  totalBookings?: number;
  createdBy?: string;
  updatedBy?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type CustomerFormModalProps = {
  isOpen: boolean;
  title: string;
  isEditing: boolean;
  selectedCustomer?: CustomerFormState | null;
  setSelectedCustomer: (customer: CustomerFormState | null) => void;
  setIsFormOpen: (isOpen: boolean) => void;
};

const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyN2Y1cEJEblRVYlNtQXN6Y29CaiIsImVtYWlsIjoidGFtYWxjb2Rlc0BnbWFpbC5jb20iLCJyb2xlIjoiT3duZXIiLCJuYW1lIjoiVGFtYWwgRGFzIiwib3JnSWQiOiJ2M1h0WE81QTdOVzh3cTJBcFZDMCIsImlhdCI6MTc1NjUwMTQ5MywiZXhwIjoxNzU3NDAxNDkzLCJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20ifQ.AUJHcPzx2ijx-9DT9bHnt3_o7qJIQmFuCzZMoC8Pyg4tnJZ5AE62YrGRfat7hBVdaTodI1dXCWG5sKdhfuPbfPndqa8bGoyov9YidDbsP8tnp91xHZsjJdE2nyamrx2XAaNf9NRnrzPoXWtwf-0wGxncSlTM_bAfBFqgu1peMhACyRHSZoqXXRgWRyFJ0VqHKj2uzQ3X09rQ23tf3q38xCGIt0e57iNPhGBNw49pXmc_blgIA-tWp4gIypUE6QGvSVVNR3_bxWRRw87CoQQLe0xaKVb40grk7csDYD7pG7JnlL_efwWCZjsb_AL5vFKpyuoedCYkHJ-Vc_HN6fsMrw";

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  title,
  isEditing,
  selectedCustomer,
  setSelectedCustomer,
  setIsFormOpen,
}) => {
  const [formData, setFormData] = useState<CustomerFormState>({
    name: "",
    email: "",
    phone: "",
    address: "",
    passportNo: "",
    aadhaarNo: "",
    visaNo: "",
    gstin: "",
    // New optional bank fields init
    bank_name: "",
    ifsc_code: "",
    branch_name: "",
    account_no: "",
    upi_id: "",

    createdAt: "",
    id: "",
    orgId: "",
    totalBookings: 0,
    createdBy: "",
    updatedBy: "",
    isDeleted: false,
    updatedAt: "",
  });

  async function createCustomer() {
    const url = "http://localhost:3000/customers";

    // Build payload without making bank fields mandatory
    const data: Record<string, unknown> = {
      name: formData?.name,
      email: formData?.email,
      phone: formData?.phone,
      address: formData?.address,
      passportNo: formData?.passportNo,
      aadhaarNo: formData?.aadhaarNo,
      visaNo: formData?.visaNo,
      gstin: formData?.gstin,
    };

    // Append optional bank fields only if provided
    if (formData.bank_name) data.bank_name = formData.bank_name;
    if (formData.ifsc_code) data.ifsc_code = formData.ifsc_code;
    if (formData.branch_name) data.branch_name = formData.branch_name;
    if (formData.account_no) data.account_no = formData.account_no;
    if (formData.upi_id) data.upi_id = formData.upi_id;

    try {
      const response = await axios.post(url, data, {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response?.status === 201) {
        onClose();
      }

      return response.data;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }

  const submitForm: React.FormEventHandler = async (e) => {
    e.preventDefault();
    await createCustomer();
    setSelectedCustomer(null);
  };

  const onClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      passportNo: "",
      aadhaarNo: "",
      visaNo: "",
      gstin: "",
      bank_name: "",
      ifsc_code: "",
      branch_name: "",
      account_no: "",
      upi_id: "",
      // below are not required when clearing
      id: "",
      orgId: "",
      createdAt: "",
      totalBookings: 0,
      createdBy: "",
      updatedBy: "",
      isDeleted: false,
      updatedAt: "",
    });
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };

  useEffect(() => {
    if (selectedCustomer === null) return;

    setFormData({
      name: selectedCustomer?.name || "",
      email: selectedCustomer?.email || "",
      phone: selectedCustomer?.phone || "",
      address: selectedCustomer?.address || "",
      passportNo: selectedCustomer?.passportNo || "",
      aadhaarNo: selectedCustomer?.aadhaarNo || "",
      visaNo: selectedCustomer?.visaNo || "",
      gstin: selectedCustomer?.gstin || "",
      bank_name: selectedCustomer?.bank_name || "",
      ifsc_code: selectedCustomer?.ifsc_code || "",
      branch_name: selectedCustomer?.branch_name || "",
      account_no: selectedCustomer?.account_no || "",
      upi_id: selectedCustomer?.upi_id || "",
      id: selectedCustomer?.id || "",
      orgId: selectedCustomer?.orgId || "",
      createdAt: selectedCustomer?.createdAt || "",
      totalBookings: selectedCustomer?.totalBookings || 0,
      createdBy: selectedCustomer?.createdBy || "",
      updatedBy: selectedCustomer?.updatedBy || "",
      isDeleted: selectedCustomer?.isDeleted || false,
      updatedAt: selectedCustomer?.updatedAt || "",
    });
  }, [selectedCustomer]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
      }}
      title={title}
      size="lg"
    >
      <form
        onSubmit={(e) => {
          submitForm(e);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
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
              value={formData.passportNo}
              onChange={(e) =>
                setFormData({ ...formData, passportNo: e.target.value })
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aadhar Number
            </label>
            <input
              type="text"
              value={formData.aadhaarNo}
              onChange={(e) =>
                setFormData({ ...formData, aadhaarNo: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visa Number
            </label>
            <input
              type="text"
              value={formData.visaNo}
              onChange={(e) =>
                setFormData({ ...formData, visaNo: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Bank Account section - optional */}
        <div className="pt-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-bold text-gray-900">Bank Account</h3>
            <span className="text-xs text-gray-500">Optional</span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update Customer" : "Add Customer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
