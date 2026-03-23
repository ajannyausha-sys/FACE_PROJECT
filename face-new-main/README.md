# Face Attendance React Starter

## Run

1. Install dependencies:
   `npm.cmd install`
2. Copy env template:
   `Copy-Item .env.example .env`
3. Fill `.env` with your Firebase project values.
4. Start dev server:
   `npm.cmd run dev`

## Firebase Setup

1. Create a Firebase project.
2. Enable Authentication -> Sign-in method -> Email/Password.
3. Create a Firestore database.
4. In Project Settings -> General -> Your apps (Web), copy config values into `.env`.

Users are saved in Firestore collection `users` with role metadata.
Auth credentials are stored securely by Firebase Authentication.

## Role Routing

- Signup saves `firstName`, `lastName`, `email`, and `role`.
- Login uses Firebase email/password.
- After login, app reads role from Firestore and routes to Teacher or Student dashboard.

## Face Models

Download face-api.js model files and place them in `public/models`:

- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1
- face_landmark_68_model-weights_manifest.json
- face_landmark_68_model-shard1
- face_recognition_model-weights_manifest.json
- face_recognition_model-shard1
- face_recognition_model-shard2

Then use the UI buttons: "Load Models" and "Start Camera".

Note: current matching is a demo fallback and marks the first unmarked student when any face is detected.
