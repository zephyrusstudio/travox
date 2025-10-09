import { toast } from "react-toastify";

export const successToast = (message: string) => {
  toast.success(message, {
    theme: "light",
    autoClose: 2000,
  });
};

export const errorToast = (message: string) => {
  toast.error(message, {
    theme: "light",
    autoClose: 10000,
    pauseOnHover: true,
    closeOnClick: true,
  });
};

export const warnToast = (message: string) => {
  toast.warning(message, {
    theme: "light",
    autoClose: 10000,
    pauseOnHover: true,
    closeOnClick: true,
  });
};

export const infoToast = (message: string) => {
  toast.info(message, {
    theme: "light",
    autoClose: 5000,
  });
};
