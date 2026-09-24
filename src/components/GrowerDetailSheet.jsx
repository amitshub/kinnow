import React from "react";
import { X, MapPin, CreditCard, Phone, Pencil, Trash2, Banknote } from "lucide-react";
import { fmt, fmtAmt } from "../utils";

export default function GrowerDetailSheet({ open, grower, totals, onClose, onEdit, onDelete, onRaisePayment }) {
  return (
    <div className={`sheet-bg ${open ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="sheet-title">Grower Detail</div>
          <button className="sheet-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {grower && (
          <div className="sheet-body">
            <div style={{ textAlign: "center" }}>
              <div className="detail-avatar">{grower.name[0]}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{grower.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                <MapPin size={11} /> {grower.city}
              </div>
            </div>

            <div className="divider" />

            <div className="detail-row">
              <span className="detail-key"><Phone size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Mobile</span>
              <span className="detail-val">
                <a href={`tel:${grower.mob}`} style={{ color: "var(--green)" }}>{grower.mob}</a>
              </span>
            </div>
            <div className="detail-row"><span className="detail-key">Address</span><span className="detail-val">{grower.address}</span></div>
            <div className="detail-row">
              <span className="detail-key"><CreditCard size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Account</span>
              <span className="detail-val">{grower.account}</span>
            </div>

            <div className="divider" />

            <div className="detail-row"><span className="detail-key">Total Delivered</span><span className="detail-val" style={{ color: "var(--blue)", fontWeight: 700 }}>{fmt(totals.totalKg)} KG</span></div>
            <div className="detail-row"><span className="detail-key">Total Value</span><span className="detail-val" style={{ color: "var(--green-dark)", fontWeight: 700 }}>{fmtAmt(totals.totalAmt)}</span></div>
            <div className="detail-row"><span className="detail-key">Approved Payments</span><span className="detail-val" style={{ color: "var(--green-dark)", fontWeight: 700 }}>{fmtAmt(totals.paid)}</span></div>
            <div className="detail-row"><span className="detail-key">Balance Due</span><span className="detail-val" style={{ color: "var(--red)", fontWeight: 700 }}>{fmtAmt(totals.totalAmt - totals.paid)}</span></div>

            <div style={{ height: 14 }} />
            <button className="btn btn-green" onClick={() => onRaisePayment(grower.id)}>
              <Banknote size={16} /> Raise Payment Request
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <button className="btn btn-outline" onClick={() => onEdit(grower.id)}>
                <Pencil size={15} /> Edit
              </button>
              <button className="btn btn-outline" style={{ color: "var(--red)", borderColor: "#fca5a5" }} onClick={() => onDelete(grower.id)}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
