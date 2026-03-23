# pyre-ignore-all-errors
# ============================================================
#  F.A.C.E — drowsiness_engine.py
#  Converts from: drowsiness_test_FR4, FR5, FR6, FR7
#  Purpose: EAR calculation + drowsiness detection
# ============================================================

import numpy as np # type: ignore
from scipy.spatial import distance as dist # type: ignore

EAR_THRESHOLD = 0.21   # Lowered from 0.25 to reduce false positives
CONSEC_FRAMES = 8      # Increased from 4 for more stability at 3 FPS (~2.5s)


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

    def init_person(self, name):
        if name not in self.frame_counter:
            self.frame_counter[name] = 0
            self.drowsy_events[name] = 0
            self.is_drowsy[name]     = False

    def update(self, name, landmarks):
        """Update drowsiness state for a person. Returns (avg_EAR, is_drowsy)"""
        self.init_person(name)

        left_eye  = get_eye_points(landmarks, 36, 42)
        right_eye = get_eye_points(landmarks, 42, 48)
        avg_EAR   = (calculate_EAR(left_eye) + calculate_EAR(right_eye)) / 2.0

        if avg_EAR < EAR_THRESHOLD:
            self.frame_counter[name] += 1
        else:
            if self.is_drowsy[name]:
                self.is_drowsy[name] = False
            self.frame_counter[name] = 0

        if self.frame_counter[name] >= CONSEC_FRAMES and not self.is_drowsy[name]:
            self.drowsy_events[name] += 1
            self.is_drowsy[name] = True
            print(f"[DROWSY] {name} - drowsy event #{self.drowsy_events[name]}")

        return float(f"{avg_EAR:.3f}"), self.is_drowsy[name]

    def get_events(self, name):
        return self.drowsy_events.get(name, 0)