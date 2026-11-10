import React, { useMemo, useState } from "react";
import { Search, Check, Clock, X, Banknote, Calendar, FileText } from "lucide-react";
import { todayStr } from "../utils";

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

// 1,25,000 or 72,500.50 (two decimals only when there are paise)
const inr = (n) => {
  const value = Number(n || 0);
  return value.toLocaleString("en-IN", Number.isInteger(value) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const th = { padding: "8px 10px", fontWeight: 600, color: "#374151", textAlign: "left", whiteSpace: "nowrap" };
const td = { padding: "9px 10px", color: "#111827", verticalAlign: "top" };

const pdfBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #1a8f5c",
  background: "#fff",
  color: "#1a8f5c",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

export default function AdminPaymentsView({ payments, packhouses, onApprove, onReject, onDownloadPdf }) {
  const today = todayStr();
  // Opens on today's pending requests; the other filters are one tap away.
  const [status, setStatus] = useState("Pending");
  const [date, setDate] = useState(today);
  const [allDates, setAllDates] = useState(false);
  const [packhouseId, setPackhouseId] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const packhouseName = (p) => p.packhouseName || packhouses.find((ph) => ph.id === p.packhouseId)?.name || "";

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments
      .filter(
        (p) =>
          (status === "All" || p.status === status) &&
          (allDates || p.date === date) &&
          (!packhouseId || p.packhouseId === Number(packhouseId)) &&
          (!q ||
            p.growerName.toLowerCase().includes(q) ||
            (p.code || "").toLowerCase().includes(q) ||
            (p.account || "").toLowerCase().includes(q))
      )
      .sort(
        (a, b) =>
          packhouseName(a).localeCompare(packhouseName(b)) || a.growerName.localeCompare(b.growerName) || a.id - b.id
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, status, date, allDates, packhouseId, search, packhouses]);

  const total = rows.reduce((sum, p) => sum + Number(p.amount || 0), 0);

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
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Calendar size={18} style={{ flexShrink: 0, color: "#6b7280" }} />
          <input
            type="date"
            className="book-form-control"
            style={{ flex: 1, opacity: allDates ? 0.45 : 1 }}
            value={date}
            onChange={(e) => {
              if (e.target.value) {
                setDate(e.target.value);
                setAllDates(false);
              }
            }}
          />
          <button
            type="button"
            onClick={() => setAllDates((v) => !v)}
            style={{
              border: `1px solid ${allDates ? "#1a8f5c" : "#d1d5db"}`,
              background: allDates ? "#1a8f5c" : "#fff",
              color: allDates ? "#fff" : "#374151",
              borderRadius: 20,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            All dates
          </button>
        </div>

        <select
          className="book-form-control"
          aria-label="Packhouse"
          style={{ marginBottom: 10 }}
          value={packhouseId}
          onChange={(e) => setPackhouseId(e.target.value)}
        >
          <option value="">All packhouses</option>
          {packhouses.map((ph) => (
            <option key={ph.id} value={ph.id}>
              {ph.name}
            </option>
          ))}
        </select>

        <div className="admin-order-search">
          <Search size={18} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search grower, account..." />
        </div>

        <div className="admin-order-filters">
          {["Pending", "Approved", "Rejected", "All"].map((item) => (
            <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>
              {item}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 10px" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {rows.length} {rows.length === 1 ? "request" : "requests"} · <strong style={{ color: "#111827" }}>₹{inr(total)}</strong>
          </span>
          <button
            type="button"
            style={pdfBtn}
            onClick={() => onDownloadPdf({ date: allDates ? "" : date, status: status === "All" ? "" : status, packhouseId })}
          >
            <FileText size={14} /> PDF
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="admin-order-empty">
            <Banknote size={42} />
            <h3>No payment requests found</h3>
            <p>{status === "Pending" && !allDates && date === today ? "Nothing pending today. Try All dates or another status." : "Try a different filter."}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12 }}>
            <table style={{ width: "100%", minWidth: 540, borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={th}>Packhouse Name</th>
                  <th style={th}>Account name</th>
                  <th style={th}>A/c no.</th>
                  <th style={th}>IFSC</th>
                  <th style={{ ...th, textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} onClick={() => setSelected(p)} style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer" }}>
                    <td style={td}>{packhouseName(p)}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 700 }}>{p.growerName.toUpperCase()}</div>
                      {p.account && <div style={{ fontSize: 11, color: "#6b7280" }}>{p.account}</div>}
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{p.accountNumber || "-"}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{p.ifsc || "-"}</td>
                    <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <strong>₹{inr(p.amount)}</strong>
                      {status === "All" && (
                        <div style={{ marginTop: 3 }}>
                          <StatusBadge status={p.status} />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e5e7eb", background: "#f9fafb" }}>
                  <td style={{ ...td, fontWeight: 700 }} colSpan={4}>
                    Total ({rows.length})
                  </td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>₹{inr(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="admin-order-sheet-overlay" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="admin-order-sheet">
            <div className="admin-sheet-handle" />
            <div className="admin-sheet-header">
              <div>
                <h3>{selected.code}</h3>
                <span>{selected.growerName.toUpperCase()}</span>
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
                  <span className="admin-detail-value">
                    {selected.growerName.toUpperCase()}
                    {selected.growerCity ? ` - ${selected.growerCity}` : ""}
                  </span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Account name</span>
                  <span className="admin-detail-value">{selected.account || "-"}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">A/c no.</span>
                  <span className="admin-detail-value">{selected.accountNumber || "-"}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">IFSC</span>
                  <span className="admin-detail-value">{selected.ifsc || "-"}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Packhouse</span>
                  <span className="admin-detail-value">{packhouseName(selected)}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Date</span>
                  <span className="admin-detail-value">{selected.date}</span>
                </div>
                <div className="admin-detail-row">
                  <span className="admin-detail-key">Amount</span>
                  <span className="admin-detail-value">
                    <strong className="admin-green-text">₹{inr(selected.amount)}</strong>
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
