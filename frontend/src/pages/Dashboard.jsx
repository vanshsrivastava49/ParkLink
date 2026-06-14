import { useState } from "react";
import { T } from "../styles/global";
import { Avatar } from "../components/UI";
import { ToastContainer, NotificationPanel, showToast } from "../components/Noti";
import SlotsTab from "./tabs/SlotsTab";
import ProfileTab from "./tabs/ProfileTab";
import BookingsTab from "./tabs/BookingTab";
import OverviewTab from "./tabs/OverviewTab";

const NAV = [
  { id: "overview",  label: "Overview"},
  { id: "slots",     label: "Slots"},
  { id: "bookings",  label: "Bookings"},
  { id: "profile",   label: "Profile"},
];

export default function Dashboard({ user, bookings, notifications, onLogout, onUpdateUser, onAddBooking, onRemoveBooking, onNotify }) {
  const [activeTab, setActiveTab]     = useState("overview");
  const [showNotifs, setShowNotifs]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function notify(msg, type = "info") {
    onNotify(msg, type);
    showToast(msg, type);
  }

  const unreadCount = notifications.length;
  const myBookingCount = Object.values(bookings).filter(b => b.userId === user.id).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 240 : 72, flexShrink: 0,
        background: T.panel, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
        transition: "width .25s ease", overflow: "hidden",
        position: "sticky", top: 0, height: "100vh",
      }}>
        {/* Brand */}
        <div style={{ padding: sidebarOpen ? "24px 20px 20px" : "24px 16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: `0 0 20px ${T.accent}40`,
          }}>🅿</div>
          {sidebarOpen && (
            <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
              <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.5px" }}>
                <span style={{ color: T.accent }}>Park</span>Link
              </div>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px" }}>SMART PARKING</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "16px 10px" }}>
          {NAV.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  gap: 12, padding: sidebarOpen ? "11px 14px" : "11px",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  background: active ? T.accent + "18" : "transparent",
                  border: active ? `1px solid ${T.accent}33` : "1px solid transparent",
                  borderRadius: 10, marginBottom: 4,
                  cursor: "pointer", transition: "all .2s",
                  color: active ? T.accentLt : T.sub,
                  fontFamily: "'Outfit', sans-serif", fontWeight: active ? 700 : 500,
                  fontSize: 14, whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.border; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && item.id === "bookings" && myBookingCount > 0 && (
                  <span style={{ marginLeft: "auto", background: T.accent, color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{myBookingCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div style={{ padding: sidebarOpen ? "16px 16px 20px" : "16px 10px 20px", borderTop: `1px solid ${T.border}` }}>
          {sidebarOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar initials={user.avatar} color={user.avatarColor} size={36} />
              <div style={{ overflow: "hidden", flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: T.muted, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
              </div>
              <button onClick={onLogout} title="Logout" style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, padding: 4, flexShrink: 0, transition: "color .2s" }}
                onMouseEnter={e => e.currentTarget.style.color = T.red}
                onMouseLeave={e => e.currentTarget.style.color = T.muted}
              >⏻</button>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Avatar initials={user.avatar} color={user.avatarColor} size={36} style={{ cursor: "pointer" }} />
            </div>
          )}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 64, borderBottom: `1px solid ${T.border}`,
          background: T.panel + "cc", backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Sidebar toggle */}
            <button onClick={() => setSidebarOpen(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 20, padding: 4, transition: "color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = T.text}
              onMouseLeave={e => e.currentTarget.style.color = T.muted}
            >☰</button>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>
              {NAV.find(n => n.id === activeTab)?.label}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Bell */}
            <button
              onClick={() => setShowNotifs(p => !p)}
              style={{
                position: "relative", background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 10, width: 40, height: 40, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, transition: "border-color .2s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.borderLt}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: T.red, color: "#fff", borderRadius: 20,
                  padding: "1px 5px", fontSize: 10, fontWeight: 800,
                }}>{unreadCount}</span>
              )}
            </button>

            {/* Avatar */}
            <Avatar initials={user.avatar} color={user.avatarColor} size={36} />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
          {activeTab === "overview" && (
            <OverviewTab user={user} bookings={bookings} notifications={notifications} onNavigate={setActiveTab} />
          )}
          {activeTab === "slots" && (
            <SlotsTab user={user} bookings={bookings} onAddBooking={onAddBooking} onRemoveBooking={onRemoveBooking} onNotify={notify} />
          )}
          {activeTab === "bookings" && (
            <BookingsTab user={user} bookings={bookings} onRemoveBooking={onRemoveBooking} onNotify={notify} />
          )}
          {activeTab === "profile" && (
            <ProfileTab user={user} onUpdateUser={onUpdateUser} onNotify={notify} />
          )}
        </main>
      </div>

      {/* Notification panel overlay */}
      {showNotifs && <NotificationPanel notifications={notifications} onClose={() => setShowNotifs(false)} />}

      {/* Toast stack */}
      <ToastContainer />
    </div>
  );
}