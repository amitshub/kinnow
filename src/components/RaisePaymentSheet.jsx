import React, { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { todayStr } from "../utils";

export default function RaisePaymentSheet({ open, presetGrowerId, presetAmount, growers, onClose, onSave }) {
  const [form, setForm] = useState({ grower: "", account: "", amount: "", date: todayStr(), note: "" });

  useEffect(() => {
    if (open) {
      const g = presetGrowerId ? growers.find((x) => x.id === presetGrowerId) : null;
      setForm({
        grower: presetGrowerId || "",
        account: g?.account || "",
        amount: presetAmount ?? "",
        date: todayStr(),
        note: "",
      });
    }
  }, [open, presetGrowerId, presetAmount]);

  function handleGrowerPick(gId) {
    const g = growers.find((x) => x.id === Number(gId));
    setForm((f) => ({ ...f, grower: gId, account: g?.account || "" }));
  }

  function handleSave() {
    if (!form.grower) return onSave(null, "Select a grower");
    if (!parseFloat(form.amount)) return onSave(null, "Enter amount");
    const g = growers.find((x) => x.id === Number(form.grower));
    onSave({
      growerId: form.grower,
      growerName: g?.name || "",
      account: g?.account || "",
      amount: parseFloat(form.amount) || 0,
      date: form.date,
      note: form.note,
    });
  }

  return (
    <div className={`sheet-bg ${open ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="sheet-title">Raise Payment Request</div>
          <button className="sheet-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="form-group">
            <label className="form-label">Grower / Vendor</label>
            <select className="form-control" value={form.grower} onChange={(e) => handleGrowerPick(e.target.value)}>
              <option value="">Select grower…</option>
              {growers.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Account Name</label>
            <input className="form-control" placeholder="Auto-filled from grower profile" value={form.account} readOnly style={{ background: "#f8faf8" }} />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-control" type="number" min="1" placeholder="e.g. 72000" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-control" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input className="form-control" placeholder="e.g. For deliveries this week…" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </div>

          <button className="btn btn-green" onClick={handleSave}>
            <Send size={16} /> Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}
