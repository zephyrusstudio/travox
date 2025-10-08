import { createRoot } from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";
import App from "./App.tsx";
import "./index.css";
import CustomToastContainer from "./utils/CustomToastContainer.tsx";

createRoot(document.getElementById("root")!).render(
  <>
    <App /> <CustomToastContainer />
  </>
);
