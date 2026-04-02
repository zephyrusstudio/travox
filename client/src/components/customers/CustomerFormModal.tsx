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
  onCustomerSaved?: () => void | Promise<void>;
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
  onCustomerSaved,
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
    const payload: Record<string, unknown> = {
      name: formData.name?.trim(),
      email: trimmedEmail || undefined,
      phone: formData.phone || undefined,
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
      if (onCustomerSaved) {
        try {
          await onCustomerSaved();
        } catch (refreshError: unknown) {
          if (refreshError instanceof Error) {
            errorToast(
              `Customer was saved, but list refresh failed: ${refreshError.message}`
            );
          } else {
            errorToast("Customer was saved, but list refresh failed.");
          }
        }
      }
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
      <form onSubmit={submitForm} className="space-y-4">
        <div className="form-section">
        <div className="form-grid">
          {/* Name */}
          <div>
            <label className="form-label">
              Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="form-input"
            />
          </div>

          {/* Email */}
          <div>
            <label className="form-label">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="form-input"
              placeholder="Enter email address"
            />
            {emailError && (
              <p className="form-error">{emailError}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="form-label">
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
                className="form-input !w-20 !rounded-r-none !border-r-0 !bg-gray-50 dark:!bg-gray-800 !text-center !font-medium"
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
                className="form-input flex-1 !rounded-l-none !border-l-0"
                placeholder="Enter phone number"
              />
            </div>
            {phoneError && (
              <p className="form-error">{phoneError}</p>
            )}
          </div>

          {/* Passport */}
          <div>
            <label className="form-label">
              Passport Number
            </label>
            <input
              type="text"
              value={formData.passportNo || ""}
              maxLength={PASSPORT_LEN}
              onChange={(e) => setPassport(e.target.value)}
              className="form-input"
            />
            {!isPassportValid && (
              <p className="form-error">
                Invalid passport format.
              </p>
            )}
          </div>

          {/* GSTIN */}
          <div>
            <label className="form-label">
              GSTIN
            </label>
            <input
              type="text"
              value={formData.gstin || ""}
              maxLength={GSTIN_LEN}
              onChange={(e) => setGstin(e.target.value)}
              className="form-input"
            />
            {!isGstinValid && (
              <p className="form-error">
                GSTIN must be 15 characters (A–Z, 0–9).
              </p>
            )}
          </div>

          {/* Aadhaar */}
          <div>
            <label className="form-label">
              Aadhaar Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={AADHAAR_LEN}
              value={formData.aadhaarNo || ""}
              onChange={(e) => setAadhaar(e.target.value)}
              className="form-input"
            />
            {!isAadhaarValid && (
              <p className="form-error">
                Enter exactly 12 digits.
              </p>
            )}
          </div>

          {/* Visa */}
          <div>
            <label className="form-label">
              Visa Number
            </label>
            <input
              type="text"
              value={formData.visaNo || ""}
              onChange={(e) =>
                setFormData({ ...formData, visaNo: e.target.value })
              }
              className="form-input"
            />
          </div>
        </div>
        </div>

        <div className="form-section border border-gray-200">
          <button
            type="button"
            onClick={toggleBankSection}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Bank Account
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-4 py-4">
              <div>
                <label className="form-label">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={accountForm.bankName}
                  onChange={(e) => setAccountField("bankName", e.target.value)}
                  className="form-input"
                  placeholder="Enter bank name (optional)"
                />
              </div>

              <div className="form-grid">
                <div>
                  <label className="form-label">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountForm.accountNo}
                    onChange={(e) =>
                      setAccountField("accountNo", e.target.value)
                    }
                    className="form-input"
                    placeholder="Enter account number"
                  />
                </div>

                <div>
                  <label className="form-label">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={accountForm.ifscCode}
                    onChange={(e) =>
                      setAccountField("ifscCode", e.target.value)
                    }
                    className="form-input uppercase"
                    placeholder="Enter IFSC code"
                    maxLength={11}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="form-label">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={accountForm.branchName}
                    onChange={(e) =>
                      setAccountField("branchName", e.target.value)
                    }
                    className="form-input"
                    placeholder="Enter branch name (optional)"
                  />
                </div>

                <div>
                  <label className="form-label">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={accountForm.upiId}
                    onChange={(e) => setAccountField("upiId", e.target.value)}
                    className="form-input"
                    placeholder="Enter UPI ID"
                  />
                </div>
              </div>

              {!isAccountDetailsValid && (
                <p className="form-error">
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

        <div className="form-footer">
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
    </Modal>
  );
};

export default CustomerFormModal;
