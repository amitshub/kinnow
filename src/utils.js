export const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
export const fmtAmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
export const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
export const todayStr = () => new Date().toISOString().slice(0, 10);

export const fmtDateLabel = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export const shiftDate = (dateStr, delta) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
};

export const statusBadgeClass = (status) =>
  status === "Approved" ? "badge-green" : status === "Rejected" ? "badge-red" : "badge-amber";

