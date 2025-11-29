import React from "react";
import Modal from "../Modal";
import Button from "../Button";

interface ConfirmDestructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  error?: string | null;
  onConfirm: () => void;
  loading: boolean;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDestructionModal: React.FC<ConfirmDestructionModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  error,
  onConfirm,
  loading,
  confirmText = "Yes, delete",
  cancelText = "Cancel",
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700">{message}</p>
        {error && (
          <div className="border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            className="px-3 py-2"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            className="px-3 py-2 disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
            variant="danger"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDestructionModal;