// Mobile number input helper: digits only, at most 10. A pasted "+91 98765 43210" becomes 9876543210.
export function cleanMobile(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  return digits.slice(0, 10);
}
