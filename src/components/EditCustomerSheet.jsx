import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { cleanMobile } from "../mobile";

// Rendered only while open (the parent mounts it per customer), so the fields always start
// with the customer's current details.
export default function EditCustomerSheet({ customer, onClose, onSave }) {
  const [form, setForm] = useState({
    name: customer.name || "",
    mobile: customer.mobile || "",
    city: customer.city || "",
    address: customer.address || "",
  });
  const [saving, setSaving] = useState(false);

  const setF = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSave() {
    if (!form.name.trim()) return alert("Enter the customer's name");
    if (form.mobile && !/^\d{10}$/.test(form.mobile)) return alert("Mobile number must be exactly 10 digits");
    setSaving(true);
    const ok = await onSave(customer.id, {
      name: form.name.trim(),
      mobile: form.mobile || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <div className="admin-order-sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-order-sheet">
        <div className="admin-sheet-handle" />
        <div className="admin-sheet-header">
          <div>
            <h3>Edit Customer</h3>
            <span>{customer.name}</span>
          </div>
          <button onClick={onClose} className="admin-sheet-close">
            <X size={18} />
          </button>
        </div>

        <div className="admin-sheet-body">
          <div className="book-form-group">
            <label className="book-form-label">Customer Name</label>
            <input className="book-form-control" value={form.name} onChange={(e) => setF("name", e.target.value)} />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">Mobile (10 digits)</label>
            <input
              className="book-form-control"
              type="tel"
              inputMode="numeric"
              value={form.mobile}
              onChange={(e) => setF("mobile", cleanMobile(e.target.value))}
              placeholder="9XXXXXXXXX"
            />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">City</label>
            <input className="book-form-control" value={form.city} onChange={(e) => setF("city", e.target.value)} placeholder="e.g. Agartala" />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">Address</label>
            <input
              className="book-form-control"
              value={form.address}
              onChange={(e) => setF("address", e.target.value)}
              placeholder="e.g. MG Bazar, Kalapatty"
            />
          </div>

          <button className="book-submit-btn" style={{ marginTop: 8 }} onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? "Saving…" : "Save Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
