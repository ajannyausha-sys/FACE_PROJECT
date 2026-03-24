# pyre-ignore-all-errors
# ============================================================
#  F.A.C.E — drowsiness_engine.py
#  Converts from: drowsiness_test_FR4, FR5, FR6, FR7
#  Purpose: EAR calculation + drowsiness detection
# ============================================================

import numpy as np # type: ignore
from scipy.spatial import distance as dist # type: ignore

EAR_THRESHOLD = 0.25   # Eyes closed: < 0.25, Eyes open: > 0.30
CONSEC_FRAMES = 5      # Frames below threshold to trigger drowsiness (~1.6 seconds at 3 FPS)


def calculate_EAR(eye_pts):
    """Eye Aspect Ratio — measures how open/closed the eye is"""
    A = dist.euclidean(eye_pts[1], eye_pts[5])
    B = dist.euclidean(eye_pts[2], eye_pts[4])
    C = dist.euclidean(eye_pts[0], eye_pts[3])
    return (A + B) / (2.0 * C)


def get_eye_points(landmarks, start, end):
    """Extract (x, y) points from dlib landmarks"""
    return [(landmarks.part(i).x, landmarks.part(i).y)
            for i in range(start, end)]


class DrowsinessTracker:
    """Tracks drowsiness state per person"""

    def __init__(self):
        self.frame_counter = {}   # consecutive low-EAR frames
        self.drowsy_events = {}   # total drowsy events
        self.is_drowsy     = {}   # current state
        self.ear_history   = {}   # rolling EAR values for smoothing

    def init_person(self, name):
        if name not in self.frame_counter:
            self.frame_counter[name] = 0
            self.drowsy_events[name] = 0
            self.is_drowsy[name]     = False
            self.ear_history[name]   = []

    def update(self, name, landmarks):
        """Update drowsiness state for a person. Returns (avg_EAR, is_drowsy)"""
        self.init_person(name)

        try:
            left_eye  = get_eye_points(landmarks, 36, 42)
            right_eye = get_eye_points(landmarks, 42, 48)
            avg_EAR   = (calculate_EAR(left_eye) + calculate_EAR(right_eye)) / 2.0
        except Exception as e:
            print(f"[DROWSY ERROR] Failed to calculate EAR for {name}: {e}")
            return 0.0, False

        # Maintain rolling average for smoothing
        self.ear_history[name].append(avg_EAR)
        if len(self.ear_history[name]) > 5:  # Keep last 5 frames
            self.ear_history[name].pop(0)
        
        # Use smoothed EAR
        smoothed_EAR = np.mean(self.ear_history[name])

        if smoothed_EAR < EAR_THRESHOLD:
            self.frame_counter[name] += 1
        else:
            if self.is_drowsy[name]:
                self.is_drowsy[name] = False
                print(f"[ALERT] {name} woke up! (EAR={avg_EAR:.2f})")
            self.frame_counter[name] = 0

        if self.frame_counter[name] >= CONSEC_FRAMES and not self.is_drowsy[name]:
            self.drowsy_events[name] += 1
            self.is_drowsy[name] = True
            print(f"[DROWSY] {name} - DROWSY EVENT #{self.drowsy_events[name]} (EAR={avg_EAR:.2f})")

        return float(f"{avg_EAR:.3f}"), self.is_drowsy[name]

    def get_events(self, name):
        return self.drowsy_events.get(name, 0)