import React, { useMemo, useState } from "react";
import { Search, Check, Clock, X, Banknote, CreditCard } from "lucide-react";

function badgeClassFor(status) {
  // Reusing the order-status badge classes so this looks consistent with
  // the rest of the admin UI without needing new CSS: dispatched ~ paid
  // (green), cancelled ~ rejected (red), pending stays pending.
  if (status === "Approved") return "badge-dispatched";
  if (status === "Rejected") return "badge-cancelled";
  return "badge-pending";
}

function StatusBadge({ status }) {
  return <span className={`admin-order-badge ${badgeClassFor(status)}`}>{status}</span>;
}

export default function AdminPaymentsView({ payments, packhouses, onApprove, onReject }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const nameFor = (id) => packhouses.find((ph) => ph.id === id)?.name || "";

  const filtered = useMemo(() => {
    let list = payments;
    if (filter !== "All") list = list.filter((p) => p.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.growerName.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q) ||
          nameFor(p.packhouseId).toLowerCase().includes(q)
      );
    }
    return list;
  }, [payments, filter, search, packhouses]);

  function handleApprove(id) {
    onApprove(id);
    setSelected(null);
  }

  function handleReject(id) {
    onReject(id);
    setSelected(null);
  }

  return (
    <>
      <div className="admin-orders-page">
        <div className="admin-order-search">
          <Search size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search grower, packhouse..."
          />
        </div>

        <div className="admin-order-filters">
          {["All", "Pending", "Approved", "Rejected"].map((item) => (
            <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>

        <div className="admin-orders-list">
          {filtered.length === 0 ? (
            <div className="admin-order-empty">
              <Banknote size={42} />
              <h3>No payment requests found</h3>
              <p>Try a different filter or search.</p>
            </div>
          ) : (
            filtered.map((p) => (
              <div className="admin-order-card" key={p.id} onClick={() => setSelected(p)}>
                <div className="admin-order-head">
                  <div>
                    <div className="admin-order-id">{p.code}</div>
                    <div className="admin-order-customer">{p.growerName}</div>
                    <div className="admin-order-meta">
                      {nameFor(p.packhouseId)}
                      <span>·</span>
                      {p.date}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="admin-order-footer">
                  <span>
                    <CreditCard size={14} />
                    {p.account}
                  </span>
                  <span>
                    <strong>₹{Number(p.amount).toLocaleString("en-IN")}</strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selected && (
        <div className="admin-order-sheet-overlay" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="admin-order-sheet">
            <div className="admin-sheet-handle" />
            <div className="admin-sheet-header">
              <div>
                <h3>{selected.code}</h3>
                <span>{selected.growerName}</span>
              </div>
              <button onClick={() => setSelected(null)} className="admin-sheet-close">
                <X size={18} />
              </button>
            </div>

            <div className="admin-sheet-body">
              <div className="admin-detail-section">
                <div className="admin-detail-title">Payment Request</div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Status</span>
                  <span className="admin-detail-value">
                    <StatusBadge status={selected.status} />
                  </span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Grower</span>
                  <span className="admin-detail-value">{selected.growerName}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Account</span>
                  <span className="admin-detail-value">{selected.account}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Packhouse</span>
                  <span className="admin-detail-value">{nameFor(selected.packhouseId)}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Date</span>
                  <span className="admin-detail-value">{selected.date}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Amount</span>
                  <span className="admin-detail-value">
                    <strong className="admin-green-text">₹{Number(selected.amount).toLocaleString("en-IN")}</strong>
                  </span>
                </div>
                {selected.note && (
                  <div className="admin-detail-row">
                    <span className="admin-detail-key">Note</span>
                    <span className="admin-detail-value">{selected.note}</span>
                  </div>
                )}
              </div>

              {selected.status === "Pending" && (
                <div className="admin-order-actions">
                  <button className="admin-confirm-btn" onClick={() => handleApprove(selected.id)}>
                    <Check size={16} /> Mark as Paid
                  </button>
                  <button className="admin-pending-btn" onClick={() => handleReject(selected.id)}>
                    <Clock size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
