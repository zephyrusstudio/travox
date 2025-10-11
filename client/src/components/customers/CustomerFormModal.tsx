// src/components/customers/CustomerFormModal.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronDown } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../utils/apiConnector";
import { errorToast, successToast } from "../../utils/toasts";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import type { AccountFormState as BankAccountFormState } from "../ui/common/AccountFormModal";

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
const ACCOUNT_INITIAL_STATE: BankAccountFormState = {
  bankName: "",
  ifscCode: "",
  branchName: "",
  accountNo: "",
  upiId: "",
};
type AccountFieldKey = Exclude<keyof BankAccountFormState, "id">;

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
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState<BankAccountFormState>({
    ...ACCOUNT_INITIAL_STATE,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const isPhoneValid =
    !formData.phone ||
    /^[0-9]{10}$/.test(formData.phone.replace(/^\+\d{1,4}-/, ""));
  const isAadhaarValid =
    !formData.aadhaarNo || /^[0-9]{12}$/.test(formData.aadhaarNo);
  const isGstinValid = !formData.gstin || /^[0-9A-Z]{15}$/.test(formData.gstin);
  const isPassportValid =
    !formData.passportNo || /^[A-Z0-9]{1,8}$/.test(formData.passportNo);
  const isEmailValid =
    !formData.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const phoneDigits = formData.phone?.replace(/^\+\d{1,4}-/, "") ?? "";
  const hasName = Boolean(formData.name?.trim());
  const hasEmail = Boolean(formData.email?.trim());
  const hasPhone = Boolean(phoneDigits);
  const hasContactInfo =
    (hasEmail && isEmailValid) || (hasPhone && isPhoneValid);
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
      hasName &&
      hasContactInfo &&
      isEmailValid &&
      isPhoneValid &&
      isAadhaarValid &&
      isGstinValid &&
      isPassportValid &&
      isAccountDetailsValid,
    [
      hasName,
      hasContactInfo,
      isEmailValid,
      isPhoneValid,
      isAadhaarValid,
      isGstinValid,
      isPassportValid,
      isAccountDetailsValid,
    ]
  );
  const hasRequiredCustomerInfo = hasName && hasContactInfo;

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
  async function createCustomer(): Promise<string> {
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

    const response = await apiRequest<any>({
      method: "POST",
      url: "/customers",
      data: payload,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });

    const customerId = response?.data?.id;
    if (!customerId) {
      throw new Error("Customer was created but no id was returned.");
    }
    return customerId as string;
  }

  async function updateCustomer(
    accountId?: string,
    overrideId?: string
  ): Promise<string> {
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
    const resolvedAccountId = accountId ?? formData.accountId;
    if (resolvedAccountId) {
      payload.accountId = resolvedAccountId;
    }

    const customerId = overrideId ?? formData.id;
    if (!customerId) {
      throw new Error("Customer id is required to update the customer.");
    }

    await apiRequest<any>({
      method: "PUT",
      url: `/customers/${customerId}`,
      data: payload,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });
    return customerId;
  }

  const toggleBankSection = () => {
    if (!isLinkingAccount && !hasRequiredCustomerInfo) {
      errorToast(
        "Please add the customer's name and either email or phone before linking a bank account."
      );
      return;
    }

    setIsLinkingAccount((prev) => !prev);
  };

  const removeBankDetails = () => {
    setIsLinkingAccount(false);
    resetAccountForm();
  };

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

    if (
      createResponse?.status === "success" &&
      createResponse?.data?.id
    ) {
      return { id: createResponse.data.id as string, isNew: true };
    }

    throw new Error("Failed to create bank account.");
  }

  async function linkAccountToCustomer(
    customerId: string,
    accountId: string
  ) {
    await apiRequest<any>({
      method: "PUT",
      url: `/customers/${customerId}`,
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
      let customerId: string | undefined = formData.id || undefined;

      if (isEditing) {
        customerId = await updateCustomer();
      } else {
        customerId = await createCustomer();
        setFormData((prev) => ({ ...prev, id: customerId }));
      }

      if (isLinkingAccount) {
        const { id: accountId, isNew } = await saveBankAccount();
        if (isNew || formData.accountId !== accountId) {
          await linkAccountToCustomer(customerId, accountId);
        }
        setFormData((prev) => ({ ...prev, accountId }));
        setAccountForm((prev) => ({ ...prev, id: accountId }));
      }

      successToast(isEditing ? "Customer updated" : "Customer added");
      setSelectedCustomer(null);
      onClose();
    } catch (err: any) {
      errorToast(err?.message || "Failed to save");
    } finally {
      setIsSubmitting(false);
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
    setIsLinkingAccount(false);
    resetAccountForm();
    setIsSubmitting(false);
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };

  // Pre-fill on edit
  useEffect(() => {
    if (!selectedCustomer) return;

    let isActive = true;
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

    if (selectedCustomer.accountId) {
      setIsLinkingAccount(true);
      setAccountForm({ ...ACCOUNT_INITIAL_STATE });

      const fetchAccount = async () => {
        try {
          const response = await apiRequest<any>({
            method: "GET",
            url: `/customers/${selectedCustomer.id}/account`,
          });

          if (!isActive) return;

          const accountData = response?.data;
          if (accountData) {
            setAccountForm({
              id: accountData.id || selectedCustomer.accountId || "",
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

    return () => {
      isActive = false;
    };
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
                      const phoneNumber = formData.phone.replace(
                        /^\+\d{1,4}-/,
                        ""
                      );
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
                value={
                  formData.phone
                    ? formData.phone.replace(/^\+\d{1,4}-/, "")
                    : ""
                }
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

        <div className="rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={toggleBankSection}
            className="flex w-full items-center justify-between px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                Bank Account
              </p>
              <p className="text-xs text-gray-500">
                {isLinkingAccount
                  ? "Bank details will be linked when you save this customer."
                  : "Add bank account details for this customer."}
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {isEditing ? "Update Customer" : "Save Customer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
