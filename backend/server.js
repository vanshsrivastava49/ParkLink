require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const axios      = require("axios");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// CONFIG
// ============================================================
const TS_CHANNEL_ID = process.env.TS_CHANNEL_ID;
const TS_READ_KEY   = process.env.TS_READ_KEY;

// ============================================================
// EMAIL TRANSPORT
// ============================================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── HTML email builder ─────────────────────────────────────
function buildEmail({ title, preheader, accentColor = "#4f6ff5", rows = [], bodyHtml = "" }) {
  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1e2240;color:#8891b8;font-size:13px;font-family:'Courier New',monospace;letter-spacing:.5px;width:40%">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #1e2240;color:#dde2f5;font-size:13px;font-weight:600;font-family:'Courier New',monospace;">${value}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07090f;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07090f;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0c0f1a,#111520);border:1px solid #1e2240;border-radius:18px 18px 0 0;padding:32px 36px;text-align:center;">
          <div style="display:inline-block;background:linear-gradient(135deg,${accentColor},#3352cc);border-radius:14px;width:52px;height:52px;line-height:52px;font-size:26px;margin-bottom:16px;">P</div>
          <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-1px;margin-bottom:4px;">
            <span style="color:${accentColor}">Park</span>Link
          </div>
          <div style="font-size:11px;color:#454d70;letter-spacing:3px;text-transform:uppercase;font-family:'Courier New',monospace;">Smart Parking System</div>
        </td></tr>

        <!-- Title band -->
        <tr><td style="background:${accentColor}18;border-left:1px solid #1e2240;border-right:1px solid #1e2240;padding:18px 36px;border-bottom:1px solid ${accentColor}33;">
          <div style="font-size:20px;font-weight:800;color:${accentColor};letter-spacing:-.5px;">${title}</div>
          ${preheader ? `<div style="font-size:13px;color:#8891b8;margin-top:4px;">${preheader}</div>` : ""}
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#111520;border:1px solid #1e2240;border-top:none;padding:28px 36px;">
          ${bodyHtml}
          ${rows.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${rowsHtml}</table>` : ""}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0c0f1a;border:1px solid #1e2240;border-top:none;border-radius:0 0 18px 18px;padding:20px 36px;text-align:center;">
          <div style="font-size:11px;color:#454d70;font-family:'Courier New',monospace;letter-spacing:1px;">
            ParkLink · Smart IoT Parking · Do not reply to this email
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Send wrapper ───────────────────────────────────────────
async function sendEmail(to, subject, html, text) {
  try {
    await transporter.sendMail({
      from: `"ParkLink" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`[Email] ✓ ${subject} → ${to}`);
  } catch (err) {
    console.error("[Email] ✗", err.message);
  }
}

// ── Email 1: Slot Assigned ─────────────────────────────────
async function emailSlotAssigned({ user, slot }) {
  const html = buildEmail({
    title: "Your Slot Has Been Assigned",
    preheader: `Slot ${slot.id} is reserved for your vehicle type`,
    accentColor: "#4f6ff5",
    bodyHtml: `<p style="color:#8891b8;font-size:14px;margin-bottom:24px;">Hi <strong style="color:#dde2f5">${user.name}</strong>, a parking slot matching your vehicle type has been designated for you in ParkLink.</p>`,
    rows: [
      ["SLOT ID",       slot.id],
      ["AREA",          slot.area],
      ["VEHICLE TYPE",  slot.type === "two_wheeler" ? "Two Wheeler" : "Four Wheeler"],
      ["YOUR VEHICLE",  user.vehicleNumber],
      ["ASSIGNED TO",   user.name],
    ],
  });

  await sendEmail(
    user.email,
    `ParkLink — Slot ${slot.id} Assigned to You`,
    html,
    `Hi ${user.name},\n\nSlot ${slot.id} (${slot.area}) has been assigned to your vehicle ${user.vehicleNumber}.\n\n– ParkLink`,
  );
}

// ── Email 2: Booking Confirmed ─────────────────────────────
async function emailBookingConfirmed({ user, slot, booking }) {
  const expiryTime = new Date(booking.expiresAt).toLocaleTimeString();
  const bookedTime = new Date(booking.bookedAt).toLocaleTimeString();

  const html = buildEmail({
    title: "Booking Confirmed",
    preheader: `Slot ${slot.id} is reserved. Scan your RFID card before ${expiryTime}`,
    accentColor: "#10d98a",
    bodyHtml: `
      <p style="color:#8891b8;font-size:14px;margin-bottom:24px;">
        Hi <strong style="color:#dde2f5">${user.name}</strong>, your parking slot is confirmed!
        Please arrive within <strong style="color:#10d98a">30 seconds</strong> and
        <strong style="color:#dde2f5">scan your registered RFID card at the gate</strong>,
        or the slot will be released.
      </p>
      <div style="background:#10d98a15;border:1px solid #10d98a33;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
        <div style="font-size:36px;font-weight:900;color:#10d98a;letter-spacing:-1px;">${slot.id}</div>
        <div style="font-size:13px;color:#8891b8;font-family:'Courier New',monospace;margin-top:4px;">${slot.area} · ${slot.type === "two_wheeler" ? "Two Wheeler" : "Four Wheeler"}</div>
      </div>`,
    rows: [
      ["VEHICLE",       user.vehicleNumber],
      ["BOOKED AT",     bookedTime],
      ["EXPIRES AT",    expiryTime],
      ["ENTRY METHOD",  "RFID Card Scan"],
      ["WINDOW",        "30 seconds"],
      ["STATUS",        "CONFIRMED"],
    ],
  });

  await sendEmail(
    user.email,
    `ParkLink — Slot ${slot.id} Booking Confirmed`,
    html,
    `Hi ${user.name},\n\nYour slot ${slot.id} at ${slot.area} is confirmed.\nVehicle: ${user.vehicleNumber}\nBooked at: ${bookedTime}\nExpires at: ${expiryTime}\n\nPlease arrive within 30 seconds and scan your RFID card at the gate.\n\n– ParkLink`,
  );
}

// ── Email 3: Vehicle Arrived ───────────────────────────────
async function emailVehicleArrived({ user, slot, arrivedAt }) {
  const html = buildEmail({
    title: "Vehicle Arrived",
    preheader: `Your vehicle has been detected at slot ${slot.id}`,
    accentColor: "#22d3ee",
    bodyHtml: `<p style="color:#8891b8;font-size:14px;margin-bottom:24px;">Hi <strong style="color:#dde2f5">${user.name}</strong>, great news! Your vehicle has been detected at your reserved slot. You're all set.</p>`,
    rows: [
      ["SLOT ID",       slot.id],
      ["AREA",          slot.area],
      ["VEHICLE",       user.vehicleNumber],
      ["ARRIVED AT",    new Date(arrivedAt).toLocaleTimeString()],
      ["ENTRY",         "RFID gate scan confirmed"],
      ["STATUS",        "PARKED"],
    ],
  });

  await sendEmail(
    user.email,
    `ParkLink — Vehicle Arrived at Slot ${slot.id}`,
    html,
    `Hi ${user.name},\n\nYour vehicle ${user.vehicleNumber} has arrived at slot ${slot.id} (${slot.area}) at ${new Date(arrivedAt).toLocaleTimeString()}.\n\n– ParkLink`,
  );
}

// ── Email 4: No-Show / Expired ─────────────────────────────
async function emailNoShow({ user, slot, expiredAt }) {
  const html = buildEmail({
    title: "Booking Expired — No Show",
    preheader: `Your reservation for slot ${slot.id} has been released`,
    accentColor: "#ff4560",
    bodyHtml: `
      <p style="color:#8891b8;font-size:14px;margin-bottom:16px;">
        Hi <strong style="color:#dde2f5">${user.name}</strong>, unfortunately your reservation window elapsed
        and your vehicle was not detected at the slot. The slot has been released and is now available for others.
      </p>
      <div style="background:#ff456015;border:1px solid #ff456033;border-radius:12px;padding:14px 18px;margin-bottom:24px;">
        <div style="font-size:13px;color:#ff4560;font-weight:600;">You can re-book the slot anytime from the ParkLink dashboard.</div>
      </div>`,
    rows: [
      ["SLOT ID",       slot.id],
      ["AREA",          slot.area],
      ["VEHICLE",       user.vehicleNumber],
      ["EXPIRED AT",    new Date(expiredAt).toLocaleTimeString()],
      ["STATUS",        "RELEASED"],
    ],
  });

  await sendEmail(
    user.email,
    `ParkLink — Slot ${slot.id} Reservation Expired`,
    html,
    `Hi ${user.name},\n\nYour reservation for slot ${slot.id} has expired. The slot has been released.\n\nYou can re-book anytime from the dashboard.\n\n– ParkLink`,
  );
}

// ── Email 5: Booking Cancelled ─────────────────────────────
async function emailBookingCancelled({ user, slot }) {
  const html = buildEmail({
    title: "Booking Cancelled",
    preheader: `Your reservation for slot ${slot.id} has been cancelled`,
    accentColor: "#ffb020",
    bodyHtml: `<p style="color:#8891b8;font-size:14px;margin-bottom:24px;">Hi <strong style="color:#dde2f5">${user.name}</strong>, your booking has been successfully cancelled. The slot is now free for others.</p>`,
    rows: [
      ["SLOT ID",       slot.id],
      ["AREA",          slot.area],
      ["VEHICLE",       user.vehicleNumber],
      ["CANCELLED AT",  new Date().toLocaleTimeString()],
      ["STATUS",        "CANCELLED"],
    ],
  });

  await sendEmail(
    user.email,
    `ParkLink — Slot ${slot.id} Booking Cancelled`,
    html,
    `Hi ${user.name},\n\nYour booking for slot ${slot.id} has been cancelled.\n\n– ParkLink`,
  );
}

// ============================================================
// DATA
// ============================================================
const USERS = [
  { id: 1, name: "Vansh Srivastava", email: "srivastavavansh049@gmail.com", vehicleType: "four_wheeler", vehicleNumber: "UP32GB0606" },
  { id: 2, name: "Utkarsh Prakash",  email: "up3767@srmist.edu.in",         vehicleType: "two_wheeler",  vehicleNumber: "DL01L3565"  },
];

const SLOTS = [
  { id: "TW-01", type: "two_wheeler",  area: "Block A" },
  { id: "FW-01", type: "four_wheeler", area: "Block B" },
];

// In-memory bookings  { slotId → bookingObj }
const bookings = {};

// Track which slots have already sent an arrival email (reset on new booking)
const arrivedNotified = new Set();

// ============================================================
// THINGSPEAK
// ============================================================
async function getThingSpeakData() {
  try {
    const url = `https://api.thingspeak.com/channels/${TS_CHANNEL_ID}/feeds/last.json?api_key=${TS_READ_KEY}`;
    const res = await axios.get(url, { timeout: 8000 });
    const feed = res.data;
    return {
      tw_slot:     parseInt(feed.field1) || 0,
      fw_slot:     parseInt(feed.field2) || 0,
      gate_status: parseInt(feed.field3) || 0,
      updated_at:  feed.created_at,
      ok:          true,
    };
  } catch (err) {
    console.error("[TS] Error:", err.message);
    return { tw_slot: 0, fw_slot: 0, gate_status: 0, updated_at: null, ok: false };
  }
}

// ============================================================
// BACKGROUND SENSOR LOOP
// Runs every 5 seconds — triggers arrival and no-show emails.
// ============================================================
async function runSensorCheck() {
  if (Object.keys(bookings).length === 0) return;

  const sensor = await getThingSpeakData();
  if (!sensor.ok) return;

  const now = Date.now();

  for (const slot of SLOTS) {
    const booking = bookings[slot.id];
    if (!booking) continue;

    const sensorOccupied =
      slot.id === "TW-01" ? sensor.tw_slot === 1 : sensor.fw_slot === 1;

    // ── Arrival detected by IR sensor ─────────────────────
    if (sensorOccupied && !arrivedNotified.has(slot.id)) {
      arrivedNotified.add(slot.id);
      const user = USERS.find(u => u.id === booking.userId);
      if (user) {
        console.log(`[Sensor] Arrival detected: ${user.name} → ${slot.id}`);
        await emailVehicleArrived({ user, slot, arrivedAt: now });
      }
    }

    // ── No-show: window elapsed with no vehicle ────────────
    if (now > booking.expiresAt) {
      if (!arrivedNotified.has(slot.id)) {
        const user = USERS.find(u => u.id === booking.userId);
        if (user) {
          console.log(`[Sensor] No-show: ${user.name} → ${slot.id}`);
          await emailNoShow({ user, slot, expiredAt: booking.expiresAt });
        }
      }
      arrivedNotified.delete(slot.id);
      delete bookings[slot.id];
      console.log(`[Booking] Expired and released: ${slot.id}`);
    }
  }
}

setInterval(runSensorCheck, 5000);

// ============================================================
// ROUTES
// ============================================================

app.get("/", (req, res) => res.json({ status: "ParkLink API v2" }));

// ── GET /api/status ────────────────────────────────────────
app.get("/api/status", async (req, res) => {
  const sensor = await getThingSpeakData();

  const status = SLOTS.map(slot => {
    const booking        = bookings[slot.id];
    const sensorOccupied =
      slot.id === "TW-01" ? sensor.tw_slot === 1 : sensor.fw_slot === 1;

    return {
      slotId:    slot.id,
      area:      slot.area,
      type:      slot.type,
      sensor:    sensorOccupied,
      booked:    !!booking,
      occupied:  sensorOccupied || !!booking,
      bookedBy:  booking?.userName  || null,
      expiresAt: booking?.expiresAt || null,
    };
  });

  res.json({
    status,
    gate_open:  sensor.gate_status === 1,
    updated_at: sensor.updated_at,
    sensor_ok:  sensor.ok,
  });
});

// ── POST /api/book ─────────────────────────────────────────
app.post("/api/book", async (req, res) => {
  const { userId, slotId } = req.body;

  const user = USERS.find(u => u.id === parseInt(userId));
  if (!user) return res.status(404).json({ error: "User not found" });

  const slot = SLOTS.find(s => s.id === slotId);
  if (!slot) return res.status(404).json({ error: "Slot not found" });

  if (bookings[slotId] && Date.now() < bookings[slotId].expiresAt)
    return res.status(409).json({ error: "Slot already booked" });

  const existing = Object.values(bookings).find(
    b => b.userId === user.id && Date.now() < b.expiresAt
  );
  if (existing)
    return res.status(409).json({ error: "You already have an active booking", booking: existing });

  if (user.vehicleType !== slot.type)
    return res.status(400).json({ error: `Vehicle type mismatch: your ${user.vehicleType} vs slot ${slot.type}` });

  const EXPIRY_SECONDS = 30;
  const now = Date.now();
  const booking = {
    userId:    user.id,
    userName:  user.name,
    userEmail: user.email,
    slotId,
    slotArea:  slot.area,
    bookedAt:  now,
    expiresAt: now + EXPIRY_SECONDS * 1000,
  };

  bookings[slotId] = booking;
  arrivedNotified.delete(slotId);
  console.log(`[Booking] ${user.name} → ${slotId}`);

  await emailBookingConfirmed({ user, slot, booking });

  res.status(201).json({ message: "Slot booked", booking });
});

// ── POST /api/cancel/:slotId ───────────────────────────────
app.post("/api/cancel/:slotId", async (req, res) => {
  const { slotId } = req.params;

  if (!bookings[slotId])
    return res.status(404).json({ error: "No active booking for this slot" });

  const booking = bookings[slotId];
  const user    = USERS.find(u => u.id === booking.userId);
  const slot    = SLOTS.find(s => s.id === slotId);

  delete bookings[slotId];
  arrivedNotified.delete(slotId);
  console.log(`[Booking] Cancelled: ${slotId}`);

  if (user && slot) await emailBookingCancelled({ user, slot });

  res.json({ message: "Booking cancelled", booking });
});

// ── POST /api/notify/slot-assigned ────────────────────────
app.post("/api/notify/slot-assigned", async (req, res) => {
  const results = [];

  for (const user of USERS) {
    const slot = SLOTS.find(s => s.type === user.vehicleType);
    if (slot) {
      await emailSlotAssigned({ user, slot });
      results.push({ user: user.name, slot: slot.id, sent: true });
    }
  }

  res.json({ message: "Slot assignment emails sent", results });
});

// ── GET /api/bookings/:userId ──────────────────────────────
app.get("/api/bookings/:userId", (req, res) => {
  const userId = parseInt(req.params.userId);
  const active = Object.values(bookings).filter(
    b => b.userId === userId && Date.now() < b.expiresAt
  );
  res.json({ bookings: active });
});

// ============================================================
// START
// ============================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`ParkLink API → http://localhost:${PORT}`);
  console.log("  GET  /api/status");
  console.log("  POST /api/book");
  console.log("  POST /api/cancel/:slotId");
  console.log("  POST /api/notify/slot-assigned");
  console.log("  GET  /api/bookings/:userId");

  console.log("\n[Startup] Sending slot assignment emails...");
  for (const user of USERS) {
    const slot = SLOTS.find(s => s.type === user.vehicleType);
    if (slot) {
      await emailSlotAssigned({ user, slot });
      console.log(`[Startup] Slot assigned email → ${user.name} (${slot.id})`);
    }
  }
  console.log("[Startup] Done. Background sensor loop running every 5s.\n");
});