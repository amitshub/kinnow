import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

export default function AddGrowerSheet({ open, editing, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", address: "", city: "", mob: "", account: "", account_number: "", ifsc_code: "" });

  useEffect(() => {
    if (open) {
      setForm({
        name: editing?.name || "",
        address: editing?.address || "",
        city: editing?.city || "",
        mob: editing?.mob || "",
        account: editing?.account || "",
        account_number: editing?.accountNumber || "",
        ifsc_code: editing?.ifsc || "",
      });
    }
  }, [open, editing]);

  function handleSave() {
    if (!form.name.trim()) return onSave(null, "Enter grower name");
    if (!form.account.trim()) return onSave(null, "Enter payment account name");
    if (form.account_number && !/^\d{9,18}$/.test(form.account_number)) return onSave(null, "Account number must be 9 to 18 digits");
    if (form.ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc_code)) return onSave(null, "IFSC code must be 11 characters, e.g. SBIN0001234");
    onSave({ ...form, name: form.name.trim(), account: form.account.trim() });
  }

  return (
    <div className={`sheet-bg ${open ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="sheet-title">{editing ? "Edit Grower" : "Add Grower"}</div>
          <button className="sheet-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="form-group">
            <label className="form-label">Grower / Vendor Name</label>
            <input className="form-control" placeholder="e.g. Ram Singh" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-control" placeholder="Village / Street / Area" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">City / Station</label>
              <input className="form-control" placeholder="e.g. Abohar" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <input className="form-control" type="tel" placeholder="9XXXXXXXXX" value={form.mob} onChange={(e) => setForm((f) => ({ ...f, mob: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Account Name</label>
            <input className="form-control" placeholder="e.g. Ram Singh – PNB 4521" value={form.account} onChange={(e) => setForm((f) => ({ ...f, account: e.target.value }))} />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                className="form-control"
                type="tel"
                inputMode="numeric"
                placeholder="e.g. 123456789012"
                value={form.account_number}
                onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value.replace(/\D/g, "").slice(0, 18) }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IFSC Code</label>
              <input
                className="form-control"
                autoCapitalize="characters"
                placeholder="e.g. SBIN0001234"
                value={form.ifsc_code}
                onChange={(e) => setForm((f) => ({ ...f, ifsc_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) }))}
              />
            </div>
          </div>

          <button className="btn btn-green" onClick={handleSave}>
            <Save size={16} /> {editing ? "Update Grower" : "Save Grower"}
          </button>
        </div>
      </div>
    </div>
  );
}
