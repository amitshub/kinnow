import React, { useState } from "react";
import { X, Truck, Camera, FileCheck2 } from "lucide-react";

function ChallanFormSheet({ open, order, onClose, onSave, onUploadFile }) {
  const [form, setForm] = useState(() => ({
    truck: order?.truck || "",
    driver: order?.driver || "",
    transporter: order?.transporter || "",
    weight: order?.weight ?? "",
    freight: order?.freight ?? "",
    advance: order?.advance ?? "",
    inam: order?.inam ?? "",
    del_date: order?.del_date || "",
    del_time: order?.del_time ? order.del_time.slice(0, 5) : "",
  }));

  const [bilty, setBilty] = useState(order?.bilty || null);
  const [kaanta, setKaanta] = useState(order?.kaanta || null);
  const [uploading, setUploading] = useState({ bilty: false, kaanta: false });

  if (!open || !order) return null;

  function setF(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const toPay = (parseFloat(form.freight) || 0) - (parseFloat(form.advance) || 0);

  async function handleFileChange(field, file) {
    if (!file) return;
    setUploading((u) => ({ ...u, [field]: true }));
    try {
      const updated = await onUploadFile(order.id, field, file);
      if (field === "bilty") setBilty(updated.bilty);
      else setKaanta(updated.kaanta);
    } catch (e) {
      alert(e.message || "Upload failed");
    } finally {
      setUploading((u) => ({ ...u, [field]: false }));
    }
  }

  async function handleSave() {
    if (!form.truck.trim()) return alert("Enter the truck number");
    await onSave(order.id, {
      truck: form.truck.trim(),
      driver: form.driver.trim() || null,
      transporter: form.transporter.trim() || null,
      weight: form.weight === "" ? null : parseFloat(form.weight),
      freight: form.freight === "" ? null : parseFloat(form.freight),
      advance: form.advance === "" ? null : parseFloat(form.advance),
      to_pay: toPay,
      inam: form.inam === "" ? null : parseFloat(form.inam),
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
            <label className="book-form-label">Advance (₹)</label>
            <input className="book-form-control" type="number" value={form.advance} onChange={(e) => setF("advance", e.target.value)} placeholder="e.g. 20000" />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">To Pay (₹) — auto-calculated</label>
            <input className="book-form-control" type="number" value={toPay} readOnly style={{ background: "#f3f4f6", color: "#374151", fontWeight: 600 }} />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">INAM (₹)</label>
            <input className="book-form-control" type="number" value={form.inam} onChange={(e) => setF("inam", e.target.value)} placeholder="e.g. 4100" />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">Delivery Date</label>
            <input className="book-form-control" type="date" value={form.del_date} onChange={(e) => setF("del_date", e.target.value)} />
          </div>

          <div className="book-form-group">
            <label className="book-form-label">Delivery Time</label>
            <input className="book-form-control" type="time" value={form.del_time} onChange={(e) => setF("del_time", e.target.value)} />
          </div>

          <FileUploadField
            label="Bilty"
            value={bilty}
            uploading={uploading.bilty}
            onPick={(file) => handleFileChange("bilty", file)}
          />

          <FileUploadField
            label="Kaanta Parchi"
            value={kaanta}
            uploading={uploading.kaanta}
            onPick={(file) => handleFileChange("kaanta", file)}
          />

          <button className="book-submit-btn" style={{ marginTop: 16 }} onClick={handleSave}>
            <Truck size={16} /> Save & Mark Dispatched
          </button>
        </div>
      </div>
    </div>
  );
}

function FileUploadField({ label, value, uploading, onPick }) {
  const inputId = `file-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const isPdf = value && value.startsWith("data:application/pdf");

  return (
    <div className="book-form-group">
      <label className="book-form-label">{label}</label>

      {value ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          {isPdf ? (
            <a href={value} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#1a8f5c" }}>
              <FileCheck2 size={16} /> View uploaded PDF
            </a>
          ) : (
            <a href={value} target="_blank" rel="noreferrer">
              <img src={value} alt={label} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
            </a>
          )}
          <span style={{ fontSize: 12, color: "#1a8f5c", fontWeight: 600 }}>✓ Uploaded</span>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>No file uploaded yet</div>
      )}

      <label htmlFor={inputId} className="book-form-control" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
        <Camera size={16} />
        {uploading ? "Uploading…" : value ? `Retake / Replace ${label}` : `Take Photo / Upload ${label}`}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => onPick(e.target.files?.[0])}
      />
    </div>
  );
}

export default ChallanFormSheet;
