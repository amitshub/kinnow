import React from "react";

export default function StatTile({ value, label, color = "" }) {
  return (
    <div className="stat">
      <div className={`stat-num ${color}`}>{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}
