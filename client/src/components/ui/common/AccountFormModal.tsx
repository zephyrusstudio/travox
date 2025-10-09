import React, { useEffect, useState } from "react";
import { apiRequest } from "../../../utils/apiConnector";
import { errorToast, successToast } from "../../../utils/toasts";
import Button from "../Button";
import Modal from "../Modal";

export type AccountFormState = {
  id?: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  accountNo: string;
  upiId: string;
};

type AccountFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType: "customer" | "vendor";
  entityName: string;
  existingAccount?: AccountFormState | null;
  onAccountLinked: () => void;
};

const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  entityId,
  entityType,
  entityName,
  existingAccount,
  onAccountLinked,
}) => {
  const [formData, setFormData] = useState<AccountFormState>({
    bankName: "",
    ifscCode: "",
    branchName: "",
    accountNo: "",
    upiId: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form with existing account data
  useEffect(() => {
    if (existingAccount) {
      setFormData({
        id: existingAccount.id,
        bankName: existingAccount.bankName || "",
        ifscCode: existingAccount.ifscCode || "",
        branchName: existingAccount.branchName || "",
        accountNo: existingAccount.accountNo || "",
        upiId: existingAccount.upiId || "",
      });
    } else {
      setFormData({
        bankName: "",
        ifscCode: "",
        branchName: "",
        accountNo: "",
        upiId: "",
      });
    }
  }, [existingAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId) return;

    setIsSubmitting(true);
    try {
      const url = existingAccount 
        ? `/${entityType}s/${entityId}/account/${existingAccount.id}`
        : `/${entityType}s/${entityId}/account`;
      
      const method = existingAccount ? "PUT" : "POST";
      
      const payload = {
        bankName: formData.bankName.trim(),
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        branchName: formData.branchName.trim(),
        accountNo: formData.accountNo.trim(),
        upiId: formData.upiId.trim(),
      };

      const response = await apiRequest({
        method,
        url,
        data: payload,
        headers: { Accept: "*/*", "Content-Type": "application/json" },
      });

      if (response?.status === "success") {
        successToast(existingAccount ? "Account updated successfully" : "Account linked successfully");
        onAccountLinked();
      } else {
        throw new Error("Failed to save account");
      }
    } catch (error) {
      const err = error as { message?: string };
      errorToast(err?.message || "Failed to save account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      bankName: "",
      ifscCode: "",
      branchName: "",
      accountNo: "",
      upiId: "",
    });
    onClose();
  };

  const isValid = Boolean(
    formData.bankName.trim() && 
    formData.ifscCode.trim() && 
    formData.branchName.trim() && 
    formData.accountNo.trim()
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${existingAccount ? "Edit" : "Link"} Account - ${entityName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name *
            </label>
            <input
              type="text"
              required
              value={formData.bankName}
              onChange={(e) =>
                setFormData({ ...formData, bankName: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter bank name"
            />
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code *
            </label>
            <input
              type="text"
              required
              value={formData.ifscCode}
              onChange={(e) =>
                setFormData({ 
                  ...formData, 
                  ifscCode: e.target.value.toUpperCase()
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter IFSC code"
              maxLength={11}
            />
          </div>

          {/* Branch Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Name *
            </label>
            <input
              type="text"
              required
              value={formData.branchName}
              onChange={(e) =>
                setFormData({ ...formData, branchName: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter branch name"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number *
            </label>
            <input
              type="text"
              required
              value={formData.accountNo}
              onChange={(e) =>
                setFormData({ 
                  ...formData, 
                  accountNo: e.target.value.replace(/\D/g, "")
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter account number"
            />
          </div>

          {/* UPI ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UPI ID
            </label>
            <input
              type="text"
              value={formData.upiId}
              onChange={(e) =>
                setFormData({ ...formData, upiId: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter UPI ID (optional)"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
          >
            {existingAccount ? "Update Account" : "Link Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountFormModal;