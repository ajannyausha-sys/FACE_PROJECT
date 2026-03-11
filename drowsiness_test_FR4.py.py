# ============================================================
#  F.A.C.E — Phase 4  |  FR-4: Facial Landmarks (The Dots)
#  File: drowsiness_test.py
#  Goal: Turn on camera → detect face → draw 68 magic dots
#  NO EAR yet. NO sleep logic yet. Just dots.
# ============================================================

import cv2
import dlib
import numpy as np

# ── STEP 1: Load tools ──────────────────────────────────────
# Face detector (same one you used in Phase 2/3)
detector = dlib.get_frontal_face_detector()

# Landmark predictor — this finds the 68 dots
# Make sure this .dat file is in the SAME folder as this script
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

# ── STEP 2: Open camera ─────────────────────────────────────
cap = cv2.VideoCapture(0)
print("[INFO] Camera started. Press ESC to quit.")

# ── STEP 3: Main loop ───────────────────────────────────────
while True:
    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Camera not found.")
        break

    # Convert to grayscale — detector works on gray images
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect all faces in the frame
    faces = detector(gray)

    for face in faces:

        # Draw a rectangle around the face (green)
        x1, y1 = face.left(), face.top()
        x2, y2 = face.right(), face.bottom()
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # Get the 68 landmark points for this face
        landmarks = predictor(gray, face)

        # Draw ALL 68 dots as small cyan circles
        for i in range(68):
            x = landmarks.part(i).x
            y = landmarks.part(i).y
            cv2.circle(frame, (x, y), 2, (0, 255, 255), -1)

        # ── Highlight the EYE dots specially ────────────────
        # Left eye  → points 36 to 41
        # Right eye → points 42 to 47
        for i in range(36, 48):
            x = landmarks.part(i).x
            y = landmarks.part(i).y
            # Draw eye dots bigger and in a different color (orange)
            cv2.circle(frame, (x, y), 3, (0, 140, 255), -1)

        # Show the dot index numbers for the eyes (useful for learning)
        for i in range(36, 48):
            x = landmarks.part(i).x
            y = landmarks.part(i).y
            cv2.putText(frame, str(i), (x - 8, y - 5),
                        cv2.FONT_HERSHEY_PLAIN, 0.7, (255, 255, 255), 1)

    # Info overlay
    cv2.putText(frame, f"Faces detected: {len(faces)}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(frame, "FR-4: Landmark Dots | ESC = Quit", (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)

    cv2.imshow("F.A.C.E — Landmarks", frame)
    if cv2.waitKey(1) == 27:  # ESC key
        break

cap.release()
cv2.destroyAllWindows()
print("[INFO] Done.")