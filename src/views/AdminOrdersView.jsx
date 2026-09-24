import React, { useMemo, useState } from "react";
import { Search, MapPin, Package, Building2, Check, Clock, X, MessageCircle, Truck } from "lucide-react";
import ChallanFormSheet from "../components/ChallanFormSheet";

function totalCrates(order) {
  return order.items.reduce((total, item) => total + Number(item.qty || 0), 0);
}

function StatusBadge({ status }) {
  return <span className={`admin-order-badge badge-${status.toLowerCase()}`}>{status}</span>;
}

export default function AdminOrdersView({ orders, onStatusChange, onSaveChallan, onWhatsApp }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [challanOrder, setChallanOrder] = useState(null);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (filter !== "All") {
      list = list.filter((order) => order.status === filter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (order) =>
          order.customer.name.toLowerCase().includes(q) ||
          order.code.toLowerCase().includes(q) ||
          (order.customer.city || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter, search]);

  function handleStatusChange(id, status) {
    onStatusChange(id, status);
    setSelectedOrder(null);
  }

  async function handleSaveChallan(id, payload) {
    await onSaveChallan(id, payload);
    setChallanOrder(null);
    setSelectedOrder(null);
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
            placeholder="Search customer, order ID..."
          />
        </div>

        <div className="admin-order-filters">
          {["All", "Pending", "Confirmed", "Dispatched"].map((item) => (
            <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>

        <div className="admin-orders-list">
          {filteredOrders.length === 0 ? (
            <div className="admin-order-empty">
              <Package size={42} />
              <h3>No orders found</h3>
              <p>Try a different filter or search.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div className="admin-order-card" key={order.id} onClick={() => setSelectedOrder(order)}>
                <div className="admin-order-head">
                  <div>
                    <div className="admin-order-id">{order.code}</div>
                    <div className="admin-order-customer">{order.customer.name}</div>
                    <div className="admin-order-meta">
                      <MapPin size={12} />
                      {order.customer.city}
                      <span>·</span>
                      {order.order_date}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="admin-order-body">
                  {order.items.map((item, index) => (
                    <div className="admin-order-item" key={index}>
                      <span>
                        <strong>{item.brand}</strong> {item.variety} · {item.quality}
                      </span>
                      <strong>{item.qty} cr</strong>
                    </div>
                  ))}
                </div>

                <div className="admin-order-footer">
                  <span>
                    <Package size={14} />
                    {totalCrates(order)} crates
                  </span>
                  <span>
                    <Building2 size={13} />
                    {order.packhouse.name.replace("PH-", "PH")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailSheet
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onWhatsApp={onWhatsApp}
          onOpenChallan={() => setChallanOrder(selectedOrder)}
        />
      )}

      <ChallanFormSheet
        open={!!challanOrder}
        order={challanOrder}
        onClose={() => setChallanOrder(null)}
        onSave={handleSaveChallan}
      />
    </>
  );
}

function OrderDetailSheet({ order, onClose, onStatusChange, onWhatsApp, onOpenChallan }) {
  const hasChallan = !!order.truck;

  return (
    <div className="admin-order-sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-order-sheet">
        <div className="admin-sheet-handle" />
        <div className="admin-sheet-header">
          <div>
            <h3>{order.code}</h3>
            <span>{order.customer.name}</span>
          </div>
          <button onClick={onClose} className="admin-sheet-close">
            <X size={18} />
          </button>
        </div>

        <div className="admin-sheet-body">
          <div className="admin-detail-section">
            <div className="admin-detail-title">Order Information</div>
            <DetailRow label="Status" value={<StatusBadge status={order.status} />} />
            <DetailRow label="Date" value={order.order_date} />
            <DetailRow label="Customer" value={order.customer.name} />
            {order.customer.mobile && (
              <DetailRow label="Mobile" value={<a href={`tel:${order.customer.mobile}`}>{order.customer.mobile}</a>} />
            )}
            <DetailRow label="City" value={order.customer.city} />
            <DetailRow label="Packhouse" value={order.packhouse.name} />
            {order.remarks && <DetailRow label="Remarks" value={order.remarks} />}
          </div>

          <div className="admin-detail-section">
            <div className="admin-detail-title">
              Items <span>{totalCrates(order)} crates total</span>
            </div>
            {order.items.map((item, index) => (
              <DetailRow key={index} label={`${item.brand} ${item.variety} · ${item.quality}`} value={`${item.qty} crates`} />
            ))}
          </div>

          {hasChallan && (
            <>
              <div className="admin-detail-section">
                <div className="admin-detail-title">Dispatch Details</div>
                <DetailRow label="Truck" value={order.truck} />
                <DetailRow label="Driver" value={order.driver} />
                <DetailRow label="Transporter" value={order.transporter} />
                <DetailRow label="Weight" value={order.weight != null ? `${Number(order.weight).toLocaleString("en-IN")} kg` : "—"} />
                <DetailRow label="Freight" value={order.freight != null ? `₹${Number(order.freight).toLocaleString("en-IN")}` : "—"} />
                <DetailRow label="INAM" value={order.inam != null ? `₹${Number(order.inam).toLocaleString("en-IN")}` : "—"} />
                <DetailRow
                  label="To Pay"
                  value={
                    order.to_pay != null ? (
                      <strong className="admin-green-text">₹{Number(order.to_pay).toLocaleString("en-IN")}</strong>
                    ) : (
                      "—"
                    )
                  }
                />
                <DetailRow label="Delivery" value={`${order.del_date || ""} ${order.del_time || ""}`.trim() || "—"} />
              </div>

              <div className="admin-detail-section">
                <div className="admin-detail-title">Documents</div>
                <DetailRow
                  label="Bilty"
                  value={order.bilty ? <span className="admin-document-ok">✓ Uploaded</span> : <span className="admin-document-pending">Pending</span>}
                />
                <DetailRow
                  label="Kaanta Parchi"
                  value={order.kaanta ? <span className="admin-document-ok">✓ Uploaded</span> : <span className="admin-document-pending">Pending</span>}
                />
              </div>
            </>
          )}

          {order.status !== "Dispatched" && (
            <div className="admin-order-actions">
              <button className="admin-confirm-btn" onClick={() => onStatusChange(order.id, "Confirmed")}>
                <Check size={16} /> Confirm
              </button>
              <button className="admin-pending-btn" onClick={() => onStatusChange(order.id, "Pending")}>
                <Clock size={16} /> Pending
              </button>
            </div>
          )}

          <button className="admin-whatsapp-btn" style={{ marginBottom: 10 }} onClick={onOpenChallan}>
            <Truck size={17} /> {hasChallan ? "Edit Dispatch Details" : "Enter Dispatch Details"}
          </button>

          <button className="admin-whatsapp-btn" onClick={() => onWhatsApp(order)}>
            <MessageCircle size={17} /> Resend WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="admin-detail-row">
      <span className="admin-detail-key">{label}</span>
      <span className="admin-detail-value">{value}</span>
    </div>
  );
}
