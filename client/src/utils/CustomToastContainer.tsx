import { ToastContainer } from "react-toastify";

const CustomToastContainer = () => {
  return (
    <div className="custom-toast-container">
      <ToastContainer
        data-testid="sLR40"
        position="top-center"
        limit={3}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme={localStorage.getItem("theme") === "dark" ? "dark" : "light"}
        toastStyle={{ borderRadius: "1rem", textTransform: "capitalize" }}
        closeButton={false}
      />
    </div>
  );
};

export default CustomToastContainer;
