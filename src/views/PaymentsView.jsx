import React, { useEffect, useState } from "react";
import { Banknote, CreditCard, PackageX, Calendar } from "lucide-react";
import StatusBadgeIcon from "../components/StatusIcon";
import { fmtAmt, statusBadgeClass, todayStr } from "../utils";

const TABS = ["all", "Pending", "Approved", "Rejected"];

// `focusDate` ({ date, n }) jumps the list to a date, e.g. to the date of a request that was just raised.
export default function PaymentsView({ paymentRequests, focusDate, onFocusDone }) {
  const today = todayStr();
  // Opens on today's requests (all statuses); other dates are one tap away on the calendar.
  const [filter, setFilter] = useState("all");
  const [date, setDate] = useState(today);
  const [allDates, setAllDates] = useState(false);

  useEffect(() => {
    if (focusDate && focusDate.date) {
      setDate(focusDate.date);
      setAllDates(false);
      if (onFocusDone) onFocusDone(); // used once: coming back to this tab later opens on today again
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusDate]);

  const list = paymentRequests.filter(
    (p) => (filter === "all" || p.status === filter) && (allDates || p.date === date)
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Calendar size={18} style={{ flexShrink: 0, color: "#6b7280" }} />
        <input
          type="date"
          className="book-form-control"
          aria-label="Date"
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

      <div className="filter-row">
        {TABS.map((t) => (
          <button key={t} className={`chip ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)}>
            {t === "all" ? "All" : t}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <PackageX size={44} />
          <div className="empty-title">{!allDates && date === today ? "No payment requests today" : "No payment requests"}</div>
          <div className="empty-sub">Tap the + button to raise one, or pick another date</div>
        </div>
      ) : (
        <div className="card">
          {list.map((p) => (
            <div className="pay-req" key={p.id}>
              <div className="pay-icon">
                <Banknote size={17} />
              </div>
              <div>
                <div className="pay-grower">{p.growerName.toUpperCase()}</div>
                <div className="pay-account">
                  <CreditCard size={10} style={{ verticalAlign: -1, marginRight: 3 }} />
                  {p.account}
                </div>
                <div style={{ marginTop: 4 }}>
                  <span className={`badge ${statusBadgeClass(p.status)}`}>
                    <StatusBadgeIcon status={p.status} /> {p.status}
                  </span>
                </div>
              </div>
              <div className="pay-right">
                <div className="pay-amount">{fmtAmt(p.amount)}</div>
                <div className="pay-date">{p.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
