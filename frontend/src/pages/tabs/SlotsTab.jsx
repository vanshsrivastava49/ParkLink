import { useState, useEffect, useCallback } from "react";
import { T } from "../../styles/global";
import { Card, SectionLabel, Pill, Btn, Spinner } from "../../components/UI";
import { SLOTS, EXPIRY_SECONDS, POLL_INTERVAL } from "../../data/users";
import { fetchSensorData } from "../../services/thingspeakService";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Countdown timer bar ────────────────────────────────────
function CountdownBar({ expiresAt, onExpire }) {
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
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
        <span>Slot reserved for you</span>
        <span style={{ color, fontWeight: 700 }}>{remaining}s left</span>
      </div>
      <div style={{ height: 5, background: T.border, borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4, width: pct + "%",
          background: `linear-gradient(90deg, ${color}, ${color}99)`,
          transition: "width .3s linear, background .5s",
          boxShadow: `0 0 8px ${color}80`,
        }} />
      </div>
    </div>
  );
}

// ── Single slot card ───────────────────────────────────────
function SlotCard({ slot, sensorOccupied, booking, currentUser, onBook, onCancel }) {
  const isMine    = booking?.userId === currentUser?.id;
  const occupied  = sensorOccupied || !!booking;
  const canBook   = !occupied && slot.type === currentUser?.vehicleType && !currentUser?.hasAnyBooking;
  const wrongType = !occupied && slot.type !== currentUser?.vehicleType;

  let borderColor = T.border;
  if (isMine)        borderColor = T.amber + "55";
  else if (canBook)  borderColor = T.green + "44";
  else if (occupied) borderColor = T.red   + "33";

  return (
    <Card style={{ border: `1px solid ${borderColor}`, transition: "border-color .3s" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-1px", color: T.text }}>{slot.id}</div>
          <div style={{ fontSize: 12, color: T.muted, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{slot.area} · {slot.floor}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <Pill
            label={occupied ? (isMine ? "YOURS" : "OCCUPIED") : "FREE"}
            color={occupied ? (isMine ? T.amber : T.red) : T.green}
          />
          <span style={{ fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".5px" }}>
            {slot.type === "two_wheeler" ? "2W" : "4W"}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 13, color: T.sub, marginBottom: 12 }}>{slot.label}</div>

      {/* Sensor indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted, fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: sensorOccupied ? T.red : T.green, display: "inline-block",
          animation: sensorOccupied ? "pulse 2s infinite" : "none",
        }} />
        Sensor: {sensorOccupied ? "Vehicle detected" : "Clear"}
      </div>

      {/* Booked by someone else */}
      {booking && !isMine && (
        <div style={{ background: T.panel, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: T.muted, marginBottom: 12 }}>
          Reserved by <span style={{ color: T.text, fontWeight: 600 }}>{booking.userName}</span>
        </div>
      )}

      {/* My countdown */}
      {isMine && (
        <CountdownBar expiresAt={booking.expiresAt} onExpire={() => onCancel(slot.id, "expired")} />
      )}

      {/* Actions */}
      <div style={{ marginTop: 14 }}>
        {canBook && (
          <Btn onClick={() => onBook(slot.id)} fullWidth variant="primary">
            🅿 Book This Slot
          </Btn>
        )}
        {isMine && (
          <Btn onClick={() => onCancel(slot.id, "cancelled")} fullWidth variant="danger">
            ✕ Cancel My Booking
          </Btn>
        )}
        {wrongType && !occupied && (
          <div style={{ fontSize: 12, color: T.muted, textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
            ✗ Not compatible with your vehicle type
          </div>
        )}
        {currentUser?.hasAnyBooking && !isMine && !occupied && slot.type === currentUser?.vehicleType && (
          <div style={{ fontSize: 12, color: T.amber, textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
            ↑ You already have an active booking
          </div>
        )}
      </div>
    </Card>
  );
}

// ── SlotsTab ───────────────────────────────────────────────
export default function SlotsTab({ user, bookings, onAddBooking, onRemoveBooking, onNotify }) {
  const [sensorData, setSensorData] = useState({
    tw_slot: 0, fw_slot: 0, gate_status: 0, updated_at: null, ok: false,
  });
  const [loading,        setLoading]        = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const hasAnyBooking = Object.values(bookings).some(b => b.userId === user.id);

  const poll = useCallback(async () => {
    const data = await fetchSensorData();
    setSensorData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    poll();
    const t = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [poll]);

  function isSensorOccupied(slot) {
    if (slot.id === "TW-01") return sensorData.tw_slot === 1;
    if (slot.id === "FW-01") return sensorData.fw_slot === 1;
    return false;
  }

  // ── Book ──────────────────────────────────────────────────
  // Backend sends the booking confirmation email automatically.
  async function handleBook(slotId) {
    if (bookings[slotId])  { onNotify("Slot already occupied!", "err"); return; }
    const slot = SLOTS.find(s => s.id === slotId);
    if (!slot || slot.type !== user.vehicleType) { onNotify("Vehicle type mismatch!", "err"); return; }
    if (hasAnyBooking) { onNotify("You already have an active booking!", "err"); return; }

    setBookingLoading(true);

    try {
      const res = await fetch(`${API}/api/book`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: user.id, slotId }),
      });
      const data = await res.json();

      if (!res.ok) {
        onNotify(data.error || "Booking failed", "err");
        setBookingLoading(false);
        return;
      }

      onAddBooking(slotId, data.booking);
      onNotify(`✅ Slot ${slotId} booked! Confirmation email sent. Arrive within 30s`, "ok");
    } catch {
      // Backend unreachable — fall back to local booking (no email in this case)
      const now = Date.now();
      const bookingObj = {
        userId:    user.id,
        userName:  user.name,
        slotId,
        slotArea:  slot.area,
        bookedAt:  now,
        expiresAt: now + EXPIRY_SECONDS * 1000,
      };
      onAddBooking(slotId, bookingObj);
      onNotify(`Slot ${slotId} booked (offline mode — no email sent). Arrive within 30s`, "warn");
    }

    setBookingLoading(false);
  }

  // ── Cancel ────────────────────────────────────────────────
  // Backend sends the cancellation email automatically via /api/cancel/:slotId.
  // Expired bookings are cleaned up by the backend sensor loop — no email needed here.
  async function handleCancel(slotId, reason) {
    if (reason !== "expired") {
      try {
        await fetch(`${API}/api/cancel/${slotId}`, { method: "POST" });
      } catch {
        // Backend unreachable — still remove locally
      }
    }

    onRemoveBooking(slotId);

    const msg = reason === "expired"
      ? `⏱ Slot ${slotId} expired — slot released. No-show email sent by server.`
      : `Booking for ${slotId} cancelled. Cancellation email sent.`;
    onNotify(msg, reason === "expired" ? "warn" : "info");
  }

  return (
    <div style={{ animation: "fadeUp .4s ease" }}>

      {/* Status bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <SectionLabel style={{ marginBottom: 4 }}>Live Slot Status</SectionLabel>
          <div style={{ fontSize: 13, color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>
            Sensor refreshes every {POLL_INTERVAL / 1000}s
            {sensorData.updated_at && ` · Last: ${new Date(sensorData.updated_at).toLocaleTimeString()}`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Pill label={sensorData.gate_status === 1 ? "Gate Open" : "Gate Closed"} color={sensorData.gate_status === 1 ? T.green : T.muted} />
          <Pill label={sensorData.ok ? "Sensor Online" : "Sensor Offline"} color={sensorData.ok ? T.green : T.red} />
          {loading
            ? <Spinner size={16} />
            : <button onClick={poll} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", color: T.muted, cursor: "pointer", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>↻ Refresh</button>
          }
        </div>
      </div>

      {/* Workflow info banner */}
      <div style={{ background: T.accent + "10", border: `1px solid ${T.accent}25`, borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 12, color: T.sub, fontFamily: "'JetBrains Mono', monospace", lineHeight: "1.6" }}>
        📧 Slot assigned on login · Booking confirmed instantly · <strong>Scan RFID at gate to open</strong> · Arrival detected by IR sensor · No-show after 30s
      </div>

      {/* Slot grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={32} /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {SLOTS.map(slot => (
            <SlotCard
              key={slot.id}
              slot={slot}
              sensorOccupied={isSensorOccupied(slot)}
              booking={bookings[slot.id] || null}
              currentUser={{ ...user, hasAnyBooking }}
              onBook={bookingLoading ? () => {} : handleBook}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}