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
  passportNo?: string;
  aadhaarNo?: string;
  visaNo?: string;
  gstin?: string;
  accountId?: string;
  totalBookings: number;
  totalSpent: number;
  createdBy?: string;
  updatedBy?: string;
  isDeleted?: boolean;
  archivedAt?: string;
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
    passportNo: "",
    aadhaarNo: "",
    visaNo: "",
    gstin: "",
    accountId: "",
    createdAt: "",
    totalBookings: 0,
    totalSpent: 0,
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
  const [showDefaultConfirmation, setShowDefaultConfirmation] = useState(false);

  // Validation
  const phoneDigits = formData.phone?.replace(/^\+\d{1,4}-/, "") ?? "";
  const hasPhone = phoneDigits.length > 0;
  const isPhonePatternValid = /^[0-9]{10}$/.test(phoneDigits);
  const phoneError = hasPhone && !isPhonePatternValid
    ? "Enter exactly 10 digits."
    : "";
  const isPhoneValid = !hasPhone || phoneError === "";

  const trimmedEmail = formData.email?.trim() ?? "";
  const hasEmail = trimmedEmail.length > 0;
  const isEmailPatternValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const emailError = hasEmail && !isEmailPatternValid
    ? "Enter a valid email."
    : "";
  const isEmailValid = !hasEmail || emailError === "";
  
  const hasEitherContact = hasPhone || hasEmail;

  const isAadhaarValid =
    !formData.aadhaarNo || /^[0-9]{12}$/.test(formData.aadhaarNo);
  const isGstinValid = !formData.gstin || /^[0-9A-Z]{15}$/.test(formData.gstin);
  const isPassportValid =
    !formData.passportNo || /^[A-Z0-9]{1,8}$/.test(formData.passportNo);

  const hasName = Boolean(formData.name?.trim());
  
  // Account is valid if either:
  // 1. UPI ID is provided
  // 2. Account No + IFSC are both provided
  // Bank Name and Branch Name are optional
  const hasUpiId = Boolean(accountForm.upiId.trim());
  const hasBankDetails = Boolean(
    accountForm.accountNo.trim() && accountForm.ifscCode.trim()
  );
  const isAccountDetailsValid =
    !isLinkingAccount || hasUpiId || hasBankDetails;

  const canSubmit = useMemo(
    () =>
      hasName &&
      isEmailValid &&
      isPhoneValid &&
      isAadhaarValid &&
      isGstinValid &&
      isPassportValid &&
      isAccountDetailsValid,
    [
      hasName,
      isEmailValid,
      isPhoneValid,
      isAadhaarValid,
      isGstinValid,
      isPassportValid,
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

  async function createCustomer(): Promise<string> {
    const finalEmail = trimmedEmail || (hasPhone ? undefined : "esanchar@gmail.com");
    const finalPhone = formData.phone || (hasEmail ? undefined : "+91-9332100485");

    const payload: Record<string, unknown> = {
      name: formData.name?.trim(),
      email: finalEmail,
      phone: finalPhone,
      passportNo: formData.passportNo || undefined,
      aadhaarNo: formData.aadhaarNo || undefined,
      visaNo: formData.visaNo || undefined,
      gstin: formData.gstin || undefined,
    };

    type CreateCustomerResponse = { data?: { id?: string } };
    const response = await apiRequest<CreateCustomerResponse>({
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
      email: trimmedEmail || undefined,
      phone: formData.phone || undefined,
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

    await apiRequest<unknown>({
      method: "PUT",
      url: `/customers/${customerId}`,
      data: payload,
      headers: { Accept: "*/*", "Content-Type": "application/json" },
    });
    return customerId;
  }

  const toggleBankSection = () => {
    if (!isLinkingAccount && !hasName) {
      errorToast(
        "Please add the customer's name before linking a bank account."
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
      bankName: accountForm.bankName.trim() || undefined,
      ifscCode: accountForm.ifscCode.trim().toUpperCase() || undefined,
      branchName: accountForm.branchName.trim() || undefined,
      accountNo: accountForm.accountNo.trim() || undefined,
      upiId: accountForm.upiId.trim() || undefined,
    };

    // Validate: Must have either UPI ID or (Account No + IFSC)
    const hasUpiId = Boolean(trimmedAccount.upiId);
    const hasBankDetails = Boolean(
      trimmedAccount.accountNo && trimmedAccount.ifscCode
    );

    if (!hasUpiId && !hasBankDetails) {
      throw new Error(
        "Please provide either UPI ID OR both Account Number and IFSC Code."
      );
    }

    if (accountForm.id) {
      await apiRequest<{ status: string; data?: { id?: string } }>({
        method: "PUT",
        url: `/accounts/${accountForm.id}`,
        data: trimmedAccount,
        headers: { Accept: "*/*", "Content-Type": "application/json" },
      });

      return { id: accountForm.id, isNew: false };
    }

    const createResponse = await apiRequest<{ status: string; data?: { id?: string } }>({
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
    await apiRequest<unknown>({
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
    
    // Show confirmation UI if both contact fields are empty
    if (!hasPhone && !hasEmail) {
      setShowDefaultConfirmation(true);
      return;
    }
    
    await performSubmit();
  };

  const performSubmit = async () => {
    setIsSubmitting(true);

    try {
      let customerId: string | undefined = formData.id || undefined;

      if (isEditing) {
        customerId = await updateCustomer();
      } else {
        customerId = await createCustomer();
        setFormData((prev) => ({ ...prev, id: customerId ?? "" }));
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        errorToast(err.message);
      } else {
        errorToast("Failed to save");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDefaults = async () => {
    setShowDefaultConfirmation(false);
    await performSubmit();
  };

  const handleCancelDefaults = () => {
    setShowDefaultConfirmation(false);
  };

  const onClose = () => {
    setFormData({
      id: "",
      orgId: "",
      name: "",
      email: "",
      phone: "",
      passportNo: "",
      aadhaarNo: "",
      visaNo: "",
      gstin: "",
      accountId: "",
      createdAt: "",
      totalBookings: 0,
      totalSpent: 0,
      createdBy: "",
      updatedBy: "",
      isDeleted: false,
      updatedAt: "",
    });
    setIsdCode("+91");
    setIsLinkingAccount(false);
    resetAccountForm();
    setIsSubmitting(false);
    setShowDefaultConfirmation(false);
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
      totalSpent: selectedCustomer.totalSpent || 0,
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
          interface AccountResponse {
            data?: {
              id?: string;
              bankName?: string;
              ifscCode?: string;
              branchName?: string;
              accountNo?: string;
              upiId?: string;
            };
          }
          const response = await apiRequest<AccountResponse>({
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
        } catch (error: unknown) {
          if (!isActive) return;
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to load linked bank account details.";
          errorToast(errorMessage);
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
      {showDefaultConfirmation ? (
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Missing Contact Information
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Both email and phone are missing. The customer will be saved with default values:
            </p>
          </div>

          <div className="bg-gray-50 p-4 space-y-2">
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-700 w-20">Email:</span>
              <span className="text-sm text-gray-900 font-mono">esanchar@gmail.com</span>
            </div>
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-700 w-20">Phone:</span>
              <span className="text-sm text-gray-900 font-mono">+91-9332100485</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can edit these values later from the customer details page.
          </p>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDefaults}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDefaults}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submitForm} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-gray-300 px-3 py-2"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email {!hasPhone && <span className="text-rose-600">*</span>}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full border border-gray-300 px-3 py-2"
              placeholder="Enter email address"
            />
            {emailError && (
              <p className="mt-1 text-xs text-rose-600">{emailError}</p>
            )}
            {!hasEitherContact && (
              <p className="mt-1 text-xs text-amber-600">Email or phone is required</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone {!hasEmail && <span className="text-rose-600">*</span>}
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
                className="w-20 border border-gray-300 rounded-l-lg px-3 py-2 bg-gray-50 text-center"
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
                className="flex-1 border border-l-0 border-gray-300 rounded-r-lg px-3 py-2"
                placeholder="Enter phone number"
              />
            </div>
            {phoneError && (
              <p className="mt-1 text-xs text-rose-600">{phoneError}</p>
            )}
            {!hasEitherContact && (
              <p className="mt-1 text-xs text-amber-600">Email or phone is required</p>
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
              className="w-full border border-gray-300 px-3 py-2"
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
              className="w-full border border-gray-300 px-3 py-2"
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
              className="w-full border border-gray-300 px-3 py-2"
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
              className="w-full border border-gray-300 px-3 py-2"
            />
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
                  Bank Name
                </label>
                <input
                  type="text"
                  value={accountForm.bankName}
                  onChange={(e) => setAccountField("bankName", e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2"
                  placeholder="Enter bank name (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
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
                    IFSC Code
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={accountForm.branchName}
                    onChange={(e) =>
                      setAccountField("branchName", e.target.value)
                    }
                    className="w-full border border-gray-300 px-3 py-2"
                    placeholder="Enter branch name (optional)"
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
                    placeholder="Enter UPI ID"
                  />
                </div>
              </div>

              {!isAccountDetailsValid && (
                <p className="text-xs text-rose-600">
                  Provide either UPI ID or Bank A/C No. and IFSC Code.
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
            {isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
      )}
    </Modal>
  );
};

export default CustomerFormModal;
