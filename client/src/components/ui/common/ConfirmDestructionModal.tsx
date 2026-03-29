import React from "react";
import { AlertTriangle } from "lucide-react";
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
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/40 dark:bg-rose-900/20">
          <div className="rounded-lg bg-rose-100 p-2 dark:bg-rose-900/40">
            <AlertTriangle className="h-4 w-4 text-rose-700 dark:text-rose-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">This action is permanent.</p>
            <p className="mt-1 text-sm text-rose-800 dark:text-rose-300">{message}</p>
          </div>
        </div>
        {error && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
            {error}
          </div>
        )}
        <div className="form-footer !pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            className="disabled:opacity-60"
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
