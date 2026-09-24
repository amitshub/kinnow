import React from "react";
import { Truck } from "lucide-react";
import StatTile from "../components/StatTile";
import { fmt, fmtAmt } from "../utils";

export default function IncomingView({ list, onOpenEntry }) {
  const totalWt = list.reduce((s, i) => s + i.weight, 0);
  const totalAmt = list.reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <div className="stats-strip">
        <StatTile value={fmt(totalWt)} label="KG Total" color="blue" />
        <StatTile value={fmtAmt(totalAmt)} label="Value" color="green" />
        <StatTile value={list.length} label="Entries" color="amber" />
      </div>

      <div className="section-head">
        <div className="section-title">Incoming Records</div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <Truck size={44} />
          <div className="empty-title">No incoming recorded</div>
          <div className="empty-sub">Tap the + button to add a delivery</div>
        </div>
      ) : (
        <div className="card">
          {list.map((item) => (
            <div className="in-card card-tap" key={item.id} onClick={() => onOpenEntry(item.id)}>
              <div className="in-avatar">{item.growerName[0]}</div>
              <div>
                <div className="in-name">{item.growerName}</div>
                <div className="in-meta">{fmt(item.weight)} KG · ₹{item.price.toFixed(2)}/KG</div>
              </div>
              <div className="in-right">
                <div className="in-amount">{fmtAmt(item.amount)}</div>
                <div className="in-time">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
