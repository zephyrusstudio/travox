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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] px-4"
          onClick={() => setShowOverlay(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 border border-amber-500 shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowOverlay(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon and Title */}
            <div className="flex items-start mb-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 mr-3 flex-shrink-0">
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
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-pretty">
                {details}
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end">
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
