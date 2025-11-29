import React, { useEffect, useState } from "react";
import { apiRequest } from "../../../utils/apiConnector";
import { errorToast, successToast } from "../../../utils/toasts";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";

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
      const accountPayload = {
        bankName: formData.bankName.trim(),
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        branchName: formData.branchName.trim(),
        accountNo: formData.accountNo.trim(),
        upiId: formData.upiId.trim(),
      };

      if (existingAccount) {
        const updateResponse = await apiRequest({
          method: "PUT",
          url: `/accounts/${existingAccount.id}`,
          data: accountPayload,
          headers: { Accept: "*/*", "Content-Type": "application/json" },
        });

        if (updateResponse?.status === "success") {
          successToast("Account updated");
          onAccountLinked();
        } else {
          throw new Error("Update failed");
        }
      } else {
        // Create new account
        const createResponse = await apiRequest({
          method: "POST",
          url: "/accounts",
          data: accountPayload,
          headers: { Accept: "*/*", "Content-Type": "application/json" },
        });

        if (createResponse?.status === "success" && createResponse?.data?.id) {
          const accountId = createResponse.data.id;
          
          const updateEntityResponse = await apiRequest({
            method: "PUT",
            url: `/${entityType}s/${entityId}`,
            data: { accountId },
            headers: { Accept: "*/*", "Content-Type": "application/json" },
          });

          if (updateEntityResponse?.status === "success") {
            successToast("Account linked");
            onAccountLinked();
          } else {
            throw new Error("Linking failed");
          }
        } else {
          throw new Error("Creation failed");
        }
      }
    } catch (error) {
      const err = error as { message?: string };
      errorToast(err?.message || "Operation failed");
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
      title={`${existingAccount ? "Edit" : "Link"} Account`}
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
              className="w-full border border-gray-300 px-3 py-2"
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
              className="w-full border border-gray-300 px-3 py-2"
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
              className="w-full border border-gray-300 px-3 py-2"
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
              className="w-full border border-gray-300 px-3 py-2"
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
              className="w-full border border-gray-300 px-3 py-2"
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