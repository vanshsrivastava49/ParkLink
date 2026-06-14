export const USERS_DB = [
  {
    id:           1,
    name:         "Vansh Srivastava",
    email:        "srivastavavansh049@gmail.com",
    password:     "vansh123",
    phone:        "9876543210",
    vehicleType:  "four_wheeler",
    vehicleNumber:"UP32GB0606",
    avatar:       "VS",
    avatarColor:  "#f59e0b",
    joinedAt:     "2024-01-15",
  },
  {
    id:           2,
    name:         "Utkarsh Prakash",
    email:        "up3767@srmist.edu.in",
    password:     "utkarsh123",
    phone:        "9123456789",
    vehicleType:  "two_wheeler",
    vehicleNumber:"DL01L3565",
    avatar:       "UP",
    avatarColor:  "#4f6ff5",
    joinedAt:     "2024-02-20",
  },
];

export const SLOTS = [
  {
    id:     "TW-01",
    type:   "two_wheeler",
    area:   "Block A",
    label:  "Two Wheeler Bay 01",
    floor:  "Ground",
  },
  {
    id:     "FW-01",
    type:   "four_wheeler",
    area:   "Block B",
    label:  "Four Wheeler Bay 01",
    floor:  "Ground",
  },
];

export const EXPIRY_SECONDS = 30;
export const POLL_INTERVAL  = 15000; // 15s — ThingSpeak free tier

// Backend API base URL — set VITE_API_URL in your .env file
// e.g. VITE_API_URL=http://localhost:3001
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";