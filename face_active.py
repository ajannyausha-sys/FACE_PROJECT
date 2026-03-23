# pyre-ignore-all-errors
# ============================================================
#  F.A.C.E — Phase 5
#  File: face_active.py
#  Goal: Recognition + EAR + Active Time Tracking
#  Combines: Phase 3 (recognition) + Phase 4 (EAR/drowsiness)
# ============================================================

import os
import cv2
import dlib
import numpy as np
import pickle
import time
from scipy.spatial import distance as dist

# ============================================================
#  SETTINGS
# ============================================================
DATASET_PATH   = "dataset"
ENCODINGS_FILE = "encodings.pkl"
THRESHOLD      = 0.6     # face match strictness
EAR_THRESHOLD  = 0.25    # below this = eye closed
CONSEC_FRAMES  = 20      # frames eye must stay closed → drowsy

# ============================================================
#  EAR FUNCTIONS (from Phase 4)
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

print("[INFO] Models loaded.")

# ============================================================
#  LOAD OR BUILD ENCODINGS
#  First run  → reads dataset → encodes → saves encodings.pkl
#  After that → loads encodings.pkl directly (fast startup)
# ============================================================
if os.path.exists(ENCODINGS_FILE):
    # Fast path: load saved encodings
    print("[INFO] Found encodings.pkl — loading saved encodings...")
    with open(ENCODINGS_FILE, "rb") as f:
        data = pickle.load(f)
    known_encodings = data["encodings"]
    known_names     = data["names"]
    print(f"[INFO] Loaded {len(known_names)} encodings instantly!")

else:
    # First run: encode from dataset
    print("[INFO] No encodings.pkl found — building from dataset...")
    known_encodings = []
    known_names     = []

    for person in os.listdir(DATASET_PATH):
        person_path = os.path.join(DATASET_PATH, person)
        if not os.path.isdir(person_path):
            continue

        for image_name in os.listdir(person_path):
            image_path = os.path.join(person_path, image_name)
            img = cv2.imread(image_path)

            if img is None:
                print(f"  Could not read: {image_path}")
                continue

            gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = detector(gray)

            if len(faces) == 0:
                print(f"  No face found in: {image_path}")
                continue

            face      = faces[0]
            landmarks = predictor(gray, face)
            encoding  = face_encoder.compute_face_descriptor(img, landmarks)

            known_encodings.append(np.array(encoding))
            known_names.append(person)
            print(f"  Encoded: {person} — {image_name}")

    known_encodings = np.array(known_encodings)

    # Save for next time
    with open(ENCODINGS_FILE, "wb") as f:
        pickle.dump({"encodings": known_encodings, "names": known_names}, f)

    print(f"[INFO] Saved encodings.pkl — {len(known_names)} faces stored.")

# ============================================================
#  SESSION STATE — Active Time Tracking
# ============================================================
active_time   = {}   # { "Arjun": 12.4  } seconds awake
drowsy_events = {}   # { "Arjun": 2     } alert count
frame_counter = {}   # { "Arjun": 0     } consecutive low-EAR frames
is_drowsy     = {}   # { "Arjun": False } drowsy flag
cached_identities = []
total_frame_count = 0

session_start = time.time()
prev_time     = time.time()

print("[INFO] Session started. Press ESC to quit and see summary.")

# ============================================================
#  OPEN CAMERA
# ============================================================
cap = cv2.VideoCapture(0)

# ============================================================
#  MAIN LOOP
# ============================================================
while True:
    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Camera not found.")
        break

    # Time delta — exact seconds since last frame
    now       = time.time()
    delta     = now - prev_time
    prev_time = now
    total_frame_count += 1

    gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Fast detection
    small_gray = cv2.resize(gray, (0, 0), fx=0.5, fy=0.5)
    faces = detector(small_gray)

    visible_names = []
    new_cached_identities = []

    for small_face in faces:
        x1, y1 = int(small_face.left() * 2), int(small_face.top() * 2)
        x2, y2 = int(small_face.right() * 2), int(small_face.bottom() * 2)
        face = dlib.rectangle(x1, y1, x2, y2)
        
        landmarks = predictor(gray, face)

        # RECOGNITION
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
                
        if not match_found or total_frame_count % 10 == 0:
            live_encoding = np.array(
                face_encoder.compute_face_descriptor(frame, landmarks)
            )

            if len(known_encodings) > 0:
                distances    = np.linalg.norm(known_encodings - live_encoding, axis=1)
                min_index    = np.argmin(distances)
                min_distance = distances[min_index]

                name       = known_names[min_index] if min_distance < THRESHOLD else "UNKNOWN"
                confidence = round((1 - min_distance) * 100, 1)

        new_cached_identities.append({
            "center": (center_x, center_y),
            "name": name,
            "confidence": confidence
        })

        # EAR CALCULATION
        left_eye  = get_eye_points(landmarks, 36, 42)
        right_eye = get_eye_points(landmarks, 42, 48)
        avg_EAR   = (calculate_EAR(left_eye) + calculate_EAR(right_eye)) / 2.0

        # INITIALISE DICTS FOR NEW PERSON
        if name != "UNKNOWN" and name not in active_time:
            active_time[name]   = 0.0
            drowsy_events[name] = 0
            frame_counter[name] = 0
            is_drowsy[name]     = False

        # ACTIVE TIME LOGIC
        if name != "UNKNOWN":
            visible_names.append(name)

            if avg_EAR >= EAR_THRESHOLD:
                active_time[name]   += delta
                frame_counter[name]  = 0
                if is_drowsy[name]:
                    is_drowsy[name] = False
            else:
                frame_counter[name] += 1

            if frame_counter.get(name, 0) >= CONSEC_FRAMES and not is_drowsy.get(name, False):
                drowsy_events[name] += 1
                is_drowsy[name]      = True

        # DRAW FACE BOX
        x1, y1, x2, y2 = face.left(), face.top(), face.right(), face.bottom()
        box_color = (0, 0, 255) if is_drowsy.get(name, False) else (0, 255, 0)
        cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)

        # DRAW LABELS
        session_secs = time.time() - session_start
        a_time       = active_time.get(name, 0)
        engagement   = round((a_time / session_secs) * 100, 1) if session_secs > 0 else 0

        label1 = f"{name}  {confidence}%"
        label2 = f"EAR:{avg_EAR:.2f}  Active:{a_time:.0f}s  Eng:{engagement}%"
        label3 = "DROWSY!" if is_drowsy.get(name, False) else "Awake"

        cv2.putText(frame, label1, (x1, y1 - 38),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, box_color, 2)
        cv2.putText(frame, label2, (x1, y1 - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.48, (200, 200, 200), 1)
        cv2.putText(frame, label3, (x1, y1 - 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                    (0, 0, 255) if is_drowsy.get(name, False) else (0, 255, 150), 1)

        # Draw eye outlines
        for eye in [left_eye, right_eye]:
            pts     = np.array(eye, dtype=np.int32)
            eye_col = (0, 0, 255) if avg_EAR < EAR_THRESHOLD else (0, 255, 255)
            cv2.polylines(frame, [pts], isClosed=True, color=eye_col, thickness=1)

    cached_identities = new_cached_identities

    # SESSION INFO BAR
    session_secs = int(time.time() - session_start)
    cv2.putText(frame, f"Session: {session_secs}s  |  Faces: {len(faces)}  |  ESC=quit",
                (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (180, 180, 180), 1)

    # DROWSY OVERLAY
    any_drowsy = any(is_drowsy.get(n, False) for n in visible_names)
    if any_drowsy:
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (frame.shape[1], frame.shape[0]),
                      (0, 0, 160), -1)
        cv2.addWeighted(overlay, 0.2, frame, 0.8, 0, frame)
        cv2.putText(frame, "DROWSINESS DETECTED",
                    (50, frame.shape[0] // 2),
                    cv2.FONT_HERSHEY_DUPLEX, 1.0, (0, 0, 255), 2)

    cv2.imshow("F.A.C.E — Phase 5", frame)

    if cv2.waitKey(1) == 27:
        break

# ============================================================
#  END OF SESSION SUMMARY
# ============================================================
cap.release()
cv2.destroyAllWindows()

total_session = round(time.time() - session_start, 1)

print("\n" + "="*55)
print("  F.A.C.E — SESSION SUMMARY")
print("="*55)
print(f"  Total Session Time : {total_session} seconds")
print(f"  Students Detected  : {len(active_time)}")
print("-"*55)

for person in active_time:
    a    = round(active_time[person], 1)
    eng  = round((a / total_session) * 100, 1) if total_session > 0 else 0
    drws = drowsy_events[person]
    print(f"  {person:<20} Active: {a}s   Engagement: {eng}%   Drowsy Events: {drws}")

print("="*55)
print("[INFO] Phase 5 complete. Data ready for Phase 6 CSV export.")