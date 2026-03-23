# ============================================================
#  F.A.C.E — face_encoder.py
#  Converts from: encode_faces.py + encode_faces_v2.py
#  Purpose: Build face encodings from dataset folder
# ============================================================

import os
import cv2
import dlib
import numpy as np
import pickle

DATASET_PATH   = "dataset"
ENCODINGS_FILE = "encodings.pkl"

detector     = dlib.get_frontal_face_detector()
predictor    = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
face_encoder = dlib.face_recognition_model_v1("dlib_face_recognition_resnet_model_v1.dat")


def build_encodings():
    """Scan dataset folder, encode all faces, save to encodings.pkl"""
    print("[ENCODER] Building encodings from dataset...")
    known_encodings = []
    known_names = []

    if not os.path.exists(DATASET_PATH):
        print(f"[ENCODER] ERROR: dataset folder not found at '{DATASET_PATH}'")
        return False

    for person in os.listdir(DATASET_PATH):
        person_path = os.path.join(DATASET_PATH, person)
        if not os.path.isdir(person_path):
            continue

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
            print(f"  [ENCODER] Encoded: {person} — {image_name}")

    if not known_encodings:
        print("[ENCODER] No faces found in dataset!")
        return False

    known_encodings = np.array(known_encodings)
    with open(ENCODINGS_FILE, "wb") as f:
        pickle.dump({"encodings": known_encodings, "names": known_names}, f)

    print(f"[ENCODER] Saved {len(known_names)} encodings to {ENCODINGS_FILE}")
    return True


def load_encodings():
    """Load encodings from pkl file. Build fresh if not found."""
    if os.path.exists(ENCODINGS_FILE):
        print("[ENCODER] Loading saved encodings...")
        with open(ENCODINGS_FILE, "rb") as f:
            data = pickle.load(f)
        print(f"[ENCODER] Loaded {len(data['names'])} encodings.")
        return data["encodings"], data["names"]
    else:
        print("[ENCODER] No encodings file found. Building fresh...")
        build_encodings()
        return load_encodings()