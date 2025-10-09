/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/vendors/VendorFormModal.tsx
import React, { useMemo, useState } from "react";
import { apiRequest } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

export type VendorFormState = {
  name: string;
  serviceType: string;
  pocName: string;
  email: string;
  phone: string; // 10 digits only
  gstin: string; // 15 chars, A–Z0–9
  accountId: string;
  upi_id?: string;
  bank_name?: string;
  ifsc_code?: string; // e.g., HDFC0XXXXXX
  branch_name?: string;
  account_no?: string; // numeric, <= 18
};

export type VendorFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: VendorFormState;
  setFormData: (next: VendorFormState) => void;
  onSubmit: React.FormEventHandler;
  serviceTypes: string[];
  /** Optional toast hook. Example: (type, msg) => toast({variant:type, title:msg}) */
  notify?: (type: "error" | "success" | "info", message: string) => void;
};

type Errors = Partial<
  Record<
    | "name"
    | "serviceType"
    | "pocName"
    | "email"
    | "phone"
    | "gstin"
    | "bank_name"
    | "branch_name"
    | "account_no"
    | "ifsc_code"
    | "upi_id",
    string
  >
>;

// Simple validators
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const upiRe = /^[\w.\-]{2,}@[A-Za-z]{2,}$/;
const ifscRe = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const gstinRe = /^[0-9A-Z]{15}$/;

const FIELD_ORDER: Array<keyof Errors> = [
  "name",
  "serviceType",
  "pocName",
  "email",
  "phone",
  "gstin",
  "bank_name",
  "branch_name",
  "account_no",
  "ifsc_code",
];

// validators
function validateCore(v: VendorFormState): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Vendor name is required.";
  if (!v.serviceType) e.serviceType = "Service type is required.";
  if (!v.pocName?.trim()) e.pocName = "Contact person is required.";
  if (!v.phone?.trim()) e.phone = "Phone is required.";
  else if (!/^\d{10}$/.test(v.phone))
    e.phone = "Phone must be exactly 10 digits.";
  if (!v.email?.trim()) e.email = "Email is required.";
  else if (!emailRe.test(v.email)) e.email = "Enter a valid email address.";
  if (v.gstin) {
    const up = v.gstin.toUpperCase();
    if (!gstinRe.test(up)) e.gstin = "GSTIN must be 15 characters A–Z or 0–9."; // optional if empty
  }
  return e;
}

function validateBank(v: VendorFormState): Errors {
  const e: Errors = {};
  if (v.ifsc_code) {
    const up = v.ifsc_code.toUpperCase();
    if (!ifscRe.test(up)) e.ifsc_code = "IFSC format looks invalid.";
  }
  if (v.account_no) {
    if (!/^\d{6,18}$/.test(v.account_no))
      e.account_no = "Account no. must be 6–18 digits.";
  }
  if (v.upi_id) {
    if (!upiRe.test(v.upi_id)) e.upi_id = "UPI ID format looks invalid.";
  }
  return e;
}

function validateBankRequired(v: VendorFormState): Errors {
  const e: Errors = {};
  if (!v.bank_name?.trim()) e.bank_name = "Bank name is required.";
  if (!v.branch_name?.trim()) e.branch_name = "Branch name is required.";
  if (!v.account_no?.trim()) e.account_no = "Account number is required.";
  if (!v.ifsc_code?.trim()) e.ifsc_code = "IFSC is required.";
  return e;
}

const VendorFormModal: React.FC<VendorFormModalProps> = ({
  isOpen,
  onClose,
  title,
  formData,
  setFormData,
  serviceTypes,
  notify,
}) => {
  const [bankOpen, setBankOpen] = useState(false);

  const coreErrors = useMemo(() => validateCore(formData), [formData]);
  const bankReqErrors = useMemo(
    () => (bankOpen ? validateBankRequired(formData) : {}),
    [formData, bankOpen]
  );
  const bankFmtErrors = useMemo(
    () => (bankOpen ? validateBank(formData) : {}),
    [formData, bankOpen]
  );

  const errors = useMemo(
    () => ({ ...coreErrors, ...bankReqErrors, ...bankFmtErrors }),
    [coreErrors, bankReqErrors, bankFmtErrors]
  );
  const coreValid = useMemo(
    () => Object.keys(coreErrors).length === 0,
    [coreErrors]
  );

  const set = <K extends keyof VendorFormState>(
    k: K,
    val: VendorFormState[K]
  ) => setFormData({ ...formData, [k]: val });

  // Field-specific sanitizers
  const onPhoneChange = (v: string) => {
    const onlyDigits = v.replace(/\D/g, "").slice(0, 10);
    set("phone", onlyDigits);
  };

  const onGstinChange = (v: string) => {
    const up = v
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "")
      .slice(0, 15);
    set("gstin", up);
  };

  const onIfscChange = (v: string) => {
    const up = v
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "")
      .slice(0, 11);
    set("ifsc_code", up);
  };

  const onEmailChange = (v: string) => {
    set("email", v.trim());
  };

  // API helpers
  async function createBankAccount(): Promise<string> {
    const payload = {
      bankName: formData.bank_name?.trim(),
      ifscCode: formData.ifsc_code?.trim(),
      branchName: formData.branch_name?.trim(),
      accountNo: formData.account_no?.trim(),
      upiId: formData.upi_id?.trim() || undefined,
      isActive: true,
    };
    const resp = await apiRequest<any>({
      method: "POST",
      url: "/accounts",
      data: payload,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });
    const id = resp?.data?.id as string | undefined;
    if (!id) throw new Error("Bank account creation failed");
    return id;
  }

  async function createvendor(accountId?: string) {
    const payload: Record<string, unknown> = {
      name: formData.name?.trim(),
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      serviceType: formData.serviceType || undefined,
      pocName: formData.pocName || undefined,
      gstin: formData.gstin || undefined,
      // link bank account when provided
      accountId: accountId || undefined,
      // keep the legacy bank fields out of the customer payload
    };

    const data = await apiRequest<any>({
      method: "POST",
      url: "/vendors",
      data: payload,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });

    if (!data?.status || data.status !== "success") {
      throw new Error("Unable to save customer");
    }
  }

  // submit
  const handleSubmitWrap: React.FormEventHandler = async (e) => {
    e.preventDefault();

    const merged: Errors = {
      ...validateCore(formData),
      ...(bankOpen ? validateBankRequired(formData) : {}),
      ...(bankOpen ? validateBank(formData) : {}),
    };

    for (const key of FIELD_ORDER) {
      const msg = merged[key];
      if (msg) {
        notify ? notify("error", msg) : errorToast(msg);
        return; // stop at the first error only
      }
    }

    try {
      if (bankOpen) {
        const accountId = await createBankAccount();
        await createvendor(accountId);
      } else {
        await createvendor();
      }
      successToast("Vendor Updated Successfully");
      onClose();
    } catch (err: any) {
      errorToast(err?.message || "Failed to save");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmitWrap} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => set("name", e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 `}
            />
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type *
            </label>
            <select
              required
              value={formData.serviceType}
              onChange={(e) => set("serviceType", e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">Select Service Type</option>
              {serviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              required
              value={formData.pocName}
              onChange={(e) => set("pocName", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => onEmailChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 `}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              inputMode="numeric"
              maxLength={10}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 `}
            />
          </div>

          {/* GSTIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GSTIN
            </label>
            <input
              type="text"
              value={formData.gstin}
              onChange={(e) => onGstinChange(e.target.value)}
              autoCapitalize="characters"
              maxLength={15}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.gstin ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.gstin && (
              <p className="mt-1 text-xs text-red-600">{errors.gstin}</p>
            )}
          </div>
        </div>

        {/* Bank toggle */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              if (!coreValid) {
                errorToast("Please fill in the vendor details first.");
                return;
              }
              setBankOpen((s) => !s);
            }}
            className="w-full md:w-auto px-3 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm"
          >
            {bankOpen ? "Hide Bank Account" : "Link Bank Account"}
          </button>
        </div>

        {/* Bank accordion */}
        {bankOpen && (
          <div className="pt-4 border rounded-lg border-gray-200">
            <div className="px-4 pt-4 flex items-baseline justify-between">
              <h3 className="text-lg font-bold text-gray-900">Bank Account</h3>
              <span className="text-xs text-gray-500">Required when open</span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  required={bankOpen}
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
                  required={bankOpen}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.account_no || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      account_no: e.target.value.trim(),
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="off"
                  required={bankOpen}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.ifsc_code || ""}
                  placeholder="HDFC0XXXXXX"
                  maxLength={11}
                  onChange={(e) => {
                    onIfscChange(e?.target?.value);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoCapitalize="characters"
                  required={bankOpen}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UPI ID (optional)
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
        )}

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Vendor</Button>
        </div>
      </form>
    </Modal>
  );
};

export default VendorFormModal;
