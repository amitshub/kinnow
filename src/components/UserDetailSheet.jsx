import React from "react";
import { X, Phone, Building2, ShieldCheck, Users as UsersIcon, Pencil, Trash2, Calendar } from "lucide-react";

export default function UserDetailSheet({ open, user, onClose, onEdit, onDelete, onToggleStatus }) {
  return (
    <div className={`sheet-bg ${open ? "open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div className="sheet-title">User Detail</div>
            <button className="sheet-close" onClick={onClose}>
              <X size={16} />
            </button>
        </div>
        {user && (
          <div className="sheet-body">
            <div style={{ textAlign: "center" }}>
              <div className="detail-avatar" style={user.role === "Admin" ? { background: "var(--purple-light)", borderColor: "#ddd6fe", color: "var(--purple)" } : undefined}>
                {user.role === "Admin" ? <ShieldCheck size={24} /> : user.name[0]}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{user.name}</div>
              <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 6 }}>
                <span className={`badge ${user.role === "Admin" ? "badge-purple" : "badge-blue"}`}>
                  {user.role === "Admin" ? <ShieldCheck size={10} /> : <UsersIcon size={10} />} {user.role}
                </span>
                <span className={`badge ${user.status === "Active" ? "badge-green" : "badge-gray"}`}>{user.status}</span>
              </div>
            </div>

            <div className="divider" />

            <div className="detail-row">
              <span className="detail-key"><Phone size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Mobile</span>
              <span className="detail-val"><a href={`tel:${user.mobile}`} style={{ color: "var(--green)" }}>{user.mobile}</a></span>
            </div>
            {user.packhouse !== "-" && (
              <div className="detail-row">
                <span className="detail-key"><Building2 size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Packhouse</span>
                <span className="detail-val">{user.packhouse}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-key"><Calendar size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Created</span>
              <span className="detail-val">{user.createdDate}</span>
            </div>

            <div className="divider" />

            <div className="toggle-row">
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Account Active</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>Deactivated users can't log in</div>
              </div>
              <button
                className={`toggle-switch ${user.status === "Active" ? "on" : ""}`}
                onClick={() => onToggleStatus(user.id)}
                aria-label="Toggle active status"
              >
                <span className="knob" />
              </button>
            </div>

            <div style={{ height: 6 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button className="btn btn-outline" onClick={() => onEdit(user.id)}>
                <Pencil size={15} /> Edit
              </button>
              <button className="btn btn-outline" style={{ color: "var(--red)", borderColor: "#fca5a5" }} onClick={() => onDelete(user.id)}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
