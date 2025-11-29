import toast from "react-hot-toast";

export const successToast = (message: string) => {
  toast.success(message);
};

export const errorToast = (message: string) => {
  toast.error(message, {
    duration: 6000,
  });
};

export const warnToast = (message: string) => {
  toast(message, {
    icon: "⚠️",
    duration: 5000,
    style: {
      borderLeft: "4px solid #f59e0b",
    },
  });
};

export const infoToast = (message: string) => {
  toast(message, {
    icon: "ℹ️",
    duration: 4000,
    style: {
      borderLeft: "4px solid #3b82f6",
    },
  });
};
