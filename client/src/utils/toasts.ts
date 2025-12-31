import toast from "react-hot-toast";

// Generate a consistent ID for each unique message to prevent duplicates
const generateToastId = (message: string, type: string) => {
  return `${type}-${message.replace(/\s+/g, '-').toLowerCase()}`;
};

export const successToast = (message: string) => {
  const id = generateToastId(message, 'success');
  toast.success(message, { id });
};

export const errorToast = (message: string) => {
  const id = generateToastId(message, 'error');
  toast.error(message, {
    id,
    duration: 6000,
  });
};

export const warnToast = (message: string) => {
  const id = generateToastId(message, 'warn');
  toast(message, {
    id,
    icon: "⚠️",
    duration: 5000,
    style: {
      borderLeft: "4px solid #f59e0b",
    },
  });
};

export const infoToast = (message: string) => {
  const id = generateToastId(message, 'info');
  toast(message, {
    id,
    icon: "ℹ️",
    duration: 4000,
    style: {
      borderLeft: "4px solid #3b82f6",
    },
  });
};
