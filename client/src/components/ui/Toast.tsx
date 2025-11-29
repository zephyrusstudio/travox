import toast, { Toaster, resolveValue } from "react-hot-toast";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const Toast = () => {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      containerStyle={{
        top: 16,
        right: 16,
      }}
      toastOptions={{
        duration: 4000,
      }}
    >
      {(t) => (
        <div
          style={{
            opacity: t.visible ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          <div
            className="flex items-start gap-3 p-4 w-[360px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {/* Icon */}
            {t.type === "success" && (
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            )}
            {t.type === "error" && (
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            )}
            {t.type === "blank" && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            {t.type === "custom" && (
              <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            )}
            {t.type === "loading" && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-500 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
              </div>
            )}

            {/* Message */}
            <div className="flex-1 min-w-0 py-1 break-words">
              <span className="block">{resolveValue(t.message, t)}</span>
            </div>

            {/* Close button */}
            {t.type !== "loading" && (
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-shrink-0 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </Toaster>
  );
};

export default Toast;
