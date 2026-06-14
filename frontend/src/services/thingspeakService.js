// thingspeakService.js
// Fetches the latest sensor data from ThingSpeak for the frontend.
// The backend has its own copy of this logic in getThingSpeakData().

const TS_CHANNEL_ID = "3314978";
const TS_READ_KEY   = "3FEN2L2GTMGPHM6V";

export async function fetchSensorData() {
  try {
    const url = `https://api.thingspeak.com/channels/${TS_CHANNEL_ID}/feeds/last.json?api_key=${TS_READ_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const feed = await res.json();
    return {
      tw_slot:     parseInt(feed.field1) || 0,
      fw_slot:     parseInt(feed.field2) || 0,
      gate_status: parseInt(feed.field3) || 0,
      updated_at:  feed.created_at,
      ok:          true,
    };
  } catch (err) {
    console.warn("[ThingSpeak] Fetch failed:", err.message);
    return { tw_slot: 0, fw_slot: 0, gate_status: 0, updated_at: null, ok: false };
  }
}