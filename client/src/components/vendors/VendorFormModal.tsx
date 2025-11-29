// src/components/vendors/VendorFormModal.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronDown } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import type { AccountFormState as BankAccountFormState } from "../ui/common/AccountFormModal";

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
const ACCOUNT_INITIAL_STATE: BankAccountFormState = {
  bankName: "",
  ifscCode: "",
  branchName: "",
  accountNo: "",
  upiId: "",
};
type AccountFieldKey = Exclude<keyof BankAccountFormState, "id">;

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
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState<BankAccountFormState>({
    ...ACCOUNT_INITIAL_STATE,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const isPhoneValid = !formData.phone || /^[0-9]{10}$/.test(formData.phone.replace(/^\+\d{1,4}-/, ""));
  const isGstinValid = !formData.gstin || /^[0-9A-Z]{15}$/.test(formData.gstin);
  const isEmailValid =
    !formData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const phoneDigits = formData.phone?.replace(/^\+\d{1,4}-/, "") ?? "";
  const hasName = Boolean(formData.name?.trim());
  const hasServiceType = Boolean(formData.serviceType);
  const hasEmail = Boolean(formData.email?.trim());
  const hasPhone = Boolean(phoneDigits);
  const hasAllMandatoryFields =
    hasName && hasServiceType && hasEmail && hasPhone;
  const hasValidMandatoryFields =
    hasAllMandatoryFields && isEmailValid && isPhoneValid;
  const isAccountDetailsValid =
    !isLinkingAccount ||
    Boolean(
      accountForm.bankName.trim() &&
        accountForm.ifscCode.trim() &&
        accountForm.branchName.trim() &&
        accountForm.accountNo.trim()
    );

  const canSubmit = useMemo(
    () =>
      hasAllMandatoryFields &&
      isEmailValid &&
      isPhoneValid &&
      isGstinValid &&
      isAccountDetailsValid,
    [
      hasAllMandatoryFields,
      isEmailValid,
      isPhoneValid,
      isGstinValid,
      isAccountDetailsValid,
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
  const setAccountField = (field: AccountFieldKey, value: string) => {
    setAccountForm((prev) => {
      let nextValue = value;
      if (field === "ifscCode") {
        nextValue = value.toUpperCase().replace(/[^0-9A-Z]/g, "");
      } else if (field === "accountNo") {
        nextValue = value.replace(/\D/g, "");
      }

      return {
        ...prev,
        [field]: nextValue,
      };
    });
  };
  const resetAccountForm = () =>
    setAccountForm({ ...ACCOUNT_INITIAL_STATE });

  // API helpers
  const toggleBankSection = () => {
    if (!isLinkingAccount && !hasValidMandatoryFields) {
      errorToast(
        "Please complete vendor name, service type, email, and phone before linking a bank account."
      );
      return;
    }
    setIsLinkingAccount((prev) => !prev);
  };

  const removeBankDetails = () => {
    setIsLinkingAccount(false);
    resetAccountForm();
  };

  async function createVendor(): Promise<string> {
    const payload: Record<string, unknown> = {
      name: formData.name?.trim(),
      serviceType: formData.serviceType,
      pocName: formData.pocName?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      gstin: formData.gstin?.trim() || undefined,
    };

    const response = await apiRequest<any>({
      method: "POST",
      url: "/vendors",
      data: payload,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });
    const vendorId = response?.data?.id;
    if (!vendorId) {
      throw new Error("Vendor was created but no id was returned.");
    }
    return vendorId as string;
  }

  async function updateVendor(
    accountId?: string,
    overrideId?: string
  ): Promise<string> {
    const payload: Record<string, unknown> = {
      name: formData.name?.trim(),
      serviceType: formData.serviceType,
      pocName: formData.pocName?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      gstin: formData.gstin?.trim() || undefined,
    };
    const resolvedAccountId = accountId ?? formData.accountId;
    if (resolvedAccountId) {
      payload.accountId = resolvedAccountId;
    }

    const vendorId = overrideId ?? formData.id;
    if (!vendorId) {
      throw new Error("Vendor id is required to update the vendor.");
    }

    await apiRequest<any>({
      method: "PUT",
      url: `/vendors/${vendorId}`,
      data: payload,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });
    return vendorId;
  }

  async function saveBankAccount(): Promise<{ id: string; isNew: boolean }> {
    const trimmedAccount = {
      bankName: accountForm.bankName.trim(),
      ifscCode: accountForm.ifscCode.trim().toUpperCase(),
      branchName: accountForm.branchName.trim(),
      accountNo: accountForm.accountNo.trim(),
      upiId: accountForm.upiId.trim(),
    };

    if (
      !trimmedAccount.bankName ||
      !trimmedAccount.ifscCode ||
      !trimmedAccount.branchName ||
      !trimmedAccount.accountNo
    ) {
      throw new Error("Please complete all required bank account fields.");
    }

    if (accountForm.id) {
      await apiRequest<any>({
        method: "PUT",
        url: `/accounts/${accountForm.id}`,
        data: trimmedAccount,
        headers: { Accept: "*/*", "Content-Type": "application/json" },
      });

      return { id: accountForm.id, isNew: false };
    }

    const createResponse = await apiRequest<any>({
      method: "POST",
      url: "/accounts",
      data: trimmedAccount,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });

    if (createResponse?.status === "success" && createResponse?.data?.id) {
      return { id: createResponse.data.id as string, isNew: true };
    }

    throw new Error("Failed to create bank account.");
  }

  async function linkAccountToVendor(vendorId: string, accountId: string) {
    await apiRequest<any>({
      method: "PUT",
      url: `/vendors/${vendorId}`,
      data: { accountId },
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });
  }

  // Submit
  const submitForm: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);

    try {
      let vendorId: string;
      if (isEditing) {
        vendorId = await updateVendor();
      } else {
        vendorId = await createVendor();
        setFormData((prev) => ({ ...prev, id: vendorId }));
      }

      if (isLinkingAccount) {
        const { id: accountId, isNew } = await saveBankAccount();
        if (isNew || formData.accountId !== accountId) {
          await linkAccountToVendor(vendorId, accountId);
        }
        setFormData((prev) => ({ ...prev, accountId }));
        setAccountForm((prev) => ({ ...prev, id: accountId }));
      }
      successToast(isEditing ? "Vendor updated" : "Vendor added");
      onVendorSaved();
      onClose();
    } catch (err: any) {
      errorToast(err?.message || "Failed to save");
    } finally {
      setIsSubmitting(false);
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
    setIsLinkingAccount(false);
    resetAccountForm();
    setIsSubmitting(false);
    setIsFormOpen(false);
    setSelectedVendor(null);
  };

  // Pre-fill on edit
  useEffect(() => {
    if (!selectedVendor) return;

    let isActive = true;
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

    if (selectedVendor.accountId) {
      setIsLinkingAccount(true);
      setAccountForm({ ...ACCOUNT_INITIAL_STATE });

      const fetchAccount = async () => {
        try {
          const response = await apiRequest<any>({
            method: "GET",
            url: `/vendors/${selectedVendor.id}/account`,
          });

          if (!isActive) return;

          const accountData = response?.data;
          if (accountData) {
            setAccountForm({
              id: accountData.id || selectedVendor.accountId || "",
              bankName: accountData.bankName || "",
              ifscCode: (accountData.ifscCode || "").toUpperCase(),
              branchName: accountData.branchName || "",
              accountNo: accountData.accountNo || "",
              upiId: accountData.upiId || "",
            });
          }
        } catch (error: any) {
          if (!isActive) return;
          errorToast(
            error?.message || "Failed to load linked bank account details."
          );
          setAccountForm({ ...ACCOUNT_INITIAL_STATE });
        }
      };

      fetchAccount();
    } else {
      setIsLinkingAccount(false);
      setAccountForm({ ...ACCOUNT_INITIAL_STATE });
    }

    setIsSubmitting(false);

    return () => {
      isActive = false;
    };
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
              className="w-full border border-gray-300 px-3 py-2"
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
              className="w-full border border-gray-300 px-3 py-2"
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
              className="w-full border border-gray-300 px-3 py-2"
              placeholder="Enter contact person name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full border border-gray-300 px-3 py-2"
              placeholder="Enter email address"
            />
            {!isEmailValid && (
              <p className="mt-1 text-xs text-rose-600">Enter a valid email.</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
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
                className="w-20 border border-gray-300 rounded-l-lg px-3 py-2 bg-gray-50 text-center"
              />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={MAX_PHONE}
                required
                value={formData.phone ? formData.phone.replace(/^\+\d{1,4}-/, "") : ""}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 border border-l-0 border-gray-300 rounded-r-lg px-3 py-2"
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
              className="w-full border border-gray-300 px-3 py-2"
              placeholder="Enter 15-character GSTIN"
            />
            {!isGstinValid && (
              <p className="mt-1 text-xs text-rose-600">
                GSTIN must be 15 characters (A–Z, 0–9).
              </p>
            )}
          </div>
        </div>

        <div className="border border-gray-200">
          <button
            type="button"
            onClick={toggleBankSection}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                Bank Account
              </p>
              <p className="text-xs text-gray-500">
                {isLinkingAccount
                  ? "Bank details will be linked when you save this vendor."
                  : "Add bank account details for this vendor."}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isLinkingAccount ? "rotate-180" : ""
              }`}
            />
          </button>

          {isLinkingAccount && (
            <div className="space-y-4 border-t border-gray-200 bg-gray-50 px-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={accountForm.bankName}
                  onChange={(e) => setAccountField("bankName", e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2"
                  placeholder="Enter bank name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={accountForm.ifscCode}
                    onChange={(e) =>
                      setAccountField("ifscCode", e.target.value)
                    }
                    className="w-full border border-gray-300 px-3 py-2 uppercase"
                    placeholder="Enter IFSC code"
                    maxLength={11}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    value={accountForm.branchName}
                    onChange={(e) =>
                      setAccountField("branchName", e.target.value)
                    }
                    className="w-full border border-gray-300 px-3 py-2"
                    placeholder="Enter branch name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={accountForm.accountNo}
                    onChange={(e) =>
                      setAccountField("accountNo", e.target.value)
                    }
                    className="w-full border border-gray-300 px-3 py-2"
                    placeholder="Enter account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={accountForm.upiId}
                    onChange={(e) => setAccountField("upiId", e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2"
                    placeholder="Enter UPI ID (optional)"
                  />
                </div>
              </div>

              {!isAccountDetailsValid && (
                <p className="text-xs text-rose-600">
                  Please fill all required bank account fields.
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={removeBankDetails}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Remove bank details
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
          >
            {isEditing ? "Update Vendor" : "Save Vendor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VendorFormModal;
