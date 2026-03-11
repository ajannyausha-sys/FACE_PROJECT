# ============================================================
#  F.A.C.E — Phase 4  |  FR-5: Eye Aspect Ratio (EAR)
#  File: drowsiness_test.py  (replace your FR-4 version)
#  Goal: Calculate EAR value and display it live on screen
#  NO sleep alert yet. Just the number.
# ============================================================

import cv2
import dlib
import numpy as np
from scipy.spatial import distance as dist

# ── EAR Formula ─────────────────────────────────────────────
#
#       p2      p3
#   p1              p4
#       p6      p5
#
#  EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
#
#  Open eye  → EAR ≈ 0.30
#  Half open → EAR ≈ 0.20
#  Closed    → EAR ≈ 0.10
#
def calculate_EAR(eye_points):
    # eye_points = list of 6 (x, y) tuples
    # Vertical distances
    A = dist.euclidean(eye_points[1], eye_points[5])
    B = dist.euclidean(eye_points[2], eye_points[4])
    # Horizontal distance
    C = dist.euclidean(eye_points[0], eye_points[3])
    ear = (A + B) / (2.0 * C)
    return round(ear, 3)

def get_eye_points(landmarks, start, end):
    """Extract (x, y) coords for landmark range."""
    return [(landmarks.part(i).x, landmarks.part(i).y)
            for i in range(start, end)]

# ── Load tools ──────────────────────────────────────────────
detector  = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

cap = cv2.VideoCapture(0)
print("[INFO] FR-5 running. Watch the EAR value. Press ESC to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)

    for face in faces:

        landmarks = predictor(gray, face)

        # Extract eye points
        left_eye  = get_eye_points(landmarks, 36, 42)  # points 36–41
        right_eye = get_eye_points(landmarks, 42, 48)  # points 42–47

        # Calculate EAR for each eye
        left_EAR  = calculate_EAR(left_eye)
        right_EAR = calculate_EAR(right_eye)

        # Average both eyes → one EAR value
        avg_EAR = round((left_EAR + right_EAR) / 2.0, 3)

        # Draw eye outlines (connecting the 6 dots per eye)
        for eye in [left_eye, right_eye]:
            pts = np.array(eye, dtype=np.int32)
            cv2.polylines(frame, [pts], isClosed=True,
                          color=(0, 255, 255), thickness=1)

        # Draw all 68 landmark dots (small, gray)
        for i in range(68):
            x = landmarks.part(i).x
            y = landmarks.part(i).y
            cv2.circle(frame, (x, y), 1, (100, 100, 100), -1)

        # Show EAR values on screen
        cv2.putText(frame, f"L-EAR: {left_EAR}", (10, 90),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 200, 255), 2)
        cv2.putText(frame, f"R-EAR: {right_EAR}", (10, 120),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 200, 255), 2)
        cv2.putText(frame, f"AVG EAR: {avg_EAR}", (10, 155),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.85,
                    (0, 255, 100) if avg_EAR > 0.25 else (0, 0, 255), 2)

    cv2.putText(frame, f"Faces: {len(faces)} | FR-5: EAR Live", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1)

    cv2.imshow("F.A.C.E — EAR", frame)
    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()