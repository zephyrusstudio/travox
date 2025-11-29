import React from "react";
import { AlertTriangle, LogIn } from "lucide-react";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />

      <div className="relative bg-white dark:bg-gray-800 shadow-2xl w-full max-w-md transform transition-all animate-in zoom-in-95 duration-300 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex flex-col items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-700">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Session Expired
          </h3>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your session has expired due to inactivity or your credentials are no longer valid. 
            Please log in again to continue.
          </p>

          <button
            onClick={onLogin}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <LogIn className="w-5 h-5" />
            Log In Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
