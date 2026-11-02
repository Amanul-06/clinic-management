import { Navigate, Route, Routes, Outlet } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Settings from "./pages/Settings";
import DashboardLayout from "./layouts/DashboardLayout";

import { useAuth } from "./context/useAuth";

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
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />

        <Route element={<AdminRoute />}>
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
