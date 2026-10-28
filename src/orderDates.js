// The date an order was dispatched on. Orders dispatched before dispatch dates were recorded
// fall back to their booking date.
export const dispatchDateOf = (order) => order.dispatch_date || order.order_date;

export const isDispatchedOn = (order, date) => order.status === "Dispatched" && dispatchDateOf(order) === date;
