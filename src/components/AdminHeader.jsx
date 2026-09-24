import React from "react";
import { LogOut } from "lucide-react";

export default function AdminHeader({ adminName, onLogout }) {
  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="topbar-left">
          <div className="topbar-logo"> <img
          src="/logo.webp"
          alt="Shiv Bhola Group"
        /></div>
          <div>
            <div className="topbar-title">KinnowERP</div>
            <div className="topbar-sub">Admin Dashboard</div>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="topbar-avatar">{adminName ? adminName[0] : "A"}</div>
          <button className="logout-btn" onClick={onLogout} aria-label="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
