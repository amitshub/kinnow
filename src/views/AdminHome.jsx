import React from "react";
import { ShoppingCart, Clock, Truck, Plus, Package, ArrowRight } from "lucide-react";

function totalCrates(order) {
  return order.items.reduce((total, item) => total + Number(item.qty || 0), 0);
}

const AdminHome = ({ adminName, orders = [], onNewOrder, onOrderList }) => {
  const total = orders.length;
  const pending = orders.filter((o) => o.status === "Pending").length;
  const dispatched = orders.filter((o) => o.status === "Dispatched").length;
  const confirmed = orders.filter((o) => o.status === "Confirmed").length;

  const recent = [...orders].sort((a, b) => b.order_date.localeCompare(a.order_date)).slice(0, 3);

  return (
    <div className="admin-home">
      <div className="home-welcome">
        <div className="home-welcome-title">Welcome back, {adminName}</div>
        <div className="home-welcome-sub">Here's what's happening today.</div>
      </div>

      <div className="home-banner">
        <div className="home-banner-title">Manage your orders easily</div>
        <div className="home-banner-text">
          Create orders, track dispatches and manage your customers from one place.
        </div>
      </div>

      <div className="home-stats">
        <div className="home-stat-card">
          <div className="home-stat-icon green">
            <ShoppingCart size={17} />
          </div>
          <div className="home-stat-number">{String(total).padStart(2, "0")}</div>
          <div className="home-stat-label">Total Orders</div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-icon orange">
            <Clock size={17} />
          </div>
          <div className="home-stat-number">{String(pending).padStart(2, "0")}</div>
          <div className="home-stat-label">Pending</div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-icon blue">
            <Truck size={17} />
          </div>
          <div className="home-stat-number">{String(dispatched).padStart(2, "0")}</div>
          <div className="home-stat-label">Dispatched</div>
        </div>
      </div>

      <div className="home-section">
        <div className="home-section-head">
          <div className="home-section-title">Quick Actions</div>
        </div>

        <div className="quick-actions">
          <button type="button" className="quick-action" onClick={onNewOrder}>
            <div className="quick-action-icon green">
              <Plus size={18} />
            </div>
            <div className="quick-action-content">
              <div className="quick-action-title">New Order</div>
              <div className="quick-action-sub">Create order</div>
            </div>
          </button>

          <button type="button" className="quick-action" onClick={onOrderList}>
            <div className="quick-action-icon blue">
              <Package size={18} />
            </div>
            <div className="quick-action-content">
              <div className="quick-action-title">Orders</div>
              <div className="quick-action-sub">View orders</div>
            </div>
          </button>
        </div>
      </div>

      <div className="home-section">
        <div className="home-section-head">
          <div className="home-section-title">Today's Summary</div>
        </div>

        <div className="summary-card">
          <div className="summary-row">
            <div className="summary-left">
              <div className="summary-icon green">
                <ShoppingCart size={15} />
              </div>
              <span className="summary-label">Total Orders</span>
            </div>
            <span className="summary-value">{total}</span>
          </div>

          <div className="summary-row">
            <div className="summary-left">
              <div className="summary-icon orange">
                <Clock size={15} />
              </div>
              <span className="summary-label">Pending / Confirmed</span>
            </div>
            <span className="summary-value">
              {pending} / {confirmed}
            </span>
          </div>

          <div className="summary-row">
            <div className="summary-left">
              <div className="summary-icon blue">
                <Truck size={15} />
              </div>
              <span className="summary-label">Dispatched</span>
            </div>
            <span className="summary-value">{dispatched}</span>
          </div>
        </div>
      </div>

      <div className="home-section">
        <div className="home-section-head">
          <div className="home-section-title">Recent Orders</div>
          <button type="button" className="home-section-link" onClick={onOrderList}>
            View All <ArrowRight size={12} />
          </button>
        </div>

        <div className="recent-orders">
          {recent.length > 0 ? (
            recent.map((order) => (
              <div className="recent-order" key={order.id}>
                <div className="recent-order-top">
                  <div>
                    <div className="recent-order-id">{order.code}</div>
                    <div className="recent-order-customer">{order.customer.name}</div>
                    <div className="recent-order-date">{order.order_date}</div>
                  </div>
                  <span
                    className={`badge ${
                      order.status === "Confirmed"
                        ? "badge-confirmed"
                        : order.status === "Pending"
                        ? "badge-pending"
                        : order.status === "Cancelled"
                        ? "badge-cancelled"
                        : "badge-default"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="recent-order-bottom">
                  <span className="recent-order-items">
                    {order.items.length} {order.items.length === 1 ? "Item" : "Items"}
                  </span>
                  <span className="recent-order-total">{totalCrates(order)} crates</span>
                </div>
              </div>
            ))
          ) : (
            <div className="recent-orders-empty">No recent orders found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
