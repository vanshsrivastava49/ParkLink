#include <WiFi.h>
#include <ESP_Mail_Client.h>
#include <ESP32Servo.h>

// ---------------- WIFI ----------------
#define WIFI_SSID      ""
#define WIFI_PASSWORD  ""

// ---------------- EMAIL ----------------
#define SMTP_HOST       "smtp.gmail.com"
#define SMTP_PORT       
#define AUTHOR_EMAIL    ""
#define AUTHOR_PASSWORD ""

#define USER_2W_EMAIL   ""
#define USER_4W_EMAIL   ""

// ---------------- PINS ----------------
#define IR_TWO    4
#define IR_FOUR   5
#define TRIG_PIN  18
#define ECHO_PIN  19
#define SERVO_PIN 23

#define GATE_OPEN   90
#define GATE_CLOSED  0

#define DETECT_CM   15   // vehicle AT gate
#define CLEAR_CM    40   // vehicle has passed

// HC-SR04 reliable max range is ~200 cm for a model
// anything above this is treated as "nothing detected"
#define MAX_RELIABLE_CM 200

SMTPSession smtp;
Servo gateServo;

// -------- GATE STATE --------
struct GateState {
  bool isOpen;
  bool vehicleDetected;
  bool vehiclePassing;
  unsigned long openTime;
};

GateState gate = {false, false, false, 0};

// -------- SLOT STRUCTURE --------
struct ParkingSlot {
  String vehicleType;
  String slotNumber;
  String area;
  String email;
  bool assigned;
  bool arrived;
  bool releaseSent;
  bool timerStarted;
  unsigned long assignTime;
};

ParkingSlot twoWheeler  = {"Two Wheeler",  "TW-01", "Block A", USER_2W_EMAIL,  false, false, false, false, 0};
ParkingSlot fourWheeler = {"Four Wheeler", "FW-01", "Block B", USER_4W_EMAIL, false, false, false, false, 0};

// ================= ULTRASONIC =================
// Single clean reading with a tighter pulseIn timeout
// HC-SR04 max range ~400 cm → round trip at 340 m/s = ~23 ms
// We use 15000 µs (≈255 cm max) since your model is small
long getRawDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(4);           // slightly longer LOW settle
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // 15000 µs timeout = max ~255 cm — anything beyond is noise
  long dur = pulseIn(ECHO_PIN, HIGH, 15000);

  if (dur == 0) return 999;       // no echo = nothing in range

  long cm = dur * 0.034 / 2;

  // Discard readings beyond reliable range for your setup
  if (cm > MAX_RELIABLE_CM) return 999;

  return cm;
}

// Median of 5 readings — much more stable than average of 2
long measureDistance() {
  long readings[5];

  for (int i = 0; i < 5; i++) {
    readings[i] = getRawDistance();
    delay(15);  // HC-SR04 needs ~12 ms between pings to avoid echo crosstalk
  }

  // Simple insertion sort to find median
  for (int i = 1; i < 5; i++) {
    long key = readings[i];
    int j = i - 1;
    while (j >= 0 && readings[j] > key) {
      readings[j + 1] = readings[j];
      j--;
    }
    readings[j + 1] = key;
  }

  return readings[2]; // middle value = median
}

// ================= EMAIL =================
void sendEmail(String recipient, String subject, String body) {
  SMTP_Message message;
  message.sender.name  = "ParkLink";
  message.sender.email = AUTHOR_EMAIL;
  message.subject      = subject;
  message.addRecipient("User", recipient);
  message.text.content = body.c_str();

  ESP_Mail_Session session;
  session.server.host_name = SMTP_HOST;
  session.server.port      = SMTP_PORT;
  session.login.email      = AUTHOR_EMAIL;
  session.login.password   = AUTHOR_PASSWORD;

  if (!smtp.connect(&session)) {
    Serial.println("Email connection failed");
    return;
  }

  if (!MailClient.sendMail(&smtp, &message)) {
    Serial.println("Email sending failed");
  } else {
    Serial.println("Email sent successfully");
  }
}

// ================= SLOT ACTIONS =================
void assignSlot(ParkingSlot &slot) {
  sendEmail(slot.email, "ParkLink: Slot Assigned",
            "Vehicle Type: " + slot.vehicleType +
            "\nSlot: "        + slot.slotNumber  +
            "\nArea: "        + slot.area         +
            "\n\nProceed to gate.");

  slot.assigned     = true;
  slot.arrived      = false;
  slot.releaseSent  = false;
  slot.timerStarted = false;

  Serial.println("Assigned: " + slot.vehicleType);
}

void confirmArrival(ParkingSlot &slot) {
  if (slot.arrived) return;

  sendEmail(slot.email, "ParkLink: Booking Confirmed",
            "Slot " + slot.slotNumber + " confirmed. Welcome!");

  slot.arrived = true;
  Serial.println("Arrived: " + slot.vehicleType);
}

void releaseSlot(ParkingSlot &slot) {
  if (slot.releaseSent || slot.arrived) return;

  sendEmail(slot.email, "ParkLink: Slot Released",
            "Slot " + slot.slotNumber + " released — no arrival.");

  slot.releaseSent = true;
  Serial.println("Released: " + slot.vehicleType);
}

// ================= GATE =================
void openGate() {
  Serial.println("Opening gate...");
  gateServo.write(GATE_OPEN);
  delay(100);

  gate.isOpen         = true;
  gate.vehiclePassing = false;
  gate.openTime       = millis();

  Serial.println("Gate OPENED");
}

void closeGate() {
  gateServo.write(GATE_CLOSED);
  gate.isOpen          = false;
  gate.vehicleDetected = false;
  gate.vehiclePassing  = false;
  Serial.println("Gate CLOSED");
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(IR_TWO,   INPUT);
  pinMode(IR_FOUR,  INPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  digitalWrite(TRIG_PIN, LOW);   // ensure TRIG starts LOW

  gateServo.attach(SERVO_PIN, 500, 2400);
  delay(200);
  gateServo.write(GATE_CLOSED);
  delay(500);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Connected");

  assignSlot(twoWheeler);
  delay(2000);
  assignSlot(fourWheeler);
}

// ================= LOOP =================
void loop() {

  long dist = measureDistance();

  Serial.print("Distance: ");
  Serial.print(dist);
  Serial.println(" cm");

  // Require 3 consecutive close readings before opening gate
  // prevents a single stray reflection from triggering it
  static int detectCount = 0;
  if (dist < DETECT_CM) detectCount = min(detectCount + 1, 3);
  else                  detectCount = max(detectCount - 1, 0);

  bool atGate    = (detectCount >= 3);
  bool cleared   = (dist > CLEAR_CM && dist < 999);

  bool twoPending  = twoWheeler.assigned  && !twoWheeler.arrived  && !twoWheeler.releaseSent;
  bool fourPending = fourWheeler.assigned && !fourWheeler.arrived && !fourWheeler.releaseSent;
  bool anyPending  = twoPending || fourPending;

  // -------- GATE OPEN --------
  if (!gate.isOpen && atGate && anyPending) {
    gate.vehicleDetected = true;
    openGate();

    if (twoPending && !twoWheeler.timerStarted) {
      twoWheeler.assignTime   = millis();
      twoWheeler.timerStarted = true;
      Serial.println("Timer started: Two Wheeler");
    }
    if (fourPending && !fourWheeler.timerStarted) {
      fourWheeler.assignTime   = millis();
      fourWheeler.timerStarted = true;
      Serial.println("Timer started: Four Wheeler");
    }
  }

  // -------- GATE CLOSE --------
  if (gate.isOpen) {

    if (gate.vehicleDetected && cleared && !gate.vehiclePassing) {
      gate.vehiclePassing = true;
      Serial.println("Vehicle passed — closing gate");
      closeGate();
    }

    if (millis() - gate.openTime > 10000) {
      Serial.println("Gate timeout — closing");
      closeGate();
    }
  }

  // -------- IR DETECTION --------
  bool twoIR  = !digitalRead(IR_TWO);
  bool fourIR = !digitalRead(IR_FOUR);

  if (twoIR  && twoPending)  confirmArrival(twoWheeler);
  if (fourIR && fourPending) confirmArrival(fourWheeler);

  // -------- 30s RELEASE --------
  if (twoPending  && twoWheeler.timerStarted  &&
      millis() - twoWheeler.assignTime  > 30000) releaseSlot(twoWheeler);

  if (fourPending && fourWheeler.timerStarted &&
      millis() - fourWheeler.assignTime > 30000) releaseSlot(fourWheeler);

  delay(50);
}