import { T } from "../../styles/global";
import { Card, SectionLabel, Avatar, Pill, Btn } from "../../components/UI";
import { SLOTS } from "../../data/users";

export default function OverviewTab({ user, bookings, notifications, onNavigate }) {
  const myBooking = Object.entries(bookings).find(([, b]) => b.userId === user.id);
  const totalSlots = SLOTS.length;
  const occupiedCount = Object.keys(bookings).length;
  const freeCount = totalSlots - occupiedCount;
  const compatibleSlot = SLOTS.find(s => s.type === user.vehicleType);
  const compatibleFree = compatibleSlot && !bookings[compatibleSlot.id];

  const statCards = [
    { label: "Total Slots",    value: totalSlots,     color: T.accent},
    { label: "Available",      value: freeCount,      color: T.green },
    { label: "Occupied",       value: occupiedCount,  color: T.red },
    { label: "Notifications",  value: notifications.length, color: T.amber },
  ];

  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar initials={user.avatar} color={user.avatarColor} size={52} />
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: T.text, letterSpacing: "-0.5px" }}>
              Hello, {user.name.split(" ")[0]} 👋
            </div>
            <div style={{ color: T.muted, fontSize: 14, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
              {user.vehicleType === "two_wheeler" ? "🛵 Two Wheeler" : "🚗 Four Wheeler"} · {user.vehicleNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
        {statCards.map((s, i) => (
          <Card key={s.label} style={{ padding: "20px 20px", animation: `fadeUp .4s ease ${i * 0.06}s both` }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".5px", marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Active booking banner */}
      {myBooking && (
        <div style={{
          background: `linear-gradient(135deg, ${T.amber}15, ${T.amber}08)`,
          border: `1px solid ${T.amber}33`, borderRadius: 18,
          padding: "20px 24px", marginBottom: 28, animation: "fadeUp .4s ease",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 36 }}>🎫</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.amber }}>Active Booking</div>
              <div style={{ color: T.text, fontSize: 14, marginTop: 2 }}>
                Slot <strong>{myBooking[0]}</strong> · Booked at {new Date(myBooking[1].bookedAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
          <Btn onClick={() => onNavigate("bookings")} variant="amber" size="sm">View Booking →</Btn>
        </div>
      )}

      {/* Quick actions */}
      <SectionLabel>Quick Actions</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 32 }}>
        {[
          { label: "View Slots", tab: "slots",    desc: "See live slot status", color: T.accent },
          { label: "My Bookings",  tab: "bookings", desc: "Manage your bookings",  color: T.green },
          { label: "Edit Profile",  tab: "profile",  desc: "Update your details",  color: T.cyan },
        ].map((a, i) => (
          <Card key={a.tab} onClick={() => onNavigate(a.tab)} style={{ padding: 20, animation: `fadeUp .4s ease ${0.2 + i * 0.07}s both`, cursor: "pointer" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{a.icon}</div>
            <div style={{ fontWeight: 700, color: a.color, fontSize: 15 }}>{a.label}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{a.desc}</div>
          </Card>
        ))}
      </div>

      {/* Your vehicle info */}
      <SectionLabel>Your Vehicle</SectionLabel>
      <Card style={{ animation: "fadeUp .5s ease .3s both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 40 }}>{user.vehicleType === "two_wheeler" ? "🛵" : "🚗"}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: T.text, letterSpacing: 1 }}>{user.vehicleNumber}</div>
              <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>{user.vehicleType === "two_wheeler" ? "Two Wheeler" : "Four Wheeler"}</div>
            </div>
          </div>
          <div>
            <Pill label={compatibleFree ? "Slot Available" : "Slot Occupied"} color={compatibleFree ? T.green : T.red} />
          </div>
        </div>
      </Card>
    </div>
  );
}