# ============================================================
#  F.A.C.E — Phase 4  |  FR-6 + FR-7: Drowsiness Detection
#  File: drowsiness_test_fr6_fr7.py
#  Goal: If EAR stays LOW for N frames → trigger DROWSY alert
#        Count drowsiness events per session
# ============================================================

import cv2
import dlib
import numpy as np
from scipy.spatial import distance as dist
import time

# ── Tuning constants ─────────────────────────────────────────
EAR_THRESHOLD   = 0.25   # Below this = eye is "closed"
CONSEC_FRAMES   = 20     # Must be closed for 20 frames in a row
                          # (~0.67 seconds at 30fps) → then DROWSY
# ── EAR formula ─────────────────────────────────────────────
def calculate_EAR(eye_pts):
    A = dist.euclidean(eye_pts[1], eye_pts[5])
    B = dist.euclidean(eye_pts[2], eye_pts[4])
    C = dist.euclidean(eye_pts[0], eye_pts[3])
    return (A + B) / (2.0 * C)

def get_eye_points(landmarks, start, end):
    return [(landmarks.part(i).x, landmarks.part(i).y)
            for i in range(start, end)]

# ── Load tools ──────────────────────────────────────────────
detector  = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

cap = cv2.VideoCapture(0)
print("[INFO] FR-6/FR-7 Drowsiness Detection running. ESC to quit.")

# ── State variables ─────────────────────────────────────────
frame_counter    = 0   # How many consecutive low-EAR frames
drowsy_events    = 0   # Total times drowsiness was triggered
is_drowsy        = False
session_start    = time.time()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)

    session_seconds = int(time.time() - session_start)

    for face in faces:
        landmarks = predictor(gray, face)

        left_eye  = get_eye_points(landmarks, 36, 42)
        right_eye = get_eye_points(landmarks, 42, 48)

        left_EAR  = calculate_EAR(left_eye)
        right_EAR = calculate_EAR(right_eye)
        avg_EAR   = (left_EAR + right_EAR) / 2.0

        # ── FR-6: Threshold logic ────────────────────────────
        if avg_EAR < EAR_THRESHOLD:
            frame_counter += 1          # Eye is closing, count up
        else:
            # Eye opened again
            if is_drowsy:
                is_drowsy = False       # Reset alert state
            frame_counter = 0           # Reset consecutive counter

        # ── FR-7: Trigger drowsiness event ──────────────────
        if frame_counter >= CONSEC_FRAMES and not is_drowsy:
            drowsy_events += 1
            is_drowsy = True
            print(f"[ALERT] Drowsiness event #{drowsy_events} detected!")

        # Draw eye outlines
        for eye in [left_eye, right_eye]:
            pts = np.array(eye, dtype=np.int32)
            color = (0, 0, 255) if avg_EAR < EAR_THRESHOLD else (0, 255, 255)
            cv2.polylines(frame, [pts], isClosed=True, color=color, thickness=1)

        # EAR display
        ear_color = (0, 255, 100) if avg_EAR >= EAR_THRESHOLD else (0, 80, 255)
        cv2.putText(frame, f"EAR: {avg_EAR:.3f}", (10, 90),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.75, ear_color, 2)
        cv2.putText(frame, f"Frame streak: {frame_counter}/{CONSEC_FRAMES}", (10, 120),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (180, 180, 180), 1)

    # ── DROWSY ALERT OVERLAY ────────────────────────────────
    if is_drowsy:
        # Red tint overlay
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (frame.shape[1], frame.shape[0]),
                      (0, 0, 180), -1)
        cv2.addWeighted(overlay, 0.25, frame, 0.75, 0, frame)

        # Big warning text
        cv2.putText(frame, "⚠  DROWSY DETECTED", (60, frame.shape[0] // 2),
                    cv2.FONT_HERSHEY_DUPLEX, 1.1, (0, 0, 255), 3)
        cv2.putText(frame, "Please stay alert!", (120, frame.shape[0] // 2 + 45),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 0, 200), 2)

    # ── Session info bar ────────────────────────────────────
    cv2.putText(frame, f"Session: {session_seconds}s  |  Faces: {len(faces)}",
                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1)
    cv2.putText(frame, f"Drowsy events: {drowsy_events}", (10, 58),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65,
                (0, 80, 255) if drowsy_events > 0 else (100, 200, 100), 1)
    cv2.putText(frame, "Threshold: 0.25 | Frames: 20 | ESC=quit",
                (10, frame.shape[0] - 12),
                cv2.FONT_HERSHEY_PLAIN, 1.0, (80, 80, 80), 1)

    cv2.imshow("F.A.C.E — Drowsiness FR6+FR7", frame)
    if cv2.waitKey(1) == 27:
        break

# ── End of session summary ──────────────────────────────────
print(f"\n[SUMMARY] Session time: {int(time.time()-session_start)}s")
print(f"[SUMMARY] Total drowsiness events: {drowsy_events}")

cap.release()
cv2.destroyAllWindows()