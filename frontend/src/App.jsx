import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, Outlet } from "react-router-dom";

import { useAuth } from "./context/useAuth";
import DashboardLayout from "./layouts/DashboardLayout/DashboardLayout";

const Login = lazy(() => import("./pages/Login/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Patients = lazy(() => import("./pages/Patients/Patients"));
const Doctors = lazy(() => import("./pages/Doctors/Doctors"));
const Settings = lazy(() => import("./pages/Settings/Settings"));

function ProtectedRoute() {
  const { user } = useAuth();

  return user ? <DashboardLayout /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return user.role === "superadmin" ? (
    <Outlet />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="route-loading">Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/doctors" element={<Doctors />} />

          <Route element={<AdminRoute />}>
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
