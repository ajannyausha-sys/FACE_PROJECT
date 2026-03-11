import os
import cv2
import dlib
import numpy as np


# ==========================================
# SETTINGS
# ==========================================
DATASET_PATH = "dataset"
THRESHOLD = 0.6   # smaller = stricter matching


# ==========================================
# LOAD AI MODELS
# ==========================================
print("Loading AI models...")

detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
face_encoder = dlib.face_recognition_model_v1("dlib_face_recognition_resnet_model_v1.dat")

print("Models loaded successfully!")


# ==========================================
# BUILD MEMORY FROM DATASET
# ==========================================
print("\nBuilding memory from dataset...")

known_encodings = []
known_names = []

people = os.listdir(DATASET_PATH)
print("People in dataset:", people)

for person in people:
    person_path = os.path.join(DATASET_PATH, person)
    images = os.listdir(person_path)

    for image_name in images:
        image_path = os.path.join(person_path, image_name)
        print("Reading:", image_path)

        img = cv2.imread(image_path)

        if img is None:
            print("❌ Image failed")
            continue

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = detector(gray)

        if len(faces) == 0:
            print("❌ No face found")
            continue

        # take first face
        face = faces[0]
        landmarks = predictor(gray, face)

        encoding = face_encoder.compute_face_descriptor(img, landmarks)

        known_encodings.append(np.array(encoding))
        known_names.append(person)

        print("✅ Encoding stored for:", person)

print("Memory size:", len(known_names))


# convert list → numpy array (important for math)
known_encodings = np.array(known_encodings)


# ==========================================
# LIVE RECOGNITION
# ==========================================
print("\nStarting live recognition...")

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()

    if not ret:
        print("Camera error")
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)

    for face in faces:
        # create encoding of live face
        landmarks = predictor(gray, face)
        live_encoding = face_encoder.compute_face_descriptor(frame, landmarks)
        live_encoding = np.array(live_encoding)

        if len(known_encodings) == 0:
            continue

        # compare with memory
        distances = np.linalg.norm(known_encodings - live_encoding, axis=1)

        min_index = np.argmin(distances)
        min_distance = distances[min_index]

        # ==========================================
        # DECISION MAKING
        # ==========================================
        if min_distance < THRESHOLD:
            name = known_names[min_index]
        else:
            name = "UNKNOWN"

        # ==========================================
        # CONFIDENCE CALCULATION
        # ==========================================
        confidence = round((1 - min_distance) * 100, 2)

        label = f"{name} {confidence}%"

        print("Detected:", label)

        # ==========================================
        # DRAW RESULT
        # ==========================================
        x1 = face.left()
        y1 = face.top()
        x2 = face.right()
        y2 = face.bottom()

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, label, (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    cv2.imshow("Recognition", frame)

    if cv2.waitKey(1) == 27:
        break


cap.release()
cv2.destroyAllWindows()