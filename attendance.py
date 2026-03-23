# pyre-ignore-all-errors
# ============================================================
#  F.A.C.E — Phase 6
#  File: attendance.py
#  Goal: Recognition + EAR + Active Time + Attendance CSV
#  Built on top of: face_active.py (Phase 5)
# ============================================================

import os
import cv2
import dlib
import numpy as np
import pickle
import time
import pandas as pd
from datetime import datetime
from scipy.spatial import distance as dist

# ============================================================
#  SETTINGS
# ============================================================
DATASET_PATH      = "dataset"
ENCODINGS_FILE    = "encodings.pkl"
THRESHOLD         = 0.6       # face matching strictness
EAR_THRESHOLD     = 0.25      # below = eye closed
CONSEC_FRAMES     = 20        # frames before drowsy alert
PRESENT_SECONDS   = 3.0       # seconds visible before marked Present

# ============================================================
#  EAR FUNCTIONS
# ============================================================
def calculate_EAR(eye_pts):
    A = dist.euclidean(eye_pts[1], eye_pts[5])
    B = dist.euclidean(eye_pts[2], eye_pts[4])
    C = dist.euclidean(eye_pts[0], eye_pts[3])
    return (A + B) / (2.0 * C)

def get_eye_points(landmarks, start, end):
    return [(landmarks.part(i).x, landmarks.part(i).y)
            for i in range(start, end)]

# ============================================================
#  LOAD AI MODELS
# ============================================================
print("[INFO] Loading AI models...")
detector     = dlib.get_frontal_face_detector()
predictor    = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
face_encoder = dlib.face_recognition_model_v1("dlib_face_recognition_resnet_model_v1.dat")
print("[INFO] Models loaded!")

# ============================================================
#  SMART ENCODING — LOAD FROM PICKLE OR BUILD FRESH
# ============================================================
if os.path.exists(ENCODINGS_FILE):
    print("[INFO] Loading saved encodings...")
    with open(ENCODINGS_FILE, "rb") as f:
        data = pickle.load(f)
    known_encodings = data["encodings"]
    known_names     = data["names"]
    print(f"[INFO] Loaded {len(known_names)} encodings instantly!")
else:
    print("[INFO] Building encodings from dataset...")
    known_encodings = []
    known_names     = []

    for person in os.listdir(DATASET_PATH):
        person_path = os.path.join(DATASET_PATH, person)
        for image_name in os.listdir(person_path):
            image_path = os.path.join(person_path, image_name)
            img = cv2.imread(image_path)
            if img is None:
                continue
            gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = detector(gray)
            if len(faces) == 0:
                continue
            face      = faces[0]
            landmarks = predictor(gray, face)
            encoding  = face_encoder.compute_face_descriptor(img, landmarks)
            known_encodings.append(np.array(encoding))
            known_names.append(person)
            print(f"  Encoded: {person}")

    known_encodings = np.array(known_encodings)
    with open(ENCODINGS_FILE, "wb") as f:
        pickle.dump({"encodings": known_encodings, "names": known_names}, f)
    print(f"[INFO] Saved {len(known_names)} encodings.")

# ============================================================
#  SESSION STATE
# ============================================================
session_start = time.time()
frame_count = 0
cached_identities = []

# From Phase 5 — active time tracking
active_time    = {}
drowsy_events  = {}
frame_counter  = {}
is_drowsy      = {}

# NEW in Phase 6 — attendance tracking
recognition_time  = {}   # how many seconds each student's face has been visible
attendance_marked = {}   # True/False — has this student been officially marked Present?
attendance_time   = {}   # timestamp of when they were marked Present

# ============================================================
#  LIVE LOOP
# ============================================================
print("[INFO] Session started. Press ESC to end and save CSV.")
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray            = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Fast detection
    small_gray = cv2.resize(gray, (0, 0), fx=0.5, fy=0.5)
    faces = detector(small_gray)
    
    session_seconds = int(time.time() - session_start)
    frame_count += 1
    new_cached_identities = []

    for small_face in faces:
        x1, y1 = int(small_face.left() * 2), int(small_face.top() * 2)
        x2, y2 = int(small_face.right() * 2), int(small_face.bottom() * 2)
        face = dlib.rectangle(x1, y1, x2, y2)
        
        landmarks = predictor(gray, face)

        # ── RECOGNITION ──────────────────────────────────
        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2
        name = "UNKNOWN"
        confidence = 0.0
        
        match_found = False
        for cached in cached_identities:
            cx, cy = cached['center']
            if abs(center_x - cx) < 50 and abs(center_y - cy) < 50:
                name = cached['name']
                confidence = cached['confidence']
                match_found = True
                break
                
        if not match_found or frame_count % 10 == 0:
            live_encoding = np.array(
                face_encoder.compute_face_descriptor(frame, landmarks)
            )
            if len(known_encodings) > 0:
                distances    = np.linalg.norm(known_encodings - live_encoding, axis=1)
                min_index    = np.argmin(distances)
                min_distance = distances[min_index]
                name         = known_names[min_index] if min_distance < THRESHOLD else "UNKNOWN"
                confidence   = round((1 - min_distance) * 100, 2)
                
        new_cached_identities.append({
            "center": (center_x, center_y),
            "name": name,
            "confidence": confidence
        })

        if name == "UNKNOWN":
            cv2.rectangle(frame,(x1,y1),(x2,y2),(0,0,255),2)
            cv2.putText(frame,"UNKNOWN",(x1,y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX,0.7,(0,0,255),2)
            continue

        # ── INITIALISE FOR NEW STUDENT ───────────────────
        if name not in active_time:
            active_time[name]       = 0.0
            drowsy_events[name]     = 0
            frame_counter[name]     = 0
            is_drowsy[name]         = False
            recognition_time[name]  = 0.0       # NEW
            attendance_marked[name] = False      # NEW
            attendance_time[name]   = None       # NEW

        # ── EAR ──────────────────────────────────────────
        left_eye  = get_eye_points(landmarks, 36, 42)
        right_eye = get_eye_points(landmarks, 42, 48)
        avg_EAR   = (calculate_EAR(left_eye) + calculate_EAR(right_eye)) / 2.0

        # ── DROWSINESS ───────────────────────────────────
        if avg_EAR < EAR_THRESHOLD:
            frame_counter[name] += 1
        else:
            if is_drowsy[name]:
                is_drowsy[name] = False
            frame_counter[name] = 0

        if frame_counter[name] >= CONSEC_FRAMES and not is_drowsy[name]:
            drowsy_events[name] += 1
            is_drowsy[name]      = True

        # ── ACTIVE TIME ──────────────────────────────────
        if avg_EAR >= EAR_THRESHOLD:
            active_time[name] += 1 / 30

        # ── ATTENDANCE LOGIC (NEW in Phase 6) ────────────
        # Count every frame the face is visible (~1/30 sec each)
        recognition_time[name] += 1 / 30

        # Mark Present once recognition_time crosses 3 seconds
        if recognition_time[name] >= PRESENT_SECONDS and not attendance_marked[name]:
            attendance_marked[name] = True
            attendance_time[name]   = datetime.now().strftime("%H:%M:%S")
            print(f"[PRESENT] {name} marked Present at {attendance_time[name]}")

        # ── DRAW ─────────────────────────────────────────
        x1,y1,x2,y2 = face.left(),face.top(),face.right(),face.bottom()
        color = (0,0,255) if is_drowsy[name] else (0,255,0)

        cv2.rectangle(frame,(x1,y1),(x2,y2),color,2)
        cv2.putText(frame,f"{name} {confidence}%",(x1,y1-10),
                    cv2.FONT_HERSHEY_SIMPLEX,0.7,color,2)
        cv2.putText(frame,f"EAR:{avg_EAR:.2f}",(x1,y2+20),
                    cv2.FONT_HERSHEY_SIMPLEX,0.55,(255,255,0),1)
        cv2.putText(frame,f"Active:{active_time[name]:.1f}s",(x1,y2+40),
                    cv2.FONT_HERSHEY_SIMPLEX,0.55,(0,255,255),1)

        # Show attendance status on frame
        att_label = "PRESENT" if attendance_marked[name] else f"Verifying...{recognition_time[name]:.1f}s"
        att_color = (0,255,0) if attendance_marked[name] else (0,200,255)
        cv2.putText(frame, att_label,(x1,y2+60),
                    cv2.FONT_HERSHEY_SIMPLEX,0.55,att_color,1)

        if is_drowsy[name]:
            cv2.putText(frame,"! DROWSY",(x1,y1-35),
                        cv2.FONT_HERSHEY_SIMPLEX,0.7,(0,0,255),2)

    cached_identities = new_cached_identities

    # Session info bar
    cv2.putText(frame,f"Session: {session_seconds}s  |  ESC = end & save CSV",
                (10,30),cv2.FONT_HERSHEY_SIMPLEX,0.65,(200,200,200),1)

    cv2.imshow("F.A.C.E - Phase 6", frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()

# ============================================================
#  BUILD ATTENDANCE REPORT (NEW in Phase 6)
# ============================================================
total_time = time.time() - session_start
today      = datetime.now().strftime("%Y-%m-%d_%H-%M")

print("\n" + "="*60)
print("  F.A.C.E - BUILDING ATTENDANCE REPORT")
print("="*60)

rows = []

# Add all recognized students
for name in active_time:
    engagement = (active_time[name] / total_time * 100) if total_time > 0 else 0
    status     = "Present" if attendance_marked.get(name, False) else "Absent"
    rows.append({
        "Name"          : name,
        "Status"        : status,
        "Time Marked"   : attendance_time.get(name, "—"),
        "Active Time(s)": round(active_time[name], 1),
        "Engagement(%)" : round(engagement, 1),
        "Drowsy Events" : drowsy_events[name],
    })

# ── CREATE DATAFRAME ─────────────────────────────────────
if rows:
    df = pd.DataFrame(rows, columns=[
        "Name", "Status", "Time Marked",
        "Active Time(s)", "Engagement(%)", "Drowsy Events"
    ])

    # ── SAVE CSV ─────────────────────────────────────────
    csv_filename = f"attendance_{today}.csv"
    df.to_csv(csv_filename, index=False)

    # Print the table to terminal
    print(df.to_string(index=False))
    print(f"\n[SAVED] Report saved as: {csv_filename}")
    print(f"[INFO]  Open it in Excel or Google Sheets!")

else:
    print("  No students were recognised this session.")

print(f"\n  Total session time : {total_time:.1f} seconds")
print("="*60)
print("[INFO] Session complete.")