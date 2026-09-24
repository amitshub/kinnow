import React from "react";
import { BarChart3, Pencil } from "lucide-react";
import StatTile from "../components/StatTile";
import { fmt } from "../utils";

export default function StockView({ todaySummary, log, onUpdateSummary }) {
  const balance = todaySummary?.balance ?? (log[0]?.balance || 0);
  const eagleA = todaySummary?.eagleA || 0;
  const dispatched = todaySummary?.dispatched || 0;

  return (
    <div>
      <div className="stats-strip">
        <StatTile value={fmt(balance)} label="Balance KG" color="red" />
        <StatTile value={fmt(eagleA)} label="Eagle A KG" color="amber" />
        <StatTile value={fmt(dispatched)} label="Dispatched" color="purple" />
      </div>

      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={onUpdateSummary}>
        <Pencil size={15} /> Update Today's Summary
      </button>

      <div className="section-head">
        <div className="section-title">Daily Log</div>
      </div>

      {log.length === 0 ? (
        <div className="empty">
          <BarChart3 size={44} />
          <div className="empty-title">No summaries yet</div>
          <div className="empty-sub">Update today's summary to get started</div>
        </div>
      ) : (
        <div className="card">
          {log.map((d) => (
            <div className="log-card" key={d.date}>
              <div className="log-head">
                <div className="log-date">{d.date}</div>
                {d.balance < 500 ? (
                  <span className="badge badge-amber">Low Stock</span>
                ) : (
                  <span className="badge badge-green">OK</span>
                )}
              </div>
              <div className="log-grid">
                <div><div className="val">{fmt(d.incoming)}</div><div className="lbl">Incoming</div></div>
                <div><div className="val">{fmt(d.dispatched)}</div><div className="lbl">Dispatched</div></div>
                <div><div className="val" style={{ color: "var(--red)" }}>{fmt(d.balance)}</div><div className="lbl">Balance</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
