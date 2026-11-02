import { Bell, Menu, Search } from "lucide-react";
import { useAuth } from "../context/useAuth";

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenuClick}>
        <Menu size={22} />
      </button>

      <div className="topbar-search">
        <Search size={19} />
        <input placeholder="Search patients, appointments..." />
        <kbd>⌘ K</kbd>
      </div>

      <div className="topbar-right">
        <button className="notification-button" aria-label="Notifications">
          <Bell size={20} />
          <span />
        </button>

        <div className="topbar-profile">
          <div className="user-avatar small">
            {user?.name?.charAt(0) || "U"}
          </div>

          <div>
            <strong>{user?.name}</strong>
            <span>
              {user?.role === "superadmin" ? "Administrator" : "Reception"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
