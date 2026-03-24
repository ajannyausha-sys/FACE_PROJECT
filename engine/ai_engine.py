# pyre-ignore-all-errors
# ============================================================
#  F.A.C.E — ai_engine.py
#  Rewrite for React API frontend
#  Purpose: Main AI logic — recognition + drowsiness + attendance
# ============================================================

import cv2 # type: ignore
import dlib # type: ignore
import numpy as np # type: ignore
import time
from datetime import datetime
from engine.face_encoder import load_encodings # type: ignore
from engine.drowsiness_engine import DrowsinessTracker # type: ignore
from camera_box import validate_frame # type: ignore

def get_iou(box1, box2):
    """Calculate Intersection over Union (IoU) of two rectangles"""
    x_i1, y_i1 = max(box1.left(), box2.left()), max(box1.top(), box2.top())
    x_i2, y_i2 = min(box1.right(), box2.right()), min(box1.bottom(), box2.bottom())
    
    inter_area = max(0, x_i2 - x_i1) * max(0, y_i2 - y_i1)
    box1_area = (box1.right() - box1.left()) * (box1.bottom() - box1.top())
    box2_area = (box2.right() - box2.left()) * (box2.bottom() - box2.top())
    
    union_area = box1_area + box2_area - inter_area
    return inter_area / union_area if union_area > 0 else 0

THRESHOLD       = 0.45   # Tightened Face match strictness for better accuracy
PRESENT_SECONDS = 3.0    # Seconds visible before marked Present

class AIEngine:
    def __init__(self):
        print("[AI ENGINE] Loading models and encodings...")
        self.known_encodings, self.known_names = load_encodings()
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
        self.face_encoder = dlib.face_recognition_model_v1("dlib_face_recognition_resnet_model_v1.dat")
        
        self.is_running = False
        self.drowsiness = None
        
        self.session_start: float = 0.0
        self.active_time = {}
        self.recognition_time = {}
        self.attendance_marked = {}
        self.attendance_time = {}
        self.last_frame_time: float = 0.0
        self.cached_identities = []
        self.frame_count = 0
        print("[AI ENGINE] Ready.")
        
    def start_session(self):
        self.is_running = True
        self.session_start = time.time()
        self.last_frame_time = time.time()
        self.active_time = {}
        self.recognition_time = {}
        self.attendance_marked = {}
        self.attendance_time = {}
        self.drowsiness = DrowsinessTracker()
        self.cached_identities = []
        self.frame_count = 0
        print("[AI ENGINE] Session Started.")

    def end_session(self):
        self.is_running = False
        total_time = time.time() - self.session_start
        results = self.get_attendance()
        print(f"[AI ENGINE] Session ended. {len(results)} students tracked.")
        return results, total_time

    def process_frame(self, frame):
        if not self.is_running:
            return {"faces": [], "faceCount": 0, "timestamp": datetime.now().isoformat()}
            
        # 1. Camera Box Handling / Validation
        is_valid, msg = validate_frame(frame)
        if not is_valid:
            print(f"[AI ENGINE] Frame rejected: {msg}")
            return {
                "faces": [], 
                "faceCount": 0, 
                "timestamp": datetime.now().isoformat(),
                "error": msg
            }
        
        print(f"[AI ENGINE] Processing frame {self.frame_count}...")
            
        now = time.time()
        delta = now - self.last_frame_time
        # Fallback to generous 30fps assumption if delta is too huge or negative
        if delta > 1.0 or delta <= 0: delta = 1/30.0
        self.last_frame_time = now

        self.frame_count += 1

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Resize for much faster face detection
        small_gray = cv2.resize(gray, (0, 0), fx=0.5, fy=0.5)
        raw_faces = self.detector(small_gray)
        
        # 2. Filter overlapping boxes (Simple NMS)
        faces = []
        for rf in raw_faces:
            keep = True
            for f in faces:
                if get_iou(rf, f) > 0.5: # 50% overlap threshold
                    keep = False
                    break
            if keep:
                faces.append(rf)
        
        results = []
        new_cached_identities = []
        
        for small_face in faces:
            # Scale face bounding box back up
            x1, y1 = int(small_face.left() * 2), int(small_face.top() * 2)
            x2, y2 = int(small_face.right() * 2), int(small_face.bottom() * 2)
            face = dlib.rectangle(x1, y1, x2, y2)
            
            landmarks = self.predictor(gray, face)
            
            center_x = (x1 + x2) / 2
            center_y = (y1 + y2) / 2
            
            name = "UNKNOWN"
            confidence = 0.0
            
            # Check if we can reuse identity from previous frames (frame skip optimization)
            match_found = False
            for cached in self.cached_identities:
                cx, cy = cached['center']
                # If the face center moved less than 50 pixels, assume it's the same person
                if abs(center_x - cx) < 50 and abs(center_y - cy) < 50:
                    name = cached['name']
                    confidence = cached['confidence']
                    match_found = True
                    break
                    
            # Run heavy recognition only every 10 frames or if it's a new face
            if not match_found or self.frame_count % 10 == 0:
                # Recognition
                live_encoding = np.array(self.face_encoder.compute_face_descriptor(frame, landmarks))
                if len(self.known_encodings) > 0:
                    distances = np.linalg.norm(self.known_encodings - live_encoding, axis=1)
                    min_index = np.argmin(distances)
                    min_distance = distances[min_index]
                    if min_distance < THRESHOLD:
                        name = self.known_names[min_index]
                    confidence = float(f"{(1 - min_distance) * 100:.2f}")
                    
            new_cached_identities.append({
                "center": (center_x, center_y),
                "name": name,
                "confidence": confidence
            })
                
            # Init state for new person (even UNKNOWN)
            if name not in self.active_time:
                self.active_time[name] = 0.0
                self.recognition_time[name] = 0.0
                self.attendance_marked[name] = False
                self.attendance_time[name] = "" # Initialize with empty string instead of None
                
            # Drowsiness (process everyone, including UNKNOWN)
            avg_EAR = 0.0
            is_drowsy = False
            if self.drowsiness:
                try:
                    avg_EAR, is_drowsy = self.drowsiness.update(name, landmarks)
                    if is_drowsy:
                        print(f"[AI ENGINE] {name} is DROWSY! EAR={avg_EAR:.2f}")
                except Exception as e:
                    print(f"[AI ENGINE ERROR] Drowsiness calculation failed for {name}: {e}")
            
            # Active time and Attendance logging
            # Count as "active" when eyes are sufficiently open (EAR > 0.22)
            if avg_EAR >= 0.22:
                self.active_time[name] += delta
                
            self.recognition_time[name] += delta
            
            if name != "UNKNOWN":
                if self.recognition_time[name] >= PRESENT_SECONDS and not self.attendance_marked[name]:
                    self.attendance_marked[name] = True
                    self.attendance_time[name] = datetime.now().strftime("%H:%M:%S")
                    print(f"[PRESENT] {name} marked Present at {self.attendance_time[name]}")
                    
            x1, y1, x2, y2 = face.left(), face.top(), face.right(), face.bottom()
            
            session_duration = float(time.time() - self.session_start)
            session_duration = max(session_duration, 1.0)
            engagement = float((self.active_time[name] / session_duration) * 100)
            
            results.append({
                "name": name,
                "confidence": confidence,
                "ear": float(f"{avg_EAR:.2f}"),
                "isDrowsy": is_drowsy,
                "activeTime": float(f"{float(self.active_time[name]):.1f}"),
                "engagement": float(f"{float(engagement):.1f}"),
                "drowsyEvents": self.drowsiness.get_events(name) if (self.drowsiness and hasattr(self.drowsiness, 'get_events')) else 0,
                "status": "Present" if self.attendance_marked.get(name) else ("UNKNOWN" if name == "UNKNOWN" else "Absent"),
                "box": {"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1}
            })
            
        self.cached_identities = new_cached_identities
            
        # Filter out UNKNOWN faces if requested (to reduce UI clutter)
        filtered_results = [f for f in results if f["name"] != "UNKNOWN"]
            
        return {
            "faces": filtered_results,
            "faceCount": len(filtered_results),
            "timestamp": datetime.now().isoformat()
        }
        
    def get_attendance(self):
        total_time = time.time() - self.session_start if self.is_running else 0
        results = []
        total_time = float(total_time if total_time > 0 else 1.0)
        for name in self.active_time:
            if name == "UNKNOWN":
                continue
            engagement = float((self.active_time[name] / total_time) * 100)
            results.append({
                "name": name,
                "status": "Present" if self.attendance_marked.get(name) else "Absent",
                "timeMarked": self.attendance_time.get(name) or "—",
                "activeTime": float(f"{self.active_time[name]:.1f}"),
                "engagement": float(f"{engagement:.1f}"),
                "drowsyEvents": self.drowsiness.get_events(name) if self.drowsiness else 0 # type: ignore
            })
        return results

# Expose singleton for the API
engine = AIEngine()