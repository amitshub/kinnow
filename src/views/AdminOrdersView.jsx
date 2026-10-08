import React, { useMemo, useState } from "react";
import { Search, MapPin, Package, Building2, Check, Clock, X, MessageCircle, Truck, Pencil, Trash2, ShoppingCart, Calendar } from "lucide-react";
import ChallanFormSheet from "../components/ChallanFormSheet";
import { todayStr } from "../utils";

function totalCrates(order) {
  return order.items.reduce((total, item) => total + Number(item.qty || 0), 0);
}

function StatusBadge({ status }) {
  return <span className={`admin-order-badge badge-${status.toLowerCase()}`}>{status}</span>;
}

export default function AdminOrdersView({
  orders,
  onStatusChange,
  onSaveChallan,
  onUploadFile,
  onWhatsApp,
  isAdmin,
  onWhatsAppPackhouse,
  onWhatsAppCustomer,
  onEditOrder,
  onDeleteOrder,
  presetStatusFilter,
  presetTodayOnly,
}) {
  const today = todayStr();
  const [filter, setFilter] = useState(presetStatusFilter || "All");
  const [selectedDate, setSelectedDate] = useState(today);
  const [dateOnly, setDateOnly] = useState(!!presetTodayOnly);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [challanOrder, setChallanOrder] = useState(null);

  const isToday = selectedDate === today;
  const dayLabel = isToday ? "Today's " : "";
  const dayOrders = useMemo(() => orders.filter((o) => o.order_date === selectedDate), [orders, selectedDate]);
  const dayBooked = dayOrders.length;
  const dayPendingConfirmed = dayOrders.filter((o) => o.status === "Pending" || o.status === "Confirmed").length;
  const dayDispatched = dayOrders.filter((o) => o.status === "Dispatched").length;

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (dateOnly) list = list.filter((o) => o.order_date === selectedDate);
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
  }, [orders, filter, search, dateOnly, selectedDate]);

  function handleStatusChange(id, status) {
    onStatusChange(id, status);
    setSelectedOrder(null);
  }

  async function handleSaveChallan(id, payload) {
    await onSaveChallan(id, payload);
    setChallanOrder(null);
    setSelectedOrder(null);
  }

  function handleEdit(order) {
    setSelectedOrder(null);
    onEditOrder(order);
  }

  function handleDelete(order) {
    if (!window.confirm(`Delete order ${order.code}? This can't be undone.`)) return;
    onDeleteOrder(order.id);
    setSelectedOrder(null);
  }

  function clickBooked() {
    setFilter("All");
    setDateOnly(true);
  }

  function clickDispatched() {
    setFilter("Dispatched");
    setDateOnly(true);
  }

  return (
    <>
      <div className="admin-orders-page">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Calendar size={18} style={{ flexShrink: 0, color: "#6b7280" }} />
          <input
            type="date"
            className="book-form-control"
            style={{ flex: 1 }}
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          />
          {!isToday && (
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 20, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Today
            </button>
          )}
        </div>

        <div className="home-stats" style={{ marginBottom: 14 }}>
          <button type="button" className="home-stat-card" style={{ border: "none", cursor: "pointer" }} onClick={clickBooked}>
            <div className="home-stat-icon green">
              <ShoppingCart size={17} />
            </div>
            <div className="home-stat-number">{String(dayBooked).padStart(2, "0")}</div>
            <div className="home-stat-label">{dayLabel}Booked</div>
          </button>

          <div className="home-stat-card">
            <div className="home-stat-icon orange">
              <Clock size={17} />
            </div>
            <div className="home-stat-number">{String(dayPendingConfirmed).padStart(2, "0")}</div>
            <div className="home-stat-label">Pending/Confirmed</div>
          </div>

          <button type="button" className="home-stat-card" style={{ border: "none", cursor: "pointer" }} onClick={clickDispatched}>
            <div className="home-stat-icon blue">
              <Truck size={17} />
            </div>
            <div className="home-stat-number">{String(dayDispatched).padStart(2, "0")}</div>
            <div className="home-stat-label">{dayLabel}Dispatched</div>
          </button>
        </div>

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
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => {
                setFilter(item);
              }}
            >
              {item}
            </button>
          ))}
          {dateOnly && (
            <button className="active" onClick={() => setDateOnly(false)} style={{ background: "#9333ea", borderColor: "#9333ea" }}>
              {isToday ? "Today" : selectedDate} only ×
            </button>
          )}
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
                        {item.rate ? ` · ₹${item.rate}` : ""}
                      </span>
                      <strong>{item.qty} cr</strong>
                    </div>
                  ))}
                </div>

                <div className="admin-order-footer">
                  <span>
                    <Package size={14} />
                    {totalCrates(order)} crates
                    {order.truck_tonnage ? ` · ${order.truck_tonnage} MT` : ""}
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
          isAdmin={isAdmin}
          onWhatsAppPackhouse={onWhatsAppPackhouse}
          onWhatsAppCustomer={onWhatsAppCustomer}
          onEdit={() => handleEdit(selectedOrder)}
          onDelete={() => handleDelete(selectedOrder)}
        />
      )}

      <ChallanFormSheet
        open={!!challanOrder}
        order={challanOrder}
        onClose={() => setChallanOrder(null)}
        onSave={handleSaveChallan}
        onUploadFile={onUploadFile}
      />
    </>
  );
}

function OrderDetailSheet({
  order,
  onClose,
  onStatusChange,
  onWhatsApp,
  onOpenChallan,
  isAdmin,
  onWhatsAppPackhouse,
  onWhatsAppCustomer,
  onEdit,
  onDelete,
}) {
  const hasChallan = !!order.truck;
  const isPending = order.status === "Pending";

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
            {order.truck_tonnage != null && <DetailRow label="Truck Tonnage" value={`${order.truck_tonnage} MT`} />}
            {order.remarks && <DetailRow label="Remarks" value={order.remarks} />}
          </div>

          <div className="admin-detail-section">
            <div className="admin-detail-title">
              Items <span>{totalCrates(order)} crates total</span>
            </div>
            {order.items.map((item, index) => (
              <DetailRow
                key={index}
                label={`${item.brand} ${item.variety} · ${item.quality}`}
                value={item.rate ? `${item.qty} crates @ ₹${item.rate}` : `${item.qty} crates`}
              />
            ))}
          </div>

          {hasChallan && (
            <>
              <div className="admin-detail-section">
                <div className="admin-detail-title">Dispatch Details</div>
                <DetailRow label="Truck" value={order.truck} />
                <DetailRow label="Driver" value={order.driver} />
                <DetailRow label="Driver Mobile" value={order.driver_mobile || "—"} />
                <DetailRow label="Transporter" value={order.transporter} />
                <DetailRow label="Weight" value={order.weight != null ? `${Number(order.weight).toLocaleString("en-IN")} kg` : "—"} />
                <DetailRow label="Freight" value={order.freight != null ? `₹${Number(order.freight).toLocaleString("en-IN")}` : "—"} />
                <DetailRow label="Advance" value={order.advance != null ? `₹${Number(order.advance).toLocaleString("en-IN")}` : "—"} />
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
                <DetailRow label="INAM" value={order.inam != null ? `₹${Number(order.inam).toLocaleString("en-IN")}` : "—"} />
                <DetailRow label="Delivery" value={`${order.del_date || ""} ${order.del_time || ""}`.trim() || "—"} />
              </div>

              <div className="admin-detail-section">
                <div className="admin-detail-title">Documents</div>
                <DetailRow
                  label="Bilty"
                  value={
                    order.bilty ? (
                      <a href={order.bilty} target="_blank" rel="noreferrer" className="admin-document-ok">
                        ✓ View
                      </a>
                    ) : (
                      <span className="admin-document-pending">Pending</span>
                    )
                  }
                />
                <DetailRow
                  label="Kaanta Parchi"
                  value={
                    order.kaanta ? (
                      <a href={order.kaanta} target="_blank" rel="noreferrer" className="admin-document-ok">
                        ✓ View
                      </a>
                    ) : (
                      <span className="admin-document-pending">Pending</span>
                    )
                  }
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

          {isAdmin && isPending && (
            <div className="admin-order-actions">
              <button className="admin-confirm-btn" onClick={onEdit}>
                <Pencil size={16} /> Edit Order
              </button>
              <button className="admin-pending-btn" onClick={onDelete}>
                <Trash2 size={16} /> Delete Order
              </button>
            </div>
          )}

          <button className="admin-whatsapp-btn" style={{ marginBottom: isAdmin ? 10 : 0 }} onClick={onOpenChallan}>
            <Truck size={17} /> {hasChallan ? "Edit Dispatch Details" : "Enter Dispatch Details"}
          </button>

          {isAdmin && (
            <>
              <button className="admin-whatsapp-btn" style={{ marginBottom: 10 }} onClick={() => onWhatsAppPackhouse(order)}>
                <MessageCircle size={17} /> Resend WhatsApp to Packhouse
              </button>
              <button className="admin-whatsapp-btn" onClick={() => onWhatsAppCustomer(order)}>
                <MessageCircle size={17} /> Resend WhatsApp to Customer
              </button>
            </>
          )}
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
