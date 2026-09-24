import React, { useState } from "react";
import { X, Truck } from "lucide-react";

function ChallanFormSheet({ open, order, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    truck: order?.truck || "",
    driver: order?.driver || "",
    transporter: order?.transporter || "",
    weight: order?.weight ?? "",
    freight: order?.freight ?? "",
    inam: order?.inam ?? "",
    to_pay: order?.to_pay ?? "",
    del_date: order?.del_date || "",
    del_time: order?.del_time ? order.del_time.slice(0, 5) : "",
  }));

  if (!open || !order) return null;

  function setF(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!form.truck.trim()) return alert("Enter the truck number");
    await onSave(order.id, {
      truck: form.truck.trim(),
      driver: form.driver.trim() || null,
      transporter: form.transporter.trim() || null,
      weight: form.weight === "" ? null : parseFloat(form.weight),
      freight: form.freight === "" ? null : parseFloat(form.freight),
      inam: form.inam === "" ? null : parseFloat(form.inam),
      to_pay: form.to_pay === "" ? null : parseFloat(form.to_pay),
      del_date: form.del_date || null,
      del_time: form.del_time ? `${form.del_time}:00` : null,
    });
  }

  return (
    <div className="admin-order-sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-order-sheet">
        <div className="admin-sheet-handle" />
        <div className="admin-sheet-header">
          <div>
            <h3>Dispatch Details</h3>
            <span>{order.code}</span>
          </div>
          <button onClick={onClose} className="admin-sheet-close">
            <X size={18} />
          </button>
        </div>

        <div className="admin-sheet-body">
          <div className="book-form-group">
            <label className="book-form-label">Truck Number</label>
            <input className="book-form-control" value={form.truck} onChange={(e) => setF("truck", e.target.value)} placeholder="e.g. JK11G 6411" />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">Driver Name</label>
            <input className="book-form-control" value={form.driver} onChange={(e) => setF("driver", e.target.value)} placeholder="e.g. Ahmad" />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">Transporter</label>
            <input className="book-form-control" value={form.transporter} onChange={(e) => setF("transporter", e.target.value)} placeholder="e.g. APR" />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">Weight (kg)</label>
            <input className="book-form-control" type="number" value={form.weight} onChange={(e) => setF("weight", e.target.value)} placeholder="e.g. 23300" />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">Freight (₹)</label>
            <input className="book-form-control" type="number" value={form.freight} onChange={(e) => setF("freight", e.target.value)} placeholder="e.g. 248000" />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">INAM (₹)</label>
            <input className="book-form-control" type="number" value={form.inam} onChange={(e) => setF("inam", e.target.value)} placeholder="e.g. 4100" />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">To Pay (₹)</label>
            <input className="book-form-control" type="number" value={form.to_pay} onChange={(e) => setF("to_pay", e.target.value)} placeholder="e.g. 178000" />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">Delivery Date</label>
            <input className="book-form-control" type="date" value={form.del_date} onChange={(e) => setF("del_date", e.target.value)} />
          </div>

          <div className="book-form-group" style={{ marginBottom: 0 }}>
            <label className="book-form-label">Delivery Time</label>
            <input className="book-form-control" type="time" value={form.del_time} onChange={(e) => setF("del_time", e.target.value)} />
          </div>

          <button className="book-submit-btn" style={{ marginTop: 16 }} onClick={handleSave}>
            <Truck size={16} /> Save & Mark Dispatched
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChallanFormSheet;
