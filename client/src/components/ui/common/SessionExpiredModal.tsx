import React from "react";
import { AlertTriangle, LogIn } from "lucide-react";
import Button from "../Button";

interface SessionExpiredModalProps {
  isOpen: boolean;
  onLogin: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onLogin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px]" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col items-center border-b border-gray-200 bg-gradient-to-r from-amber-50 via-white to-white p-6 dark:border-gray-700 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Session Expired
          </h3>
        </div>

        <div className="p-6 text-center">
          <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            Your session has expired due to inactivity or your credentials are no longer valid.
            Please log in again to continue.
          </p>

          <Button
            onClick={onLogin}
            className="w-full"
            icon={LogIn}
          >
            Log In Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
