import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  BarChart3,
  UserRoundCog,
  Settings,
  LogOut,
  Activity,
  X,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";
import { useBranding } from "../../context/useBranding";

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { branding } = useBranding();

  const isAdmin = user?.role === "superadmin";

  const menu = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Patients", icon: Users, path: "/patients" },
    { label: "Appointments", icon: CalendarDays, disabled: true },
    { label: "Doctors", icon: Stethoscope, path: "/doctors" },
    { label: "Visit Records", icon: ClipboardList, disabled: true },
    ...(isAdmin
      ? [
          { label: "Reports", icon: BarChart3, disabled: true },
          { label: "Staff Management", icon: UserRoundCog, disabled: true },
          { label: "Settings", icon: Settings, path: "/settings" },
        ]
      : []),
  ];

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-symbol">
            {branding.logo ? (
              <img src={branding.logo} alt="Clinic logo" />
            ) : (
              <Activity size={25} />
            )}
          </div>

          <div className="brand-details">
            <strong>{branding.clinicName || "Your Clinic"}</strong>
            <span>Management Portal</span>
          </div>

          <button
            className="mobile-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {menu.map((item) => {
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <div className="nav-item nav-disabled" key={item.label}>
                  <Icon size={19} />
                  <span>{item.label}</span>
                  <span className="coming-soon">Soon</span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar">{user?.name?.charAt(0) || "U"}</div>

            <div className="user-details">
              <strong>{user?.name}</strong>
              <span>{isAdmin ? "Super Admin" : "Receptionist"}</span>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
