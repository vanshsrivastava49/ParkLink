# ParkLink
### IoT-Based Smart Parking and Reservation System with RFID-Driven Access Control and Vehicle-Class Enforcement

> 📄 **Research paper accepted at 2 international conferences** — see [Publication](#-publication) section below.

---

## Overview

ParkLink is a full-stack IoT prototype that solves two problems most smart parking systems ignore: **real-time visibility** and **physical enforcement**. Sensor-only systems can tell you which bays are free, but they can't stop an unauthorised vehicle from taking a reserved spot. ParkLink combines per-bay IR occupancy sensing with RFID-authenticated gate control and vehicle-class enforcement — all tied together through a cloud-connected backend, live React dashboard, and a six-event HTML email notification pipeline.

---

## 📄 Publication

**"ParkLink: An IoT-Based Smart Parking and Reservation System with RFID-Driven Access Control and Vehicle-Class Enforcement"**

**Authors:** Vansh Srivastava, Utkarsh Prakash, Aswini Krishnan
**Institution:** SRM Institute of Science and Technology, Kattankulathur, Tamil Nadu

> ✅ Accepted at **2 International Conferences** *(names to be added upon public proceedings release)*

### Abstract
A prototype combining IR occupancy sensing, RFID authentication, vehicle-class enforcement, cloud telemetry via ThingSpeak, a Node.js/Express REST backend, and a React dashboard. Bench tests showed 100% IR detection accuracy, 80–120 ms RFID read latency, 300–500 ms gate actuation, zero false openings, and correct delivery of all 12 lifecycle emails across 6 event types.

---

## ✨ Key Features

- **Per-Bay IR Occupancy Detection** — FC-51 sensors on each parking slot, 100% detection accuracy in testing
- **RFID Gate Authentication** — RC522 reader with three-factor check: identity + active reservation + vehicle class
- **Vehicle-Class Enforcement** — Two-wheeler (TW) and four-wheeler (FW) slots enforced at both booking and physical entry
- **30-Second Arrival Window** — Reservations auto-expire if the user doesn't arrive; slot is released for others
- **6-Event Email Pipeline** — HTML emails via Nodemailer/Gmail SMTP for every reservation state transition
- **Live React Dashboard** — 4-tab UI with per-slot countdown timers, ThingSpeak polling, and in-app notifications
- **ThingSpeak Cloud Bridge** — Sensor telemetry relayed every 15 seconds; no persistent socket required
- **Zero False Gate Openings** — Verified across all 6 RFID authentication scenarios in structured testing

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────┐
│           Hardware Layer            │
│  ESP32 + IR Sensors + HC-SR04P     │
│  RC522 RFID Reader + SG90 Servo    │
└────────────────┬────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   ThingSpeak        Direct HTTP
  (telemetry)     (RFID auth — low latency)
        │                 │
        └────────┬────────┘
                 │
┌────────────────▼────────────────────┐
│       Node.js / Express Backend     │
│  Booking lifecycle • RFID verify    │
│  No-show expiry • Email pipeline    │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│         React + Vite Frontend       │
│  Summary • Slots • Bookings • Profile│
└─────────────────────────────────────┘
```

---

## 🔧 Hardware Stack

| Component | Role | GPIO |
|-----------|------|------|
| ESP32 (38-pin) | Central microcontroller | — |
| FC-51 IR Sensor × 2 | Per-bay occupancy (HIGH = empty, LOW = occupied) | GPIO 4 (TW-01), GPIO 5 (FW-01) |
| HC-SR04P Ultrasonic | Vehicle proximity at gate | TRIG: GPIO 18, ECHO: GPIO 19 |
| RC522 RFID Reader | Tag UID scan at gate | MOSI: 23, MISO: 19, SCK: 18, SS: 5, RST: 27 |
| SG90 Servo | Gate arm actuator | GPIO 23 |

- IR sensors and RFID reader on **3.3 V rail**
- Servo on separate **5 V rail** (shared ground) to prevent brownout

---

## 💻 Software Stack

| Layer | Technology |
|-------|-----------|
| Firmware | Arduino C++ on ESP32 |
| Cloud Telemetry | ThingSpeak |
| Backend | Node.js + Express |
| Email | Nodemailer + Gmail SMTP |
| Frontend | React + Vite |
| In-memory Store | JavaScript Map/Set (backend) |

---

## 🔐 RFID Authentication Flow

Every gate-open decision runs three checks in sequence:

1. **Is the UID registered?** — Unknown tags are immediately denied
2. **Does the user have an active, unexpired reservation?** — No booking = no entry
3. **Does the tag's vehicle class match the reserved slot type?** — TW tag at FW slot = denied

**Response codes:**
- `GRANT` → servo opens to 90°, "Vehicle Arrived" email sent
- `DENY_CLASS` → gate stays closed, "Class Mismatch" email sent
- `DENY_UNREGISTERED` → gate stays closed, no email

### RFID Test Matrix Results

| Scenario | Expected | Gate | Email |
|----------|----------|------|-------|
| FW tag + FW reservation | GRANT | Open | Arrived ✅ |
| TW tag + TW reservation | GRANT | Open | Arrived ✅ |
| FW tag + TW slot | DENY | Closed | Mismatch ✅ |
| TW tag + FW slot | DENY | Closed | Mismatch ✅ |
| Unregistered tag | DENY | Closed | None ✅ |
| Tag, no reservation | DENY | Closed | None ✅ |

---

## 📧 Email Notification Pipeline

Six HTML email templates cover the full reservation lifecycle:

| # | Event | Accent | Trigger |
|---|-------|--------|---------|
| 1 | **Slot Assigned** | Blue | Server start |
| 2 | **Booking Confirmed** | Green | Successful reservation |
| 3 | **Vehicle Arrived (RFID Verified)** | Cyan | GRANT response |
| 4 | **Vehicle-Class Mismatch** | Orange | Wrong-class scan |
| 5 | **No-Show / Expired** | Red | Arrival window elapsed |
| 6 | **Booking Cancelled** | Amber | User cancels via dashboard |

All 12 emails (6 events × 2 vehicle classes) delivered correctly in testing — no missed deliveries, no duplicates.

---

## 📊 Performance Summary

| Parameter | Result |
|-----------|--------|
| RFID read latency | 80–120 ms |
| Gate open latency | 300–500 ms |
| Gate close latency | < 200 ms |
| Safety auto-close timeout | 5 seconds |
| RFID auth accuracy | 100% |
| Class mismatch denial rate | 100% |
| False gate openings | 0 |
| IR sensor accuracy | 100% |
| Email delivery time | 2–5 seconds |
| ThingSpeak polling interval | 15 seconds |
| Dashboard refresh interval | 15 seconds |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Arduino IDE with ESP32 board support
- ThingSpeak account (free tier)
- Gmail account with App Password enabled

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file:
```env
THINGSPEAK_CHANNEL_ID=your_channel_id
THINGSPEAK_API_KEY=your_read_api_key
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password
PORT=5000
```

```bash
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### ESP32 Firmware
1. Open `firmware/parklink.ino` in Arduino IDE
2. Install libraries: `MFRC522`, `ESP32Servo`, `WiFi`, `HTTPClient`
3. Update WiFi credentials and backend IP in the sketch
4. Flash to ESP32

---

## 🔮 Future Work

1. **5G over MQTT/URLLC** — Reduce gate-command latency from 300–500 ms to below 10 ms; mMTC for multi-zone campus coverage
2. **Digital Twin** — Real-time 3D occupancy visualisation, predictive traffic modelling, sensor anomaly detection
3. **Dual-Factor Auth** — Pair RFID with an ANPR camera for independent licence-plate verification
4. **MongoDB Persistence** — Replace in-memory store with persistent booking records and longitudinal analytics
5. **Multi-Zone Scalability** — Node.js/MongoDB/MQTT backend serving multiple campus lots simultaneously

---

## 👥 Authors

| Name | Email | Institution |
|------|-------|-------------|
| Vansh Srivastava | srivastavavansh11@gmail.com | SRM IST, Kattankulathur |
| Utkarsh Prakash | up3767@srmist.edu.in | SRM IST, Kattankulathur |
| Aswini Krishnan | aswinik1@srmist.edu.in | SRM IST, Kattankulathur |

---

## 📜 License

This project is for academic and research purposes. Please cite the paper if you use this work.

---

*ParkLink — Smart IoT Parking · SRM Institute of Science and Technology*
