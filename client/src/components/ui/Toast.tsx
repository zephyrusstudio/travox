import toast, { Toaster, resolveValue, type Toast as HotToast } from "react-hot-toast";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "warning" | "info" | "loading";

const resolveToastKind = (t: HotToast): ToastKind => {
  if (t.type === "success") return "success";
  if (t.type === "error") return "error";
  if (t.type === "loading") return "loading";

  const icon = resolveValue(t.icon, t);
  if (typeof icon === "string" && (icon.includes("⚠") || icon.includes("!"))) {
    return "warning";
  }
  if (typeof icon === "string" && icon.includes("ℹ")) {
    return "info";
  }
  if (t.type === "custom") return "warning";
  return "info";
};

const titleByKind: Record<ToastKind, string> = {
  success: "Success",
  error: "Action failed",
  warning: "Attention",
  info: "Heads up",
  loading: "Working",
};

const accentByKind: Record<ToastKind, string> = {
  success: "from-emerald-500 to-green-500",
  error: "from-rose-500 to-red-500",
  warning: "from-amber-500 to-orange-500",
  info: "from-[var(--color-primary-500)] to-[var(--color-primary-700)]",
  loading: "from-slate-500 to-slate-600",
};

const iconWrapByKind: Record<ToastKind, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300",
  error: "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
  info: "bg-[var(--color-primary-soft)] text-[var(--color-primary-700)] dark:bg-[var(--color-primary-900)]/35 dark:text-[var(--color-primary-300)]",
  loading: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const iconByKind = (kind: ToastKind) => {
  if (kind === "success") return <CheckCircle className="h-4 w-4" />;
  if (kind === "error") return <XCircle className="h-4 w-4" />;
  if (kind === "warning") return <AlertTriangle className="h-4 w-4" />;
  if (kind === "loading") {
    return <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
  }
  return <Info className="h-4 w-4" />;
};

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
        className: "",
      }}
    >
      {(t) => (
        <div
          style={{
            opacity: t.visible ? 1 : 0,
            transform: t.visible ? "translateY(0)" : "translateY(-6px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          {(() => {
            const kind = resolveToastKind(t);
            return (
              <div className="relative w-[370px] overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentByKind[kind]}`} />
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${iconWrapByKind[kind]}`}
                  >
                    {iconByKind(kind)}
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {titleByKind[kind]}
                    </p>
                    <p className="mt-0.5 break-words text-sm font-medium text-gray-900 dark:text-gray-100">
                      {resolveValue(t.message, t)}
                    </p>
                  </div>

                  {kind !== "loading" && (
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                      aria-label="Dismiss notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </Toaster>
  );
};

export default Toast;
