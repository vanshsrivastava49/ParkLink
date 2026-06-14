import { useState, useEffect } from "react";
import { T } from "../../styles/global";
import { Card, SectionLabel, Pill, Btn } from "../../components/UI";
import { SLOTS, EXPIRY_SECONDS } from "../../data/users";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Countdown bar (compact) ────────────────────────────────
function CountdownSmall({ expiresAt, onExpire }) {
  const [remaining, setRemaining] = useState(EXPIRY_SECONDS);

  useEffect(() => {
    function tick() {
      const r = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemaining(r);
      if (r === 0) onExpire();
    }
    tick();
    const id = setInterval(tick, 300);
    return () => clearInterval(id);
  }, [expiresAt, onExpire]);

  const pct   = (remaining / EXPIRY_SECONDS) * 100;
  const color = pct > 60 ? T.green : pct > 25 ? T.amber : T.red;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ height: 4, flex: 1, background: T.border, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 4, transition: "width .3s linear" }} />
      </div>
      <span style={{ fontSize: 12, color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, whiteSpace: "nowrap" }}>{remaining}s</span>
    </div>
  );
}

// ── Email event legend ─────────────────────────────────────
function EmailLegend() {
  const events = [
    { label: "Slot Assigned",      desc: "Sent automatically when the server starts" },
    { label: "Booking Confirmed",  desc: "Sent instantly when you book a slot" },
    { label: "Vehicle Arrived",    desc: "Sent when IR sensor detects your vehicle" },
    { label: "No-Show / Expired",  desc: "Sent if you don't arrive within 30s" },
    { label: "Booking Cancelled",  desc: "Sent when you cancel your booking" },
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      <SectionLabel>Email Notifications</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {events.map(e => (
          <div key={e.label} style={{
            background: T.panel, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{e.label}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{e.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function BookingsTab({ user, bookings, onRemoveBooking, onNotify }) {
  const myEntries    = Object.entries(bookings).filter(([, b]) => b.userId === user.id);
  const otherEntries = Object.entries(bookings).filter(([, b]) => b.userId !== user.id);

  // Cancel → calls backend (which sends cancellation email)
  async function handleCancel(slotId) {
    try {
      await fetch(`${API}/api/cancel/${slotId}`, { method: "POST" });
    } catch {
      // Backend unreachable — still remove locally
    }
    onRemoveBooking(slotId);
    onNotify(`Booking for ${slotId} cancelled. Cancellation email sent.`, "info");
  }

  // Expire → no-show email is handled by the backend sensor loop
  function handleExpire(slotId) {
    onRemoveBooking(slotId);
    onNotify(`Slot ${slotId} expired. No-show email sent by server.`, "warn");
  }

  return (
    <div style={{ animation: "fadeUp .4s ease" }}>

      <EmailLegend />

      {/* My bookings */}
      <SectionLabel>My Active Booking</SectionLabel>

      {myEntries.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "40px 24px", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🅿</div>
          <div style={{ color: T.sub, fontSize: 15, fontWeight: 600 }}>No active bookings</div>
          <div style={{ color: T.muted, fontSize: 13, marginTop: 6 }}>Go to the Slots tab to book a parking slot</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          {myEntries.map(([slotId, booking]) => {
            const slot = SLOTS.find(s => s.id === slotId);
            return (
              <Card key={slotId} style={{ border: `1px solid ${T.amber}33`, background: `${T.amber}06` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ fontSize: 40 }}>{user.vehicleType === "two_wheeler" ? "🛵" : "🚗"}</div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{slotId}</div>
                      <div style={{ fontSize: 13, color: T.muted, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                        {slot?.area} · {slot?.label}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <Pill label="ACTIVE" color={T.amber} />
                    <span style={{ fontSize: 11, color: T.green, fontFamily: "'JetBrains Mono', monospace" }}>📧 Confirmation sent</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "VEHICLE",    value: user.vehicleNumber },
                    { label: "BOOKED AT",  value: new Date(booking.bookedAt).toLocaleTimeString() },
                    { label: "EXPIRES AT", value: new Date(booking.expiresAt).toLocaleTimeString() },
                    { label: "WINDOW",     value: `${EXPIRY_SECONDS}s` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: T.panel, borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Email timeline */}
                <div style={{ background: T.panel, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: T.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", marginBottom: 8 }}>WORKFLOW TIMELINE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { label: "Slot assigned (on server start)", done: true  },
                      { label: "Booking confirmed",               done: true  },
                      { label: "Scan RFID at the entrance gate",  done: false }, // <-- NEW STEP ADDED HERE
                      { label: "Vehicle arrival (IR sensor)",     done: false },
                      { label: "No-show if not detected in 30s",  done: false },
                    ].map(step => (
                      <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ color: step.done ? T.green : T.muted }}>{step.label}</span>
                        {step.done && (
                          <span style={{ marginLeft: "auto", color: T.green, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>SENT</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <CountdownSmall expiresAt={booking.expiresAt} onExpire={() => handleExpire(slotId)} />

                <div style={{ marginTop: 16 }}>
                  <Btn onClick={() => handleCancel(slotId)} variant="danger" fullWidth>
                    ✕ Cancel Booking
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Other occupied slots */}
      {otherEntries.length > 0 && (
        <>
          <SectionLabel>Other Occupied Slots</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {otherEntries.map(([slotId, booking]) => {
              const slot = SLOTS.find(s => s.id === slotId);
              return (
                <Card key={slotId} style={{ border: `1px solid ${T.red}22`, padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: T.text }}>{slotId}</span>
                        <Pill label="OCCUPIED" color={T.red} />
                      </div>
                      <div style={{ fontSize: 12, color: T.muted, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
                        Reserved by {booking.userName} · {slot?.area}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(booking.bookedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}