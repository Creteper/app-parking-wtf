import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import "./App.css";
import App from "./App.tsx";
import ParkingForm from "./pages/ParkingForm.tsx";
import Auth from "./pages/Auth.tsx";
import BindVehiclePlate from "./pages/BindVehiclePlate.tsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/bind-vehicle",
    element: <BindVehiclePlate />,
  },
  {
    path: "/parkingForm",
    element: <ParkingForm />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
