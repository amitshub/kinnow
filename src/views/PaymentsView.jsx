import React, { useState } from "react";
import { Banknote, CreditCard, PackageX } from "lucide-react";
import StatusBadgeIcon from "../components/StatusIcon";
import { fmtAmt, statusBadgeClass } from "../utils";

const TABS = ["all", "Pending", "Approved", "Rejected"];

export default function PaymentsView({ paymentRequests }) {
  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? paymentRequests : paymentRequests.filter((p) => p.status === filter);

  return (
    <div>
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
          <div className="empty-title">No payment requests</div>
          <div className="empty-sub">Tap the + button to raise one</div>
        </div>
      ) : (
        <div className="card">
          {list.map((p) => (
            <div className="pay-req" key={p.id}>
              <div className="pay-icon">
                <Banknote size={17} />
              </div>
              <div>
                <div className="pay-grower">{p.growerName}</div>
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
