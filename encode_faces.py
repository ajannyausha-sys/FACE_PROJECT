import os
import cv2
import dlib

# Load face detector
detector = dlib.get_frontal_face_detector()

# Load face recognition model (encoder)
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
face_encoder = dlib.face_recognition_model_v1("dlib_face_recognition_resnet_model_v1.dat")

DATASET_PATH = "dataset"

people = os.listdir(DATASET_PATH)

print("People found:", people)

for person in people:
    person_path = os.path.join(DATASET_PATH, person)
    
    images = os.listdir(person_path)
    
    print(f"{person} has images:", images)

    # IMPORTANT → inside the person loop
    for image_name in images:
        image_path = os.path.join(person_path, image_name)
        
        print("Loading:", image_path)
        
        img = cv2.imread(image_path)

        if img is None:
            print("Failed to load image")
        else:
            print("Image loaded successfully")