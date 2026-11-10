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
  MessageCircle,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";
import { useBranding } from "../../context/useBranding";


function WhatsAppIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.48 0 .14 5.34.14 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.9 11.9 0 0 0 5.74 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.43-8.43ZM12.05 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 1 1 8.38 4.63Zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.8-1.49-1.78-1.66-2.08-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.5 1.7.64.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { branding } = useBranding();

  const isAdmin = user?.role === "superadmin";

  const menu = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Patients", icon: Users, path: "/patients" },
    { label: "Appointments", icon: CalendarDays, path: "/appointments" },
    { label: "Doctors", icon: Stethoscope, path: "/doctors" },
    {
      label: "WhatsApp Messaging",
      icon: WhatsAppIcon,
      path: "/whatsapp",
    },
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
