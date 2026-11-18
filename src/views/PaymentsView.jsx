import React from "react";
import AdminPaymentsView from "./AdminPaymentsView";

// Packhouse user's Payments screen: the same list, totals and PDF as the admin sees,
// but read-only and only for their own packhouse (the API already scopes it).
// Opens on today's requests (all statuses); `focusDate` jumps to the date of a request just raised.
export default function PaymentsView({ paymentRequests, focusDate, onFocusDone, onDownloadPdf }) {
  return (
    <AdminPaymentsView
      payments={paymentRequests}
      readOnly
      defaultStatus="All"
      focusDate={focusDate}
      onFocusDone={onFocusDone}
      onDownloadPdf={onDownloadPdf}
    />
  );
}
