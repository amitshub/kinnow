import React from "react";
import {
  List,
  CirclePlus,
  House,
  CircleUserRound 
} from "lucide-react";

export default function AdminFooter({
  activeTab,
  onChange,
}) {
  return (
    <nav className="admin-bottom-nav">

      {/* Home */}
      <button
        className={activeTab === "home" ? "active" : ""}
        onClick={() => onChange("home")}
      >
        <House size={22} />

        <span>
          Home
        </span>
      </button>

      {/* Orders */}
      <button
        className={activeTab === "orders" ? "active" : ""}
        onClick={() => onChange("orders")}
      >
        <List size={22} />

        <span>
          Orders
        </span>
      </button>

      {/* Book */}
      <button
        className={activeTab === "book" ? "active" : ""}
        onClick={() => onChange("book")}
      >
        <CirclePlus size={22} />

        <span>
          Book
        </span>
      </button>

      {/* Book */}
      <button
        className={activeTab === "user" ? "active" : ""}
        onClick={() => onChange("user")}
      >
        <CircleUserRound  size={22} />

        <span>
          Users
        </span>
      </button>

    </nav>
  );
}