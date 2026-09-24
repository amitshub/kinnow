import React, { useState } from "react";
import { Search, MapPin, UserX } from "lucide-react";
import { fmt } from "../utils";

export default function GrowersView({ growers, incoming, onOpenGrower }) {
  const [search, setSearch] = useState("");
  const list = search
    ? growers.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.city.toLowerCase().includes(search.toLowerCase()))
    : growers;

  return (
    <div>
      <div className="search-wrap">
        <Search size={15} />
        <input className="search-input" placeholder="Search grower or city…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="section-head">
        <div className="section-title">Growers ({growers.length})</div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <UserX size={44} />
          <div className="empty-title">No growers found</div>
          <div className="empty-sub">Tap the + button to add one</div>
        </div>
      ) : (
        <div className="card">
          {list.map((g) => {
            const totalKg = incoming.filter((i) => i.growerId === g.id).reduce((s, i) => s + i.weight, 0);
            return (
              <div className="grower-card card-tap" key={g.id} onClick={() => onOpenGrower(g.id)}>
                <div className="grower-avatar">{g.name[0]}</div>
                <div>
                  <div className="grower-name">{g.name}</div>
                  <div className="grower-meta">
                    <MapPin size={11} /> {g.city} &nbsp;·&nbsp; {fmt(totalKg)} KG delivered
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
