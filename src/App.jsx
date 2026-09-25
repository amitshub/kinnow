import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import "./App.css";

import LoginScreen from "./screens/LoginScreen";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import AdminHeader from "./components/AdminHeader";
import AdminFooter from "./components/AdminFooter";

import AddIncomingSheet from "./components/AddIncomingSheet";
import DaySummarySheet from "./components/DaySummarySheet";
import GrowerDetailSheet from "./components/GrowerDetailSheet";
import AddGrowerSheet from "./components/AddGrowerSheet";
import RaisePaymentSheet from "./components/RaisePaymentSheet";
import AddUserSheet from "./components/AddUserSheet";
import UserDetailSheet from "./components/UserDetailSheet";

import IncomingView from "./views/IncomingView";
import StockView from "./views/StockView";
import GrowersView from "./views/GrowersView";
import PaymentsView from "./views/PaymentsView";
import AdminUsersView from "./views/AdminUsersView";
import AdminOrdersView from "./views/AdminOrdersView";
import AdminPaymentsView from "./views/AdminPaymentsView";
import AdminBookForm from "./views/AdminBookForm";
import AdminHome from "./views/AdminHome";

import { api, setToken } from "./api";
import { todayStr, shiftDate } from "./utils";

/* =====================================================
   API <-> UI SHAPE MAPPERS
   The mobile UI components were designed against flat mock objects;
   these adapt the real backend responses to that same shape so the
   presentational components don't need to change.
   ===================================================== */
const mapPayment = (p) => ({
  id: p.id,
  code: p.code,
  growerId: p.grower_id,
  growerName: p.grower_name,
  packhouseId: p.packhouse_id,
  account: p.account || "",
  amount: p.amount,
  date: p.request_date,
  status: p.status,
  note: p.note || "",
});

const mapGrower = (g) => ({
  id: g.id,
  code: g.code,
  name: g.name,
  city: g.city || "",
  address: g.address || "",
  mob: g.mobile || "",
  account: g.account || "",
});

const mapIncoming = (i) => ({
  id: i.id,
  growerId: i.grower_id,
  growerName: i.grower_name,
  city: i.grower_city || "",
  weight: i.weight,
  price: i.price,
  amount: i.amount,
  time: i.record_time ? i.record_time.slice(0, 5) : "",
  date: i.record_date,
});

const mapDaySummary = (d) => ({
  date: d.summary_date,
  incoming: d.incoming_total,
  eagleA: d.eagle_a,
  gradeB: d.grade_b,
  dispatched: d.dispatched,
  balance: d.balance,
  prevBalance: d.prev_balance,
});

const roleToUi = (role) => (role === "admin" ? "Admin" : "Packhouse User");
const roleToApi = (role) => (role === "Admin" ? "admin" : "staff");

const mapUser = (u) => ({
  id: u.id,
  name: u.name,
  mobile: u.mobile,
  role: roleToUi(u.role),
  packhouse: u.packhouse ? u.packhouse.name : "-",
  packhouseId: u.packhouse ? u.packhouse.id : null,
  status: u.is_active ? "Active" : "Inactive",
});

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [toast, setToastState] = useState({ show: false, msg: "" });
  const toastTimer = useRef(null);

  function showToast(msg) {
    clearTimeout(toastTimer.current);
    setToastState({ show: true, msg });
    toastTimer.current = setTimeout(() => setToastState({ show: false, msg: "" }), 2400);
  }

  // Restore session on reload if a token is already stored.
  useEffect(() => {
    async function bootstrap() {
      try {
        const me = await api.me();
        setSession(me);
      } catch {
        setToken(null);
      } finally {
        setAuthLoading(false);
      }
    }
    bootstrap();
  }, []);

  function handleLogin(user) {
    setSession(user);
    showToast(`Welcome back, ${user.name.split(" ")[0]} ✓`);
  }

  function handleLogout() {
    api.logout();
    setSession(null);
  }

  if (authLoading) {
    return <div className="kinnow-app" />;
  }

  if (!session) {
    return (
      <div className="kinnow-app">
        <LoginScreen onLogin={handleLogin} />
        <Toast show={toast.show} message={toast.msg} />
      </div>
    );
  }

  if (session.role === "admin") {
    return <AdminApp session={session} onLogout={handleLogout} toast={toast} showToast={showToast} />;
  }

  return <WorkerApp session={session} onLogout={handleLogout} toast={toast} showToast={showToast} />;
}

/* =========================================================
   ADMIN APP
   ========================================================= */

function AdminApp({ session, onLogout, toast, showToast }) {
  const [activeTab, setActiveTab] = useState("home");

  const [packhouses, setPackhouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

    useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [ph, u, ord, cust, pay] = await Promise.all([
          api.listPackhouses(),
          api.listUsers(),
          api.listOrders(),
          api.listCustomers(),
          api.listPayments({ all_packhouses: true }),
        ]);
        if (cancelled) return;
        setPackhouses(ph);
        setUsers(u.map(mapUser));
        setOrders(ord);
        setCustomers(cust);
        setPayments(pay.map(mapPayment));
      } catch (e) {
        if (!cancelled) showToast(e.message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  /* ---------------- USERS ---------------- */

  const [userDetailId, setUserDetailId] = useState(null);
  const [userFormSheet, setUserFormSheet] = useState({ open: false, editId: null });

  function openAddUser(editId = null) {
    setUserDetailId(null);
    setUserFormSheet({ open: true, editId });
  }

  async function saveUser(payload, errorMsg) {
    if (errorMsg) return showToast(errorMsg);
    const { editId } = userFormSheet;
    const ph = packhouses.find((p) => p.name === payload.packhouse);

    try {
      if (editId) {
          await api.updateUser(editId, {
          name: payload.name,
          mobile: payload.mobile,
          role: roleToApi(payload.role),
          packhouse_id: payload.role === "Admin" ? null : ph?.id,
          password: payload.password || undefined,
        });
        showToast("User updated ✓");
      } else {
        await api.createUser({
          name: payload.name,
          mobile: payload.mobile,
          password: payload.password,
          role: roleToApi(payload.role),
          packhouse_id: payload.role === "Admin" ? null : ph?.id,
        });
        showToast("User created ✓");
      }
      setUserFormSheet({ open: false, editId: null });
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  const editingUser = userFormSheet.editId ? users.find((u) => u.id === userFormSheet.editId) : null;
  const detailUser = userDetailId ? users.find((u) => u.id === userDetailId) : null;

  async function deleteUser(id) {
    try {
      await api.deleteUser(id);
      setUserDetailId(null);
      showToast("User deleted");
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  async function toggleStatus(id) {
    try {
      await api.toggleUserStatus(id);
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  /* ---------------- ORDERS ---------------- */

  async function handleStatusChange(id, status) {
    try {
      await api.updateOrderStatus(id, status);
      showToast(`Order marked ${status} ✓`);
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  async function handleSaveChallan(id, payload) {
    try {
      await api.updateOrderChallan(id, payload);
      showToast("Dispatch details saved ✓");
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  function handleWhatsApp(order) {
    if (!order.customer.mobile) {
      showToast("No mobile number on file for this customer");
      return;
    }
    const lines = order.items.map((i) => `• ${i.brand} ${i.variety} – ${i.quality} – ${i.qty} crates`).join("\n");
    const text = `Dear ${order.customer.name},\n\nYour order ${order.code} status: ${order.status}.\n${lines}\n\nThank you.`;
    const phone = order.customer.mobile.replace(/\D/g, "");
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function handleBookOrder(payload) {
    try {
      let customerId = payload.customer_id;
      if (!customerId && payload.new_customer) {
        const created = await api.createCustomer(payload.new_customer);
        customerId = created.id;
        setCustomers((list) => [...list, created]);
      }
      await api.createOrder(
        { customer_id: customerId, order_date: payload.order_date, remarks: payload.remarks, items: payload.items },
        payload.packhouse_id
      );
      showToast("Order booked ✓");
      bump();
      setActiveTab("orders");
    } catch (e) {
      showToast(e.message);
    }
  }
  
    async function handleApprovePayment(id) {
    try {
      await api.approvePayment(id);
      showToast("Payment marked as paid ✓");
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  async function handleRejectPayment(id) {
    try {
      await api.rejectPayment(id);
      showToast("Payment request rejected");
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  return (
    <div className="kinnow-app">
      <div className="app">
        <AdminHeader adminName={session.name} onLogout={onLogout} />

        <div className="scroll">
          <div className="scroll-inner">
            {activeTab === "home" && (
              <AdminHome
                adminName={session.name}
                orders={orders}
                onNewOrder={() => setActiveTab("book")}
                onOrderList={() => setActiveTab("orders")}
              />
            )}

            {activeTab === "orders" && (
              <AdminOrdersView
                orders={orders}
                onStatusChange={handleStatusChange}
                onSaveChallan={handleSaveChallan}
                onWhatsApp={handleWhatsApp}
              />
            )}

            {activeTab === "book" && (
              <AdminBookForm customers={customers} packhouses={packhouses} onBookOrder={handleBookOrder} />
            )}

            {activeTab === "user" && <AdminUsersView users={users} onOpenUser={setUserDetailId} />}

            {activeTab === "payments" && (
              <AdminPaymentsView
                payments={payments}
                packhouses={packhouses}
                onApprove={handleApprovePayment}
                onReject={handleRejectPayment}
              />
            )}
          </div>
        </div>

        {activeTab === "user" && (
          <button className="fab" onClick={() => openAddUser()} aria-label="Create new user">
            <Plus size={26} />
          </button>
        )}

        <AdminFooter activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <UserDetailSheet
        open={!!userDetailId}
        user={detailUser}
        onClose={() => setUserDetailId(null)}
        onEdit={openAddUser}
        onDelete={deleteUser}
        onToggleStatus={toggleStatus}
      />

      <AddUserSheet
        open={userFormSheet.open}
        editing={editingUser}
        packhouses={packhouses}
        onClose={() => setUserFormSheet({ open: false, editId: null })}
        onSave={saveUser}
      />

      <Toast show={toast.show} message={toast.msg} />
    </div>
  );
}

/* =========================================================
   WORKER / PACKHOUSE APP
   ========================================================= */

function WorkerApp({ session, onLogout, toast, showToast }) {
  const [activeTab, setActiveTab] = useState("incoming");
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const [growers, setGrowers] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [daySummaries, setDaySummaries] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [g, inc, ds, pr, ord] = await Promise.all([
          api.listGrowers(),
          api.listIncoming(),
          api.listDaySummaries(),
          api.listPayments(),
          api.listOrders(),
        ]);
        if (cancelled) return;
        setGrowers(g.map(mapGrower));
        setIncoming(inc.map(mapIncoming));
        setDaySummaries(ds.map(mapDaySummary));
        setPaymentRequests(pr.map(mapPayment));
        setOrders(ord);
      } catch (e) {
        if (!cancelled) showToast(e.message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const [incomingSheet, setIncomingSheet] = useState({ open: false, editId: null });
  const [summarySheet, setSummarySheet] = useState(false);
  const [growerDetailId, setGrowerDetailId] = useState(null);
  const [growerFormSheet, setGrowerFormSheet] = useState({ open: false, editId: null });
  const [paymentSheet, setPaymentSheet] = useState({ open: false, growerId: null, amount: "" });

  /* ---------------- INCOMING / STOCK ---------------- */

  const todaysIncoming = useMemo(() => incoming.filter((i) => i.date === selectedDate), [incoming, selectedDate]);
  const todaySummary = useMemo(() => daySummaries.find((d) => d.date === selectedDate), [daySummaries, selectedDate]);
  const sortedLog = useMemo(
    () => [...daySummaries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7),
    [daySummaries]
  );

  function openAddIncoming(editId = null) {
    setIncomingSheet({ open: true, editId });
  }

  const editingEntry = incomingSheet.editId ? incoming.find((i) => i.id === incomingSheet.editId) : null;

  async function saveIncoming(payload, errorMsg) {
    if (errorMsg) return showToast(errorMsg);
    const { editId } = incomingSheet;
    const body = {
      grower_id: Number(payload.growerId),
      weight: parseFloat(payload.weight) || 0,
      price: parseFloat(payload.price) || 0,
      amount: parseFloat(payload.amount) || 0,
      record_date: editId ? editingEntry.date : selectedDate,
      record_time: payload.time ? `${payload.time}:00` : null,
    };
    try {
      if (editId) {
        await api.updateIncoming(editId, body);
        showToast("Entry updated ✓");
      } else {
        await api.createIncoming(body);
        showToast("Incoming saved ✓");
      }
      setIncomingSheet({ open: false, editId: null });
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  async function deleteIncoming(id) {
    try {
      await api.deleteIncoming(id);
      showToast("Entry deleted");
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  /* ---------------- DAY SUMMARY ---------------- */

  async function saveSummary(obj) {
    try {
      await api.saveDaySummary({ summary_date: selectedDate, eagle_a: obj.eagleA, dispatched: obj.dispatched });
      showToast("Day summary saved ✓");
      setSummarySheet(false);
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  const prevDaySummary = [...daySummaries].sort((a, b) => b.date.localeCompare(a.date)).find((d) => d.date < selectedDate);
  const prevBalance = prevDaySummary?.balance || 0;
  const totalIncomingToday = todaysIncoming.reduce((s, i) => s + i.weight, 0);

  function handleDateChange(delta) {
    setSelectedDate((d) => shiftDate(d, delta));
  }

  /* ---------------- GROWERS ---------------- */

  const detailGrower = growerDetailId ? growers.find((g) => g.id === growerDetailId) : null;

  const detailTotals = useMemo(() => {
    if (!detailGrower) return { totalKg: 0, totalAmt: 0, paid: 0 };
    const myIncoming = incoming.filter((i) => i.growerId === detailGrower.id);
    const totalKg = myIncoming.reduce((s, i) => s + i.weight, 0);
    const totalAmt = myIncoming.reduce((s, i) => s + i.amount, 0);
    const paid = paymentRequests
      .filter((p) => p.growerId === detailGrower.id && p.status === "Approved")
      .reduce((s, p) => s + p.amount, 0);
    return { totalKg, totalAmt, paid };
  }, [detailGrower, incoming, paymentRequests]);

  function openAddGrower(editId = null) {
    setGrowerDetailId(null);
    setGrowerFormSheet({ open: true, editId });
  }

  async function saveGrower(payload, errorMsg) {
    if (errorMsg) return showToast(errorMsg);
    const { editId } = growerFormSheet;
    const body = { name: payload.name, address: payload.address, city: payload.city, mobile: payload.mob, account: payload.account };
    try {
      if (editId) {
        await api.updateGrower(editId, body);
        showToast("Grower updated ✓");
      } else {
        await api.createGrower(body);
        showToast("Grower added ✓");
      }
      setGrowerFormSheet({ open: false, editId: null });
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  const editingGrower = growerFormSheet.editId ? growers.find((g) => g.id === growerFormSheet.editId) : null;

  async function deleteGrower(id) {
    try {
      await api.deleteGrower(id);
      setGrowerDetailId(null);
      showToast("Grower deleted");
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  /* ---------------- PAYMENTS ---------------- */

  function openRaisePayment(presetGrowerId = null) {
    let amount = "";
    if (presetGrowerId) {
      const myIncoming = incoming.filter((i) => i.growerId === presetGrowerId);
      const totalAmt = myIncoming.reduce((s, i) => s + i.amount, 0);
      const paid = paymentRequests
        .filter((p) => p.growerId === presetGrowerId && p.status === "Approved")
        .reduce((s, p) => s + p.amount, 0);
      amount = Math.max(0, totalAmt - paid);
    }
    setGrowerDetailId(null);
    setActiveTab("payments");
    setPaymentSheet({ open: true, growerId: presetGrowerId, amount });
  }

  async function savePaymentRequest(payload, errorMsg) {
    if (errorMsg) return showToast(errorMsg);
    try {
      await api.createPayment({
        grower_id: Number(payload.growerId),
        amount: parseFloat(payload.amount) || 0,
        request_date: payload.date,
        note: payload.note || "",
      });
      showToast("Payment request submitted ✓");
      setPaymentSheet({ open: false, growerId: null, amount: "" });
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  /* ---------------- ORDERS ---------------- */

  async function handleOrderStatusChange(id, status) {
    try {
      await api.updateOrderStatus(id, status);
      showToast(`Order marked ${status} ✓`);
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  async function handleSaveChallan(id, payload) {
    try {
      await api.updateOrderChallan(id, payload);
      showToast("Dispatch details saved ✓");
      bump();
    } catch (e) {
      showToast(e.message);
    }
  }

  function handleWhatsApp(order) {
    if (!order.customer.mobile) {
      showToast("No mobile number on file for this customer");
      return;
    }
    const lines = order.items.map((i) => `• ${i.brand} ${i.variety} – ${i.quality} – ${i.qty} crates`).join("\n");
    const text = `Dear ${order.customer.name},\n\nYour order ${order.code} status: ${order.status}.\n${lines}\n\nThank you.`;
    const phone = order.customer.mobile.replace(/\D/g, "");
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, "_blank");
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="kinnow-app">
      <div className="app">
        <Header
          activeTab={activeTab}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onDateSelect={setSelectedDate}
          initial={session.name[0]}
          onLogout={onLogout}
        />

        <div className="scroll">
          <div className="scroll-inner">
            {activeTab === "incoming" && <IncomingView list={todaysIncoming} onOpenEntry={openAddIncoming} />}

            {activeTab === "stock" && (
              <StockView todaySummary={todaySummary} log={sortedLog} onUpdateSummary={() => setSummarySheet(true)} />
            )}

            {activeTab === "growers" && (
              <GrowersView growers={growers} incoming={incoming} onOpenGrower={setGrowerDetailId} />
            )}

            {activeTab === "payments" && <PaymentsView paymentRequests={paymentRequests} />}

            {activeTab === "orders" && (
              <AdminOrdersView
                orders={orders}
                onStatusChange={handleOrderStatusChange}
                onSaveChallan={handleSaveChallan}
                onWhatsApp={handleWhatsApp}
              />
            )}
          </div>
        </div>

        {activeTab === "incoming" && (
          <button className="fab" onClick={() => openAddIncoming()} aria-label="Add incoming">
            <Plus size={26} />
          </button>
        )}

        {activeTab === "growers" && (
          <button className="fab" onClick={() => openAddGrower()} aria-label="Add grower">
            <Plus size={26} />
          </button>
        )}

        {activeTab === "payments" && (
          <button className="fab" onClick={() => openRaisePayment()} aria-label="Raise payment request">
            <Plus size={26} />
          </button>
        )}

        <Footer activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <AddIncomingSheet
        open={incomingSheet.open}
        editing={editingEntry}
        growers={growers}
        onClose={() => setIncomingSheet({ open: false, editId: null })}
        onSave={saveIncoming}
      />

      <DaySummarySheet
        open={summarySheet}
        onClose={() => setSummarySheet(false)}
        onSave={saveSummary}
        totalIncoming={totalIncomingToday}
        prevBalance={prevBalance}
        existing={todaySummary}
      />

      <GrowerDetailSheet
        open={!!growerDetailId}
        grower={detailGrower}
        totals={detailTotals}
        onClose={() => setGrowerDetailId(null)}
        onEdit={openAddGrower}
        onDelete={deleteGrower}
        onRaisePayment={openRaisePayment}
      />

      <AddGrowerSheet
        open={growerFormSheet.open}
        editing={editingGrower}
        onClose={() => setGrowerFormSheet({ open: false, editId: null })}
        onSave={saveGrower}
      />

      <RaisePaymentSheet
        open={paymentSheet.open}
        presetGrowerId={paymentSheet.growerId}
        presetAmount={paymentSheet.amount}
        growers={growers}
        onClose={() => setPaymentSheet({ open: false, growerId: null, amount: "" })}
        onSave={savePaymentRequest}
      />

      <Toast show={toast.show} message={toast.msg} />
    </div>
  );
}
