#include <ESP32Servo.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <EEPROM.h>

// ---------- WIFI ----------
#define WIFI_SSID     "YourWifiSSID"
#define WIFI_PASSWORD "Your Pass"

// ---------- THINGSPEAK ----------
#define TS_API_KEY "Your api key"
#define TS_URL     "https://api.thingspeak.com/update"

// ---------- PINS ----------
#define TRIG_PIN      18
#define ECHO_PIN      19
#define SERVO_PIN     23
#define IR_TWO         4
#define IR_FOUR        5
#define REGISTER_BTN   2

// RC522
#define SS_PIN        21
#define RST_PIN       15

#define GATE_OPEN     0
#define GATE_CLOSED   90
#define DETECT_CM     20

// ---------- EEPROM ----------
#define EEPROM_SIZE   10
#define ADDR_CARD1     0
#define ADDR_SENTINEL  8

MFRC522 rfid(SS_PIN, RST_PIN);
Servo gateServo;

// ---------- SYSTEM STATE ----------
enum SystemMode {
  ENTRY_MODE,
  EXIT_MODE
};
SystemMode currentMode = ENTRY_MODE;

// ---------- VARIABLES ----------
bool gateOpen = false;
unsigned long gateOpenTime = 0;

bool prevTwo = false;
bool prevFour = false;
bool prevGate = false;

byte registeredCard1[4] = {0};
bool card1Registered = false;

// EXIT CONTROL FLAGS
bool vehicleDetectedForExit = false;
bool exitGateOpened = false;

// ThingSpeak timer
unsigned long lastTSUpdate = 0;

// ---------- THINGSPEAK ----------
void updateThingSpeak(int tw, int fw, int gate) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(TS_URL) +
               "?api_key=" + TS_API_KEY +
               "&field1=" + tw +
               "&field2=" + fw +
               "&field3=" + gate;

  http.begin(url);
  http.GET();
  http.end();
}

// ---------- ULTRASONIC ----------
long measureRaw() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(4);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long dur = pulseIn(ECHO_PIN, HIGH, 20000);
  if (dur == 0) return 999;

  long cm = dur * 0.034 / 2;
  return (cm > 200) ? 999 : cm;
}

long measureDistance() {
  long sum = 0;
  for (int i = 0; i < 3; i++) {
    sum += measureRaw();
    delay(10);
  }
  return sum / 3;
}

// ---------- GATE ----------
void openGate() {
  if (gateOpen) return;   // 🔥 prevent spam

  Serial.println("🚪 Opening Gate");
  gateServo.write(GATE_OPEN);
  gateOpen = true;
  gateOpenTime = millis();
}

void closeGate() {
  if (!gateOpen) return;

  Serial.println("🚪 Closing Gate");
  gateServo.write(GATE_CLOSED);
  gateOpen = false;
}

// ---------- EEPROM ----------
void saveCard() {
  for (int i = 0; i < 4; i++) {
    EEPROM.write(ADDR_CARD1 + i, registeredCard1[i]);
  }
  EEPROM.write(ADDR_SENTINEL, 0xAB);
  EEPROM.commit();
}

void loadCard() {
  if (EEPROM.read(ADDR_SENTINEL) != 0xAB) return;

  for (int i = 0; i < 4; i++) {
    registeredCard1[i] = EEPROM.read(ADDR_CARD1 + i);
  }
  card1Registered = true;
}

// ---------- RFID ----------
bool checkRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return false;
  if (!rfid.PICC_ReadCardSerial()) return false;

  for (int i = 0; i < 4; i++) {
    if (rfid.uid.uidByte[i] != registeredCard1[i]) {
      Serial.println("❌ ACCESS DENIED");
      return false;
    }
  }

  Serial.println("✅ ACCESS GRANTED");

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  return true;
}

// ---------- REGISTRATION ----------
void registerCard() {
  Serial.println("Tap card...");

  while (true) {
    if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) continue;

    for (int i = 0; i < 4; i++) {
      registeredCard1[i] = rfid.uid.uidByte[i];
    }

    saveCard();
    card1Registered = true;

    Serial.println("✅ Card Registered");
    break;
  }
}

// ---------- SETUP ----------
void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(IR_TWO, INPUT);
  pinMode(IR_FOUR, INPUT);
  pinMode(REGISTER_BTN, INPUT_PULLUP);

  SPI.begin(22, 17, 16, 21);
  rfid.PCD_Init();

  gateServo.attach(SERVO_PIN);
  gateServo.write(GATE_CLOSED);

  loadCard();
  if (!card1Registered) registerCard();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  Serial.println("🚀 System Ready");
}

// ---------- LOOP ----------
void loop() {

  // Register button
  if (digitalRead(REGISTER_BTN) == LOW) {
    delay(50);
    if (digitalRead(REGISTER_BTN) == LOW) {
      registerCard();
      delay(1000);
    }
  }

  long dist = measureDistance();
  Serial.println("Distance: " + String(dist));

  // ===== ENTRY =====
  if (currentMode == ENTRY_MODE) {

    if (!gateOpen && checkRFID()) {
      openGate();

      currentMode = EXIT_MODE;
      vehicleDetectedForExit = false;
      exitGateOpened = false;

      Serial.println("➡ EXIT MODE");
    }
  }

  // ===== EXIT =====
  else if (currentMode == EXIT_MODE) {

    // Detect vehicle once
    if (dist < DETECT_CM && !vehicleDetectedForExit) {
      vehicleDetectedForExit = true;
      Serial.println("🚗 Exit vehicle detected");
    }

    // Open gate ONLY once
    if (vehicleDetectedForExit && !exitGateOpened) {
      openGate();
      exitGateOpened = true;
    }

    // Wait for vehicle to leave
    if (exitGateOpened && dist > 30) {
      Serial.println("🚗 Vehicle exited");

      vehicleDetectedForExit = false;
      exitGateOpened = false;
      currentMode = ENTRY_MODE;
    }
  }

  // Auto close
  if (gateOpen && millis() - gateOpenTime > 5000) {
    closeGate();
  }

  // ---------- IR + ThingSpeak ----------
  bool twoIR = !digitalRead(IR_TWO);
  bool fourIR = !digitalRead(IR_FOUR);
  bool gateChanged = (gateOpen != prevGate);

  if ((twoIR != prevTwo || fourIR != prevFour || gateChanged) &&
      millis() - lastTSUpdate > 15000) {

    updateThingSpeak(twoIR, fourIR, gateOpen ? 1 : 0);

    lastTSUpdate = millis();
    prevTwo  = twoIR;
    prevFour = fourIR;
    prevGate = gateOpen;
  }

  delay(200);
}