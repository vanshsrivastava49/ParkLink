// emailService.js
// All emails are sent by the backend (Nodemailer/Gmail).
// This file is a thin client that calls the backend API routes.
// Most emails are triggered automatically — see comments per function.

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Generic backend caller ─────────────────────────────────
async function callBackendEmail(route, payload = {}) {
  try {
    const res = await fetch(`${API}${route}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn(`[Email] Backend error on ${route}:`, err.error || res.status);
      return { error: err.error };
    }
    return { success: true };
  } catch (err) {
    console.error(`[Email] Network error on ${route}:`, err.message);
    return { error: err.message };
  }
}

// ── Email 1: Slot assigned ─────────────────────────────────
// AUTO: Sent to ALL users when the server starts.
// MANUAL: Call this to re-send (e.g. from an admin panel).
export async function sendSlotAssignedEmails() {
  return callBackendEmail("/api/notify/slot-assigned");
}

// ── Email 2: Booking confirmed ─────────────────────────────
// AUTO: Sent by the backend immediately when POST /api/book succeeds.
// No manual call needed from the frontend.
export async function sendBookingConfirmedEmail({ userId, slotId }) {
  // Kept for compatibility — booking email is handled by /api/book.
  console.info(`[Email] Booking confirmation for ${slotId} handled by backend.`);
  return { success: true };
}

// ── Email 3: Vehicle arrived ───────────────────────────────
// AUTO: Sent by the backend's 5-second sensor loop (runSensorCheck)
// when the IR sensor detects the vehicle in a booked slot.
// No frontend call needed.
export async function sendArrivalEmail({ userId, slotId }) {
  console.info(`[Email] Arrival email for ${slotId} handled by backend sensor loop.`);
  return { success: true };
}

// ── Email 4: No-show / expired ─────────────────────────────
// AUTO: Sent by the backend's 5-second sensor loop (runSensorCheck)
// when the booking window expires with no vehicle detected.
// No frontend call needed.
export async function sendNoShowEmail({ userId, slotId }) {
  console.info(`[Email] No-show email for ${slotId} handled by backend sensor loop.`);
  return { success: true };
}

// ── Email 5: Booking cancelled ─────────────────────────────
// AUTO: Sent by the backend when POST /api/cancel/:slotId is called.
// No separate frontend call needed — the cancel route handles it.
export async function sendCancellationEmail({ userId, slotId }) {
  console.info(`[Email] Cancellation email for ${slotId} handled by backend.`);
  return { success: true };
}

// ── Legacy compatibility ───────────────────────────────────
export async function sendBookingEmail({ slotId }) {
  console.info(`[Email] Booking email for ${slotId} handled by backend.`);
  return { success: true };
}