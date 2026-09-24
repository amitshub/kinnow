import React, { useState, useEffect } from "react";
import { X, Save, Info } from "lucide-react";

export default function AddIncomingSheet({ open, editing, growers, onClose, onSave }) {
  const [form, setForm] = useState({ grower: "", weight: "", price: "", amount: "", time: "" });

  useEffect(() => {
    if (open) {
      setForm({
        grower: editing?.growerId || "",
        weight: editing?.weight ?? "",
        price: editing?.price ?? "",
        amount: editing?.amount ?? "",
        time: editing?.time || new Date().toTimeString().slice(0, 5),
      });
    }
  }, [open, editing]);

  function handleNumChange(key, val) {
    const next = { ...form, [key]: val };
    const w = parseFloat(key === "weight" ? val : form.weight) || 0;
    const p = parseFloat(key === "price" ? val : form.price) || 0;
    if (w && p) next.amount = (w * p).toFixed(0);
    setForm(next);
  }

  function handleSave() {
    if (!form.grower) return onSave(null, "Select a grower");
    if (!parseFloat(form.weight)) return onSave(null, "Enter weight");
    if (!parseFloat(form.price)) return onSave(null, "Enter price");
    const grower = growers.find((g) => g.id === form.grower);
    onSave({
      growerId: form.grower,
      growerName: grower?.name || "",
      city: grower?.city || "",
      weight: parseFloat(form.weight) || 0,
      price: parseFloat(form.price) || 0,
      amount: parseFloat(form.amount) || 0,
      time: form.time,
    });
  }

  return (
    <div className={`sheet-bg ${open ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="sheet-title">{editing ? "Edit Incoming" : "Add Incoming"}</div>
          <button className="sheet-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="form-group">
            <label className="form-label">Grower / Vendor</label>
            <select className="form-control" value={form.grower} onChange={(e) => setForm((f) => ({ ...f, grower: e.target.value }))}>
              <option value="">Select grower…</option>
              {growers.map((g) => (
                <option key={g.id} value={g.id}>{g.name} – {g.city}</option>
              ))}
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Weight (KG)</label>
              <input className="form-control" type="number" min="1" placeholder="e.g. 4200" value={form.weight} onChange={(e) => handleNumChange("weight", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹/KG)</label>
              <input className="form-control" type="number" step="0.5" min="0" placeholder="e.g. 18.5" value={form.price} onChange={(e) => handleNumChange("price", e.target.value)} />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-control" type="number" placeholder="Auto-calculated" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} style={{ background: "#f8faf8" }} />
            </div>
            <div className="form-group">
              <label className="form-label">Arrival Time</label>
              <input className="form-control" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
            </div>
          </div>

          <div className="alert alert-green">
            <Info size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
            Amount = Weight × Price. You can override it manually if needed.
          </div>

          <button className="btn btn-green" onClick={handleSave}>
            <Save size={16} /> {editing ? "Update Entry" : "Save Incoming"}
          </button>
        </div>
      </div>
    </div>
  );
}
