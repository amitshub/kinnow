import React from "react";
import { ChevronLeft, ChevronRight, Calendar, LogOut } from "lucide-react";
import { fmtDateLabel } from "../utils";

const SUBTITLES = {
  incoming: "Daily Incoming",
  stock: "Stock Summary",
  growers: "Grower Management",
  payments: "Payment Requests",
};

// Only these tabs are scoped to a single day, so only they show the switcher.
const DATE_SCOPED_TABS = new Set(["incoming", "stock"]);

/**
 * Top bar: brand + tab subtitle + avatar (+ optional logout), with an inline
 * date switcher shown only for date-scoped screens (Incoming / Stock).
 */
export default function Header({ activeTab, selectedDate, onDateChange, initial = "P", onLogout }) {
  return (
   <div className="topbar">
  <div className="topbar-row">

    <div className="topbar-left">

      <div className="topbar-logo">
        <img
          src="/logo.webp"
          alt="Shiv Bhola Group"
        />
      </div>

      <div>
        <div className="topbar-title">KinnowERP</div>
        <div className="topbar-sub">
          {SUBTITLES[activeTab] || "Packhouse"}
        </div>
      </div>

    </div>

    <div className="topbar-actions">

      <div className="topbar-avatar">
        {initial}
      </div>

      {onLogout && (
        <button
          className="logout-btn"
          onClick={onLogout}
          aria-label="Logout"
        >
          <LogOut size={15} />
        </button>
      )}

    </div>

  </div>
</div>
  );
}
