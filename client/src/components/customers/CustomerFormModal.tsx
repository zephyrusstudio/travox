// src/components/customers/CustomerFormModal.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

/* Types */
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
  accountId?: string;
  totalBookings?: number;
  createdBy?: string;
  updatedBy?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
};

/* Props */
export type CustomerFormModalProps = {
  isOpen: boolean;
  title: string;
  isEditing: boolean;
  selectedCustomer?: CustomerFormState | null;
  setSelectedCustomer: (customer: CustomerFormState | null) => void;
  setIsFormOpen: (isOpen: boolean) => void;
};

/* Constants */
const MAX_PHONE = 10;
const AADHAAR_LEN = 12;
const GSTIN_LEN = 15;
const PASSPORT_LEN = 8;

/* Component */
const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  title,
  isEditing,
  selectedCustomer,
  setSelectedCustomer,
  setIsFormOpen,
}) => {
  // State
  const [formData, setFormData] = useState<CustomerFormState>({
    id: "",
    orgId: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    passportNo: "",
    aadhaarNo: "",
    visaNo: "",
    gstin: "",
    accountId: "",
    createdAt: "",
    totalBookings: 0,
    createdBy: "",
    updatedBy: "",
    isDeleted: false,
    updatedAt: "",
  });
  
  const [isdCode, setIsdCode] = useState("+91");

  // Validation
  const isPhoneValid = !formData.phone || /^[0-9]{10}$/.test(formData.phone.replace(/^\+\d{1,4}-/, ""));
  const isAadhaarValid =
    !formData.aadhaarNo || /^[0-9]{12}$/.test(formData.aadhaarNo);
  const isGstinValid = !formData.gstin || /^[0-9A-Z]{15}$/.test(formData.gstin);
  const isPassportValid =
    !formData.passportNo || /^[A-Z0-9]{1,8}$/.test(formData.passportNo);
  const isEmailValid =
    !formData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const canSubmit = useMemo(
    () =>
      Boolean(formData.name?.trim()) &&
      isEmailValid &&
      isPhoneValid &&
      isAadhaarValid &&
      isGstinValid &&
      isPassportValid,
    [
      formData.name,
      isEmailValid,
      isPhoneValid,
      isAadhaarValid,
      isGstinValid,
      isPassportValid,
    ]
  );

  // Sanitize helpers
  const setPhone = (v: string) => {
    const cleanNumber = v.replace(/\D/g, "").slice(0, MAX_PHONE);
    const formattedPhone = cleanNumber ? `${isdCode}-${cleanNumber}` : "";
    setFormData((s) => ({
      ...s,
      phone: formattedPhone,
    }));
  };
  const setAadhaar = (v: string) =>
    setFormData((s) => ({
      ...s,
      aadhaarNo: v.replace(/\D/g, "").slice(0, AADHAAR_LEN),
    }));
  const setGstin = (v: string) =>
    setFormData((s) => ({
      ...s,
      gstin: v
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, "")
        .slice(0, GSTIN_LEN),
    }));
  const setPassport = (v: string) =>
    setFormData((s) => ({
      ...s,
      passportNo: v
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, "")
        .slice(0, PASSPORT_LEN),
    }));

  // API helpers
  async function createCustomer() {
    const payload: Record<string, unknown> = {
      name: formData.name?.trim(),
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      passportNo: formData.passportNo || undefined,
      aadhaarNo: formData.aadhaarNo || undefined,
      visaNo: formData.visaNo || undefined,
      gstin: formData.gstin || undefined,
    };

    await apiRequest<any>({
      method: "POST",
      url: "/customers",
      data: payload,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });
  }

  async function updateCustomer() {
    const payload: Record<string, unknown> = {
      name: formData.name?.trim(),
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      passportNo: formData.passportNo || undefined,
      aadhaarNo: formData.aadhaarNo || undefined,
      visaNo: formData.visaNo || undefined,
      gstin: formData.gstin || undefined,
    };

    await apiRequest<any>({
      method: "PUT",
      url: `/customers/${formData.id}`,
      data: payload,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });
  }

  // Submit
  const submitForm: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      if (isEditing) {
        await updateCustomer();
      } else {
        await createCustomer();
      }
      successToast(isEditing ? "Customer updated" : "Customer added");
      setSelectedCustomer(null);
      onClose();
    } catch (err: any) {
      errorToast(err?.message || "Failed to save");
    }
  };

  const onClose = () => {
    setFormData({
      id: "",
      orgId: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      passportNo: "",
      aadhaarNo: "",
      visaNo: "",
      gstin: "",
      accountId: "",
      createdAt: "",
      totalBookings: 0,
      createdBy: "",
      updatedBy: "",
      isDeleted: false,
      updatedAt: "",
    });
    setIsdCode("+91");
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };

  // Pre-fill on edit
  useEffect(() => {
    if (!selectedCustomer) return;
    const existingPhone = selectedCustomer.phone || "";
    const phoneMatch = existingPhone.match(/^(\+\d{1,4})-(.+)$/);
    if (phoneMatch) {
      setIsdCode(phoneMatch[1]);
    }
    
    setFormData({
      name: selectedCustomer.name || "",
      email: selectedCustomer.email || "",
      phone: existingPhone,
      address: selectedCustomer.address || "",
      passportNo: (selectedCustomer.passportNo || "")
        .toUpperCase()
        .slice(0, PASSPORT_LEN),
      aadhaarNo: (selectedCustomer.aadhaarNo || "")
        .replace(/\D/g, "")
        .slice(0, AADHAAR_LEN),
      visaNo: selectedCustomer.visaNo || "",
      gstin: (selectedCustomer.gstin || "").toUpperCase().slice(0, GSTIN_LEN),
      accountId: selectedCustomer.accountId || "",
      id: selectedCustomer.id || "",
      orgId: selectedCustomer.orgId || "",
      createdAt: selectedCustomer.createdAt || "",
      totalBookings: selectedCustomer.totalBookings || 0,
      createdBy: selectedCustomer.createdBy || "",
      updatedBy: selectedCustomer.updatedBy || "",
      isDeleted: selectedCustomer.isDeleted || false,
      updatedAt: selectedCustomer.updatedAt || "",
    });
  }, [selectedCustomer]);

  // Render
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={submitForm} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
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

          {/* Email */}
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
            {!isEmailValid && (
              <p className="mt-1 text-xs text-rose-600">Enter a valid email.</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <div className="flex">
              <input
                type="text"
                value={isdCode}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow + at the beginning and numbers
                  const cleanValue = value.replace(/[^+\d]/g, "");
                  if (cleanValue.startsWith("+") || cleanValue === "") {
                    setIsdCode(cleanValue || "+");
                    if (formData.phone) {
                      const phoneNumber = formData.phone.replace(/^\+\d{1,4}-/, "");
                      setPhone(phoneNumber);
                    }
                  }
                }}
                placeholder="+91"
                maxLength={5}
                className="w-20 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-center"
              />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={MAX_PHONE}
                value={formData.phone ? formData.phone.replace(/^\+\d{1,4}-/, "") : ""}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 border border-l-0 border-gray-300 rounded-r-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>
            {!isPhoneValid && (
              <p className="mt-1 text-xs text-rose-600">
                Enter exactly 10 digits.
              </p>
            )}
          </div>

          {/* Passport */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passport Number
            </label>
            <input
              type="text"
              value={formData.passportNo || ""}
              maxLength={PASSPORT_LEN}
              onChange={(e) => setPassport(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!isPassportValid && (
              <p className="mt-1 text-xs text-rose-600">
                Invalid passport format.
              </p>
            )}
          </div>

          {/* GSTIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GSTIN
            </label>
            <input
              type="text"
              value={formData.gstin || ""}
              maxLength={GSTIN_LEN}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!isGstinValid && (
              <p className="mt-1 text-xs text-rose-600">
                GSTIN must be 15 characters (A–Z, 0–9).
              </p>
            )}
          </div>

          {/* Aadhaar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aadhaar Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={AADHAAR_LEN}
              value={formData.aadhaarNo || ""}
              onChange={(e) => setAadhaar(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!isAadhaarValid && (
              <p className="mt-1 text-xs text-rose-600">
                Enter exactly 12 digits.
              </p>
            )}
          </div>

          {/* Visa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visa Number
            </label>
            <input
              type="text"
              value={formData.visaNo || ""}
              onChange={(e) =>
                setFormData({ ...formData, visaNo: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isEditing ? "Update Customer" : "Save Customer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
