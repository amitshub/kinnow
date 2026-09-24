import React from "react";
import { Check, X, Clock } from "lucide-react";

export default function StatusIcon({ status }) {
  const size = 11;
  if (status === "Approved") return <Check size={size} style={{ verticalAlign: -1 }} />;
  if (status === "Rejected") return <X size={size} style={{ verticalAlign: -1 }} />;
  return <Clock size={size} style={{ verticalAlign: -1 }} />;
}
