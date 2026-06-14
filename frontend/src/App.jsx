import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { USERS_DB } from "./data/users";
import { injectGlobalStyles } from "./styles/global";

export default function App() {
  const [session, setSession] = useState(null); // { user, updatedAt }
  const [bookings, setBookings] = useState({}); // { slotId: bookingObj }
  const [notifications, setNotifications] = useState([]); // [{ id, msg, type, ts }]

  useEffect(() => {
    injectGlobalStyles();
    // Restore session from sessionStorage
    const saved = sessionStorage.getItem("pl_session");
    if (saved) setSession(JSON.parse(saved));
    const savedBookings = sessionStorage.getItem("pl_bookings");
    if (savedBookings) setBookings(JSON.parse(savedBookings));
  }, []);

  function login(user) {
    const s = { user, loggedInAt: Date.now() };
    setSession(s);
    sessionStorage.setItem("pl_session", JSON.stringify(s));
  }

  function logout() {
    setSession(null);
    sessionStorage.removeItem("pl_session");
  }

  function updateUser(updated) {
    // Update in USERS_DB (runtime patch) and session
    const idx = USERS_DB.findIndex(u => u.id === updated.id);
    if (idx !== -1) USERS_DB[idx] = updated;
    const s = { ...session, user: updated };
    setSession(s);
    sessionStorage.setItem("pl_session", JSON.stringify(s));
  }

  function addBooking(slotId, bookingObj) {
    const next = { ...bookings, [slotId]: bookingObj };
    setBookings(next);
    sessionStorage.setItem("pl_bookings", JSON.stringify(next));
  }

  function removeBooking(slotId) {
    const next = { ...bookings };
    delete next[slotId];
    setBookings(next);
    sessionStorage.setItem("pl_bookings", JSON.stringify(next));
  }

  function pushNotification(msg, type = "info") {
    const notif = { id: Date.now(), msg, type, ts: new Date().toLocaleTimeString() };
    setNotifications(prev => [notif, ...prev].slice(0, 20));
  }

  if (!session) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <Dashboard
      user={session.user}
      bookings={bookings}
      notifications={notifications}
      onLogout={logout}
      onUpdateUser={updateUser}
      onAddBooking={addBooking}
      onRemoveBooking={removeBooking}
      onNotify={pushNotification}
    />
  );
}