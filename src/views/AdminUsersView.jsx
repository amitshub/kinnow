import React, { useState } from "react";
import { Search, UserX, ShieldCheck, Users as UsersIcon } from "lucide-react";
import StatTile from "../components/StatTile";

export default function AdminUsersView({ users, onOpenUser }) {
  const [search, setSearch] = useState("");
  const list = search
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.mobile.includes(search) ||
          u.packhouse.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const total = users.length;
  const active = users.filter((u) => u.status === "Active").length;
  const admins = users.filter((u) => u.role === "Admin").length;

  return (
    <div>
      <div className="stats-strip">
        <StatTile value={total} label="Total Users" color="blue" />
        <StatTile value={active} label="Active" color="green" />
        <StatTile value={admins} label="Admins" color="purple" />
      </div>

      <div className="search-wrap">
        <Search size={15} />
        <input
          className="search-input"
          placeholder="Search name, mobile, packhouse…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="section-head">
        <div className="section-title">All Users ({users.length})</div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <UserX size={44} />
          <div className="empty-title">No users found</div>
          <div className="empty-sub">Tap the + button to create one</div>
        </div>
      ) : (
        <div className="card">
          {list.map((u) => (
            <div className="user-card card-tap" key={u.id} onClick={() => onOpenUser(u.id)}>
              <div className={`user-avatar ${u.role === "Admin" ? "admin" : ""}`}>
                {u.role === "Admin" ? <ShieldCheck size={17} /> : u.name[0]}
              </div>
              <div>
                <div className="user-name">{u.name}</div>
                <div className="user-meta">
                  {u.mobile} {u.packhouse !== "-" && <>· {u.packhouse}</>}
                </div>
                <div style={{ marginTop: 4, display: "flex", gap: 5 }}>
                  <span className={`badge ${u.role === "Admin" ? "badge-purple" : "badge-blue"}`}>
                    {u.role === "Admin" ? <ShieldCheck size={10} /> : <UsersIcon size={10} />} {u.role}
                  </span>
                  <span className={`badge ${u.status === "Active" ? "badge-green" : "badge-gray"}`}>{u.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
