import React, { useState } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";

const FALLBACK_ITEMS = ["Kinnow", "Malta", "Apple", "Mango"];

// Names from a catalog list, plus the line's current value so an older / hidden value stays selectable.
function optionsFor(list, current) {
  const names = (list || []).map((entry) => entry.name);
  if (current && !names.includes(current)) names.unshift(current);
  return names;
}

// For packhouse users: correct the lines of an order when what is actually loaded differs from what was ordered.
// Only the lines can be changed here (not the customer, the packhouse or any prices).
export default function EditOrderItemsSheet({ order, catalog, onClose, onSave }) {
  const [lines, setLines] = useState(() =>
    order.items.map((line) => ({
      id: line.id,
      item: line.item || "Kinnow",
      brand: line.brand,
      variety: line.variety,
      quality: line.quality,
      qty: String(line.qty),
    }))
  );
  const [saving, setSaving] = useState(false);

  const itemNames = catalog.items && catalog.items.length ? catalog.items.map((i) => i.name) : FALLBACK_ITEMS;
  const total = lines.reduce((sum, line) => sum + (parseInt(line.qty, 10) || 0), 0);

  function setLine(index, key, value) {
    setLines((list) => list.map((line, i) => (i === index ? { ...line, [key]: value } : line)));
  }

  function addLine() {
    const last = lines[lines.length - 1];
    setLines((list) => [
      ...list,
      {
        id: null,
        item: last ? last.item : itemNames[0],
        brand: last ? last.brand : catalog.brands?.[0]?.name || "",
        variety: last ? last.variety : catalog.varieties?.[0]?.name || "",
        quality: last ? last.quality : catalog.qualities?.[0]?.name || "",
        qty: "",
      },
    ]);
  }

  function removeLine(index) {
    setLines((list) => list.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (lines.length === 0) return alert("An order needs at least one item");
    for (const line of lines) {
      if (!/^\d+$/.test(line.qty) || parseInt(line.qty, 10) < 1) return alert("Enter the number of crates for every item");
    }
    setSaving(true);
    const ok = await onSave(
      order.id,
      lines.map((line) => ({
        id: line.id,
        item: line.item,
        brand: line.brand,
        variety: line.variety,
        quality: line.quality,
        qty: parseInt(line.qty, 10),
      }))
    );
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <div className="admin-order-sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-order-sheet">
        <div className="admin-sheet-handle" />
        <div className="admin-sheet-header">
          <div>
            <h3>Edit Order Items</h3>
            <span>
              {order.code} · {order.customer.name}
            </span>
          </div>
          <button onClick={onClose} className="admin-sheet-close">
            <X size={18} />
          </button>
        </div>

        <div className="admin-sheet-body">
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6b7280" }}>
            Change what is actually being loaded. You can edit the items as many times as needed.
          </p>

          {lines.map((line, index) => (
            <div
              key={line.id ?? `new-${index}`}
              style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, marginBottom: 10, background: "#fff" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong style={{ fontSize: 12, color: "#6b7280" }}>Item {index + 1}</strong>
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  aria-label={`Remove item ${index + 1}`}
                  style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", padding: 2 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <select className="book-form-control" aria-label="Item" value={line.item} onChange={(e) => setLine(index, "item", e.target.value)}>
                  {optionsFor(catalog.items && catalog.items.length ? catalog.items : itemNames.map((name) => ({ name })), line.item).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <select className="book-form-control" aria-label="Brand" value={line.brand} onChange={(e) => setLine(index, "brand", e.target.value)}>
                  {optionsFor(catalog.brands, line.brand).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <select className="book-form-control" aria-label="Variety" value={line.variety} onChange={(e) => setLine(index, "variety", e.target.value)}>
                  {optionsFor(catalog.varieties, line.variety).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <select className="book-form-control" aria-label="Quality" value={line.quality} onChange={(e) => setLine(index, "quality", e.target.value)}>
                  {optionsFor(catalog.qualities, line.quality).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <input
                  className="book-form-control"
                  aria-label="Crates"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Crates"
                  value={line.qty}
                  onChange={(e) => setLine(index, "qty", e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addLine}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: 10,
              marginBottom: 12,
              border: "1px dashed #1a8f5c",
              borderRadius: 10,
              background: "#fff",
              color: "#1a8f5c",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add another item
          </button>

          <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Total: {total} crates</div>

          <button className="book-submit-btn" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
