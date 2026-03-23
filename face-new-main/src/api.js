// ============================================================
//  F.A.C.E — React API Service
//  File: src/services/api.js
//  Purpose: All calls to the Python Flask backend go here
//  Python server runs at: http://localhost:5000
// ============================================================

const BASE_URL = "http://localhost:5000/api";

// ── 1. Check if session is running ──────────────────────────
export async function getStatus() {
  const res = await fetch(`${BASE_URL}/status`);
  return res.json();
  // Returns: { running, totalTime, studentCount }
}

// ── 2. Start a new session ───────────────────────────────────
export async function startSession() {
  const res = await fetch(`${BASE_URL}/start-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
  // Returns: { success, message }
}

// ── 3. Send a camera frame for recognition ───────────────────
//  imageBase64 = string from canvas.toDataURL("image/jpeg", 0.8)
export async function recognizeFrame(imageBase64) {
  const res = await fetch(`${BASE_URL}/recognize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64 }),
  });
  return res.json();
  // Returns: {
  //   faces: [{ name, confidence, ear, isDrowsy, activeTime,
  //             engagement, drowsyEvents, status, box:{x,y,w,h} }],
  //   faceCount, timestamp
  // }
}

// ── 4. Get current attendance table ─────────────────────────
export async function getAttendance() {
  const res = await fetch(`${BASE_URL}/attendance`);
  return res.json();
  // Returns: {
  //   attendance: [{ name, status, timeMarked, activeTime,
  //                  engagement, drowsyEvents }],
  //   totalTime
  // }
}

// ── 5. End session — saves CSV, returns final report ────────
export async function endSession() {
  const res = await fetch(`${BASE_URL}/end-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
  // Returns: { success, attendance, csvFile, message }
}
