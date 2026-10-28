import React, { useEffect, useState } from "react";
import { X, Save, Camera, Trash2 } from "lucide-react";
import { api } from "../api";
import { cleanMobile } from "../mobile";
import { shrinkImage } from "../imageUtils";

// Rendered only while open (the parent mounts it per customer), so the fields always start
// with the customer's current details.
export default function EditCustomerSheet({ customer, onClose, onSave, onUploadCard, onDeleteCard }) {
  const [form, setForm] = useState({
    name: customer.name || "",
    mobile: customer.mobile || "",
    city: customer.city || "",
    address: customer.address || "",
  });
  const [saving, setSaving] = useState(false);

  // Business card photo: loaded on demand (it isn't part of the customer list, which keeps that small).
  const [hasCard, setHasCard] = useState(!!customer.has_card);
  const [cardUrl, setCardUrl] = useState(null);
  const [cardBusy, setCardBusy] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    let url = null;
    let cancelled = false;
    if (customer.has_card) {
      api
        .getCustomerCard(customer.id)
        .then((blob) => {
          if (cancelled) return;
          url = URL.createObjectURL(blob);
          setCardUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  async function pickCard(file) {
    if (!file) return;
    setCardBusy(true);
    const prepared = await shrinkImage(file);
    const saved = await onUploadCard(customer.id, prepared);
    if (saved) {
      setHasCard(true);
      setCardUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(prepared);
      });
    }
    setCardBusy(false);
  }

  async function removeCard() {
    if (!window.confirm("Remove this business card photo?")) return;
    setCardBusy(true);
    const ok = await onDeleteCard(customer.id);
    if (ok) {
      setHasCard(false);
      setCardUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    }
    setCardBusy(false);
  }

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

          <div className="book-form-group">
            <label className="book-form-label">Business Card</label>
            {hasCard && cardUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <img
                  src={cardUrl}
                  alt="Business card"
                  onClick={() => setZoom(true)}
                  style={{ width: 110, height: 68, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb", cursor: "zoom-in" }}
                />
                <button
                  type="button"
                  onClick={removeCard}
                  disabled={cardBusy}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "none", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>{hasCard ? "Loading…" : "No business card uploaded yet"}</div>
            )}
            <label
              htmlFor="edit-customer-card"
              className="book-form-control"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: cardBusy ? "default" : "pointer" }}
            >
              <Camera size={16} /> {cardBusy ? "Saving…" : hasCard ? "Retake / Replace card photo" : "Take Photo / Upload card"}
            </label>
            <input
              id="edit-customer-card"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              disabled={cardBusy}
              onChange={(e) => {
                pickCard(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <button className="book-submit-btn" style={{ marginTop: 8 }} onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? "Saving…" : "Save Customer"}
          </button>
        </div>
      </div>

      {zoom && cardUrl && (
        <div
          onClick={() => setZoom(false)}
          style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}
        >
          <img src={cardUrl} alt="Business card" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
