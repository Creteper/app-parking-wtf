import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import "./App.css";
import App from "./App.tsx";
import ParkingForm from "./pages/ParkingForm.tsx";
import Auth from "./pages/Auth.tsx";
import BindVehiclePlate from "./pages/BindVehiclePlate.tsx";
import ParkingsPage from "./pages/Parkings.tsx";
import NavigationPage from "./pages/Navigation.tsx";
import ParkingRecordsPage from "./pages/ParkingRecords.tsx";

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
  {
    path: "/parkings",
    element: <ParkingsPage />,
  },
  {
    path: "/navigation/:parkingLotId",
    element: <NavigationPage />,
  },
  {
    path: "/parkingRecords",
    element: <ParkingRecordsPage />,
  }
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
