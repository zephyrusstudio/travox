import { AlertTriangle, X } from "lucide-react";
import React, { useState } from "react";
import Button from "./Button";

interface MaintenanceBannerProps {
  isEnabled?: boolean;
  message?: string;
  details?: string;
}

const MaintenanceBanner: React.FC<MaintenanceBannerProps> = ({
  isEnabled = false,
  message = "Maintenance Mode",
  details = "We are currently performing maintenance to improve your experience. Some features may be temporarily unavailable. We apologize for any inconvenience and appreciate your patience.",
}) => {
  const [showOverlay, setShowOverlay] = useState(false);

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Thin Banner */}
      <div
        className="bg-amber-500 dark:bg-amber-600 text-white px-4 py-1.5 flex items-center justify-center cursor-pointer hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors"
        onClick={() => setShowOverlay(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setShowOverlay(true);
          }
        }}
      >
        <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
        <span className="text-xs ml-2 opacity-90">(click for details)</span>
      </div>

      {/* Overlay Modal */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-[2px]"
          onClick={() => setShowOverlay(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-2xl dark:border-amber-800/50 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowOverlay(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon and Title */}
            <div className="mb-4 flex items-start border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-white p-6 dark:border-amber-900/30 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900">
              <div className="mr-3 flex-shrink-0 rounded-xl bg-amber-100 p-2 dark:bg-amber-900/30">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {message}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Services have been temporarily restricted.
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="mb-6 px-6">
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {details}
              </p>
            </div>

            {/* Footer */}
            <div className="form-footer px-6 pb-6 pt-0">
                <Button variant="danger" onClick={() => setShowOverlay(false)}>
                  Close
                </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MaintenanceBanner;
