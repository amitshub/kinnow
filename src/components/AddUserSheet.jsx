import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";


export default function AddUserSheet({ open, editing, packhouses, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", mobile: "", role: "Packhouse User", packhouse: "", password: "" });

  useEffect(() => {
    if (open) {
      setForm({
        name: editing?.name || "",
        mobile: editing?.mobile || "",
        role: editing?.role || "Packhouse User",
        packhouse: editing?.packhouse && editing.packhouse !== "-" ? editing.packhouse : (packhouses[0]?.name || ""),
        password: editing?.password || "",
      });
    }
  }, [open, editing]);

  function handleSave() {
    if (!form.name.trim()) return onSave(null, "Enter user's name");
    if (!/^\d{10}$/.test(form.mobile.trim())) return onSave(null, "Enter a valid 10-digit mobile number");
    if (!editing && !form.password.trim()) return onSave(null, "Set a temporary password");
    onSave({
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      role: form.role,
      packhouse: form.role === "Admin" ? "-" : form.packhouse,
      password: form.password || editing?.password || "1234",
    });
  }

  return (
    <div className={`sheet-bg ${open ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="sheet-title">{editing ? "Edit User" : "Create New User"}</div>
          <button className="sheet-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-control" placeholder="e.g. Vikram Sharma" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input className="form-control" type="tel" placeholder="9XXXXXXXXX" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <div className="role-toggle">
              <button
                type="button"
                className={`role-opt ${form.role === "Packhouse User" ? "active" : ""}`}
                onClick={() => setForm((f) => ({ ...f, role: "Packhouse User" }))}
              >
                Packhouse User
              </button>
              <button
                type="button"
                className={`role-opt ${form.role === "Admin" ? "active" : ""}`}
                onClick={() => setForm((f) => ({ ...f, role: "Admin" }))}
              >
                Admin
              </button>
            </div>
          </div>

          {form.role === "Packhouse User" && (
            <div className="form-group">
              <label className="form-label">Assigned Packhouse</label>
              <select className="form-control" value={form.packhouse} onChange={(e) => setForm((f) => ({ ...f, packhouse: e.target.value }))}>
                {packhouses.map((ph) => (
                  <option key={ph.id} value={ph.name}>{ph.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{editing ? "Reset Password (optional)" : "Temporary Password"}</label>
            <input
              className="form-control"
              type="text"
              placeholder={editing ? "Leave blank to keep current password" : "e.g. 1234"}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>

          <button className="btn btn-green" onClick={handleSave}>
            <Save size={16} /> {editing ? "Update User" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}
