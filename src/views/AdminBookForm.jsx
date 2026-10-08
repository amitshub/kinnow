import React, { useEffect, useState } from "react";
import { Plus, X, Send, MessageCircle, Building2, UserPlus, Check, Pencil } from "lucide-react";
import { todayStr } from "../utils";

function AdminBookForm({ customers, packhouses, brands, varieties, qualities, editingOrder, onBookOrder, onUpdateOrder, onCancelEdit }) {
  const [customerMode, setCustomerMode] = useState("existing"); // "existing" | "new"
  const [existingCustomerId, setExistingCustomerId] = useState("");
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newCity, setNewCity] = useState("");

  const [packhouseId, setPackhouseId] = useState(packhouses[0]?.id || "");
  const [truckTonnage, setTruckTonnage] = useState("");
  const [remarks, setRemarks] = useState("");

  const [items, setItems] = useState([]);

  const [brand, setBrand] = useState(brands[0]?.name || "");
  const [variety, setVariety] = useState(varieties[0]?.name || "");
  const [quality, setQuality] = useState(qualities[0]?.name || "");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");

  // Sync form state whenever we switch into/out of editing an order.
  useEffect(() => {
    if (editingOrder) {
      setCustomerMode("existing");
      setExistingCustomerId(editingOrder.customer.id);
      setPackhouseId(editingOrder.packhouse.id);
      setTruckTonnage(editingOrder.truck_tonnage ?? "");
      setRemarks(editingOrder.remarks || "");
      setItems(
        editingOrder.items.map((i) => ({ brand: i.brand, variety: i.variety, quality: i.quality, qty: i.qty, rate: i.rate ?? "" }))
      );
    } else {
      clearBookForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingOrder]);

  function addItem() {
    const quantity = parseInt(qty, 10) || 0;
    if (!quantity) {
      alert("Enter quantity first");
      return;
    }
    setItems((list) => [...list, { brand, variety, quality, qty: quantity, rate: rate === "" ? null : parseFloat(rate) }]);
    setQty("");
    setRate("");
  }

  function removeItem(index) {
    setItems((list) => list.filter((_, i) => i !== index));
  }

  const totalCrates = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const selectedExisting = customers.find((c) => c.id === Number(existingCustomerId));
  const customerName = customerMode === "existing" ? selectedExisting?.name : newName;
  const customerCity = customerMode === "existing" ? selectedExisting?.city : newCity.trim();
  const customerLabel = customerName && customerCity ? `${customerName}, ${customerCity}` : customerName;
  const packhouseName = packhouses.find((p) => p.id === Number(packhouseId))?.name || "";

  const customerItemLines = items
    .map((item) => `• ${item.brand} ${item.variety} – ${item.quality} – ${item.qty} crates${item.rate ? ` @ ₹${item.rate}` : ""}`)
    .join("\n");
  const packhouseItemLines = items
    .map((item) => `• ${item.brand} ${item.variety} – ${item.quality} – ${item.qty} crates`)
    .join("\n");

  async function bookOrder() {
    if (customerMode === "existing" && !existingCustomerId) return alert("Please select a customer");
    if (customerMode === "new" && !newName.trim()) return alert("Enter the new customer's name");
    if (!items.length) return alert("Add at least one item");

    const payload = {
      customer_id: customerMode === "existing" ? Number(existingCustomerId) : null,
      new_customer:
        customerMode === "new"
          ? { name: newName.trim(), mobile: newMobile.trim() || null, city: newCity.trim() || null }
          : null,
      order_date: editingOrder ? editingOrder.order_date : todayStr(),
      remarks,
      truck_tonnage: truckTonnage === "" ? null : parseFloat(truckTonnage),
      items: items.map((i) => ({ ...i, rate: i.rate === "" || i.rate == null ? null : parseFloat(i.rate) })),
      packhouse_id: Number(packhouseId),
    };

    if (editingOrder) {
      await onUpdateOrder(editingOrder.id, payload);
    } else {
      await onBookOrder(payload);
      clearBookForm();
    }
  }

  function clearBookForm() {
    setCustomerMode("existing");
    setExistingCustomerId("");
    setNewName("");
    setNewMobile("");
    setNewCity("");
    setPackhouseId(packhouses[0]?.id || "");
    setTruckTonnage("");
    setRemarks("");
    setItems([]);
    setBrand(brands[0]?.name || "");
    setVariety(varieties[0]?.name || "");
    setQuality(qualities[0]?.name || "");
    setQty("");
    setRate("");
  }

  function handleCancelEdit() {
    clearBookForm();
    if (onCancelEdit) onCancelEdit();
  }

  return (
    <div className="book-screen">
      {editingOrder && (
        <div className="book-card" style={{ background: "#fff7ed", borderColor: "#fdba74" }}>
          <div className="book-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#9a3412" }}>
              <Pencil size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
              Editing {editingOrder.code}
            </span>
            <button type="button" className="book-delete-btn" onClick={handleCancelEdit} aria-label="Cancel edit">
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <div className="book-card">
        <div className="book-card-body">
          <div className="book-customer-toggle">
            <button
              type="button"
              className={customerMode === "existing" ? "active" : ""}
              onClick={() => setCustomerMode("existing")}
            >
              <Check size={14} /> Existing Customer
            </button>
            <button type="button" className={customerMode === "new" ? "active" : ""} onClick={() => setCustomerMode("new")}>
              <UserPlus size={14} /> New Customer
            </button>
          </div>

          {customerMode === "existing" ? (
            <div className="book-form-group" style={{ marginBottom: 0 }}>
              <label className="book-form-label">Customer</label>
              <select
                className="book-form-control"
                value={existingCustomerId}
                onChange={(e) => setExistingCustomerId(e.target.value)}
              >
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `– ${c.city}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="book-form-group">
                <label className="book-form-label">Customer Name</label>
                <input
                  type="text"
                  className="book-form-control"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Customer / firm name"
                />
              </div>
              <div className="book-form-group">
                <label className="book-form-label">Mobile</label>
                <input
                  type="tel"
                  className="book-form-control"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  placeholder="9XXXXXXXXX"
                />
              </div>
              <div className="book-form-group" style={{ marginBottom: 0 }}>
                <label className="book-form-label">City</label>
                <input
                  type="text"
                  className="book-form-control"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Agartala"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="book-card">
        <div className="book-card-body">
          <div className="book-form-group">
            <label className="book-form-label">Assign to Packhouse</label>
            <select className="book-form-control" value={packhouseId} onChange={(e) => setPackhouseId(e.target.value)}>
              {packhouses.map((ph) => (
                <option key={ph.id} value={ph.id}>
                  {ph.name}
                </option>
              ))}
            </select>
          </div>

          <div className="book-form-group">
            <label className="book-form-label">Truck Tonnage</label>
            <input
              type="number"
              className="book-form-control"
              value={truckTonnage}
              onChange={(e) => setTruckTonnage(e.target.value)}
              placeholder="e.g. 16"
            />
          </div>

          <div className="book-form-group" style={{ marginBottom: 0 }}>
            <label className="book-form-label">Remarks</label>
            <input
              type="text"
              className="book-form-control"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. SPL KINNOWS, handle carefully…"
            />
          </div>
        </div>
      </div>

      <div className="book-section-head">
        <div className="book-section-title">Items (Kinnow)</div>
        <div className="book-total-badge">{totalCrates > 0 ? `${totalCrates} crates` : ""}</div>
      </div>

      <div className="book-card book-items-card">
        <div className="book-items-box">
          <div className="book-items-head">
            <span>Brand</span>
            <span>Variety</span>
            <span>Quality</span>
            <span className="book-crates-head">Crates</span>
            <span></span>
          </div>

          {items.length === 0 ? (
            <div className="book-empty">No items added yet</div>
          ) : (
            items.map((item, index) => (
              <div className="book-item-row" key={index}>
                <div>
                  <div className="book-item-brand">{item.brand}</div>
                </div>
                <div className="book-item-variety">{item.variety}</div>
                <div className="book-item-quality">
                  {item.quality}
                  {item.rate ? <div style={{ fontSize: 11, color: "#059669" }}>₹{item.rate}</div> : null}
                </div>
                <div className="book-item-qty">{item.qty}</div>
                <button type="button" className="book-delete-btn" onClick={() => removeItem(index)} aria-label="Remove item">
                  <X size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="book-add-item-row">
          <select className="book-form-control" value={brand} onChange={(e) => setBrand(e.target.value)}>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          <select className="book-form-control" value={variety} onChange={(e) => setVariety(e.target.value)}>
            {varieties.map((v) => (
              <option key={v.id} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>

          <select className="book-form-control" value={quality} onChange={(e) => setQuality(e.target.value)}>
            {qualities.map((q) => (
              <option key={q.id} value={q.name}>
                {q.name}
              </option>
            ))}
          </select>

          <input
            className="book-form-control"
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Crates"
          />

          <input
            className="book-form-control"
            type="number"
            step="0.01"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="Rate (optional)"
          />

          <button type="button" className="book-add-item-btn" onClick={addItem}>
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      <div className="book-card book-preview-card">
        <div className="book-card-body">
          {/* Customer-confirmation preview disabled: the booking-time WhatsApp to the
              customer is switched off for now (see backend services/whatsapp.py).
              Restore this block together with that backend code if it is re-enabled.
          <div className="book-wa-box">
            <div className="book-wa-head">
              <MessageCircle size={16} />
              WhatsApp preview – Customer confirmation
            </div>
            <div className="book-wa-message">
              {!customerName || !items.length ? (
                "Select/enter a customer and add items to preview message"
              ) : (
                <>
                  Dear {customerName}
                  {"\n\n"}
                  Your order has been booked:
                  {"\n"}
                  {customerItemLines}
                  {"\n\n"}
                  Total: {totalCrates} crates
                  {"\n\n"}
                  Kindly confirm. Thank you.
                </>
              )}
            </div>
          </div>
          */}

          <div className="book-packhouse-box">
            <div className="book-packhouse-head">
              <Building2 size={16} />
              Packhouse intimation
            </div>
            <div className="book-packhouse-message">
              {!customerName || !items.length ? (
                "Select packhouse and items to preview"
              ) : (
                <>
                  *New Order Alert – {packhouseName}*
                  {"\n\n"}
                  Customer: {customerLabel}
                  {"\n"}
                  Items:
                  {"\n"}
                  {packhouseItemLines}
                  {truckTonnage ? `\nTonnage: ${truckTonnage} MT` : ""}
                  {"\n\n"}
                  Total: {totalCrates} crates
                  {"\n\n"}
                  Please process accordingly.
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <button type="button" className="book-submit-btn" onClick={bookOrder}>
        <Send size={16} /> {editingOrder ? "Update Order" : "Book Order & Send WhatsApp"}
      </button>

      <button type="button" className="book-clear-btn" onClick={editingOrder ? handleCancelEdit : clearBookForm}>
        {editingOrder ? "Cancel Edit" : "Clear form"}
      </button>
    </div>
  );
}

export default AdminBookForm;
