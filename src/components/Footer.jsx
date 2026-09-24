import React from "react";
import { CalendarPlus, BarChart3, Users, Banknote, Package } from "lucide-react";

const TABS = [
  { id: "incoming", label: "Incoming", icon: CalendarPlus },
  { id: "stock", label: "Stock", icon: BarChart3 },
  { id: "growers", label: "Growers", icon: Users },
  { id: "payments", label: "Payments", icon: Banknote },
  { id: "orders", label: "Orders", icon: Package },
];

export default function Footer({ activeTab, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.4 : 2} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
