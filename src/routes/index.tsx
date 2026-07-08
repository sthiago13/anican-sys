import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "../components/Layout/MainLayout";
import { Login } from "../modules/auth/components/Login";
import { DashboardView } from "../modules/dashboard/components/DashboardView";
import { PatientsView } from "../modules/patients/components/PatientsView";
import { RegistrationStepper } from "../modules/patients/components/RegistrationStepper";
import { DonationsView } from "../modules/donations/components/DonationsView";
import { SettingsView } from "../modules/settings/components/SettingsView";
import { DiagnosticsView } from "../modules/diagnostics/components/DiagnosticsView";
import { UsersView } from "../modules/users/components/UsersView";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardView />,
      },
      {
        path: "pacientes",
        element: <PatientsView />,
      },
      {
        path: "registro",
        element: <RegistrationStepper />,
      },
      {
        path: "donaciones",
        element: <DonationsView />,
      },
      {
        path: "configuracion",
        element: <SettingsView />,
      },
      {
        path: "diagnosticos",
        element: <DiagnosticsView />,
      },
      {
        path: "usuarios",
        element: <UsersView />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
