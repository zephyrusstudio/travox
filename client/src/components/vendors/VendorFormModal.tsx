// src/components/vendors/VendorFormModal.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

/* Types */
export type VendorFormState = {
  id?: string;
  name: string;
  serviceType: string;
  pocName?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  accountId?: string;
};

/* Props */
export type VendorFormModalProps = {
  isOpen: boolean;
  title: string;
  isEditing: boolean;
  selectedVendor?: VendorFormState | null;
  setSelectedVendor: (vendor: VendorFormState | null) => void;
  setIsFormOpen: (isOpen: boolean) => void;
  serviceTypes: string[];
  onVendorSaved: () => void;
};

/* Constants */
const MAX_PHONE = 10;
const GSTIN_LEN = 15;

/* Component */
const VendorFormModal: React.FC<VendorFormModalProps> = ({
  isOpen,
  title,
  isEditing,
  selectedVendor,
  setSelectedVendor,
  setIsFormOpen,
  serviceTypes,
  onVendorSaved,
}) => {
  // State
  const [formData, setFormData] = useState<VendorFormState>({
    name: "",
    serviceType: "",
    pocName: "",
    phone: "",
    email: "",
    gstin: "",
    accountId: "",
  });
  
  const [isdCode, setIsdCode] = useState("+91");

  // Validation
  const isPhoneValid = !formData.phone || /^[0-9]{10}$/.test(formData.phone.replace(/^\+\d{1,4}-/, ""));
  const isGstinValid = !formData.gstin || /^[0-9A-Z]{15}$/.test(formData.gstin);
  const isEmailValid =
    !formData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const canSubmit = useMemo(
    () =>
      Boolean(formData.name?.trim()) &&
      Boolean(formData.serviceType) &&
      (Boolean(formData.phone?.trim()) || Boolean(formData.email?.trim())) &&
      isEmailValid &&
      isPhoneValid &&
      isGstinValid,
    [
      formData.name,
      formData.serviceType,
      formData.phone,
      formData.email,
      isEmailValid,
      isPhoneValid,
      isGstinValid,
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
  
  const setGstin = (v: string) =>
    setFormData((s) => ({
      ...s,
      gstin: v
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, "")
        .slice(0, GSTIN_LEN),
    }));

  // API helpers
  async function createVendor() {
    const payload: Record<string, unknown> = {
      name: formData.name?.trim(),
      serviceType: formData.serviceType,
      pocName: formData.pocName?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      gstin: formData.gstin?.trim() || undefined,
      accountId: formData.accountId || undefined,
    };

    const data = await apiRequest<any>({
      method: "POST",
      url: "/vendors",
      data: payload,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });

    if (!data?.status || data.status !== "success") {
      throw new Error("Unable to save vendor");
    }
  }

  async function updateVendor() {
    const payload: Record<string, unknown> = {
      name: formData.name?.trim(),
      serviceType: formData.serviceType,
      pocName: formData.pocName?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      gstin: formData.gstin?.trim() || undefined,
      accountId: formData.accountId || undefined,
    };

    const data = await apiRequest<any>({
      method: "PUT",
      url: `/vendors/${formData.id}`,
      data: payload,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });

    if (!data?.status || data.status !== "success") {
      throw new Error("Unable to update vendor");
    }
  }

  // Submit
  const submitForm: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      if (isEditing) {
        await updateVendor();
      } else {
        await createVendor();
      }
      successToast(isEditing ? "Vendor updated" : "Vendor added");
      setSelectedVendor(null);
      onVendorSaved();
      onClose();
    } catch (err: any) {
      errorToast(err?.message || "Failed to save");
    }
  };

  const onClose = () => {
    setFormData({
      name: "",
      serviceType: "",
      pocName: "",
      phone: "",
      email: "",
      gstin: "",
      accountId: "",
    });
    setIsdCode("+91");
    setIsFormOpen(false);
    setSelectedVendor(null);
  };

  // Pre-fill on edit
  useEffect(() => {
    if (!selectedVendor) return;
    const existingPhone = selectedVendor.phone || "";
    const phoneMatch = existingPhone.match(/^(\+\d{1,4})-(.+)$/);
    if (phoneMatch) {
      setIsdCode(phoneMatch[1]);
    }
    
    setFormData({
      id: selectedVendor.id || "",
      name: selectedVendor.name || "",
      serviceType: selectedVendor.serviceType || "",
      pocName: selectedVendor.pocName || "",
      phone: existingPhone,
      email: selectedVendor.email || "",
      gstin: (selectedVendor.gstin || "").toUpperCase().slice(0, GSTIN_LEN),
      accountId: selectedVendor.accountId || "",
    });
  }, [selectedVendor]);

  // Render
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={submitForm} className="space-y-4">
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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter vendor name"
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

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={formData.pocName || ""}
              onChange={(e) =>
                setFormData({ ...formData, pocName: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter contact person name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email {!formData.phone?.trim() && "*"}
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
            {!isEmailValid && (
              <p className="mt-1 text-xs text-rose-600">Enter a valid email.</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone {!formData.email?.trim() && "*"}
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
              placeholder="Enter 15-character GSTIN"
            />
            {!isGstinValid && (
              <p className="mt-1 text-xs text-rose-600">
                GSTIN must be 15 characters (A–Z, 0–9).
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isEditing ? "Update Vendor" : "Save Vendor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VendorFormModal;
