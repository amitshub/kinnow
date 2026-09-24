import React, { useState, useEffect } from "react";
import { X, Save, Truck } from "lucide-react";
import { fmt } from "../utils";

export default function DaySummarySheet({ open, onClose, onSave, totalIncoming, prevBalance, existing }) {
  const [form, setForm] = useState({ eagle: "", dispatched: "" });

  useEffect(() => {
    if (open) {
      setForm({ eagle: existing?.eagleA ?? "", dispatched: existing?.dispatched ?? "" });
    }
  }, [open, existing]);

  const eagle = parseFloat(form.eagle) || 0;
  const gradeB = Math.max(0, totalIncoming - eagle);
  const dispatched = parseFloat(form.dispatched) || 0;
  const balance = prevBalance + totalIncoming - dispatched;
  const balColor = balance < 0 ? "var(--red)" : balance < 1000 ? "var(--amber)" : "var(--green-dark)";

  function handleSave() {
    onSave({ eagleA: eagle, gradeB, dispatched, balance, incoming: totalIncoming, prevBalance });
  }

  return (
    <div className={`sheet-bg ${open ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="sheet-title">Day Summary & Grading</div>
          <button className="sheet-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="alert alert-green">
            Total incoming today: <strong>{fmt(totalIncoming)} KG</strong> · Previous balance: <strong>{fmt(prevBalance)} KG</strong>
          </div>

          <div className="grading-box">
            <div className="grade-row">
              <div className="grade-label">🦅 Eagle A</div>
              <input className="grade-input" type="number" min="0" placeholder="0" value={form.eagle} onChange={(e) => setForm((f) => ({ ...f, eagle: e.target.value }))} />
              <div className="grade-unit">KG</div>
            </div>
            <div className="grade-row">
              <div className="grade-label">⭐ Grade B</div>
              <input className="grade-input" type="number" value={gradeB} readOnly style={{ background: "#f3f4f6" }} />
              <div className="grade-unit">KG</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: -6, marginBottom: 12, marginLeft: 98 }}>
              Auto: Total − Eagle A
            </div>

            <div className="divider" />

            <div className="grade-row" style={{ marginBottom: 0 }}>
              <div className="grade-label"><Truck size={13} /> Dispatched</div>
              <input className="grade-input" type="number" min="0" placeholder="0" value={form.dispatched} onChange={(e) => setForm((f) => ({ ...f, dispatched: e.target.value }))} />
              <div className="grade-unit">KG</div>
            </div>

            <div className="balance-box">
              <div className="balance-row"><span>Previous carry-over</span><span>{fmt(prevBalance)} KG</span></div>
              <div className="balance-row"><span>Today's incoming</span><span>+ {fmt(totalIncoming)} KG</span></div>
              <div className="balance-row"><span>Dispatched today</span><span>- {fmt(dispatched)} KG</span></div>
              <div className="balance-row total"><span>Closing Balance</span><span style={{ color: balColor }}>= {fmt(balance)} KG</span></div>
            </div>
          </div>

          <div style={{ height: 14 }} />
          <button className="btn btn-green" onClick={handleSave}>
            <Save size={16} /> Save Day Summary
          </button>
        </div>
      </div>
    </div>
  );
}
