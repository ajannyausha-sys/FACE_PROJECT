# ============================================================
#  F.A.C.E — main.py
#  Purpose: FastAPI backend — connects React frontend to AI engine
#  Run: python main.py (runs on port 5000)
# ============================================================

import time
import pandas as pd
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import numpy as np
import cv2

from database.firebase_upload import init_firebase, upload_attendance
from engine.ai_engine import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[MAIN] Starting F.A.C.E backend...")
    init_firebase()
    print("[MAIN] Backend API ready on port 5000.")
    yield
    print("[MAIN] Shutting down backend.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # Allow local frontend ports
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FrameData(BaseModel):
    image: str

@app.get("/")
def root():
    return {"message": "F.A.C.E Backend API is running on Port 5000!"}

@app.get("/api/status")
def get_status():
    if not engine.is_running:
        return {"running": False, "totalTime": 0, "studentCount": 0}
        
    total_time = float(time.time() - engine.session_start)
    # student count (excluding UNKNOWN)
    count = sum(1 for n in engine.active_time if n != "UNKNOWN")
    return {
        "running": engine.is_running,
        "totalTime": float(round(total_time, 1)),
        "studentCount": count
    }

@app.post("/api/start-session")
def start_session():
    if engine.is_running:
        return {"success": False, "message": "Session already running"}
    engine.start_session()
    return {"success": True, "message": "Session started"}

@app.post("/api/recognize")
def recognize_frame(data: FrameData):
    if not engine.is_running:
        return {"faces": [], "faceCount": 0, "timestamp": datetime.now().isoformat()}
        
    try:
        # Decode base64 string to numpy array (image)
        b64 = data.image
        if b64.startswith("data:image"):
            b64 = b64.split(",")[1]
            
        img_data = base64.b64decode(b64)
        np_arr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"faces": [], "faceCount": 0, "timestamp": datetime.now().isoformat()}
            
        results = engine.process_frame(frame)
        return results
    except Exception as e:
        print(f"[MAIN ERROR] Processing frame: {e}")
        return {"faces": [], "faceCount": 0, "timestamp": datetime.now().isoformat()}

@app.get("/api/attendance")
def get_attendance():
    att = engine.get_attendance()
    total_time = float(time.time() - engine.session_start if engine.is_running else 0.0)
    return {
        "attendance": att,
        "totalTime": float(round(total_time, 1))
    }

@app.post("/api/end-session")
def end_session_api():
    if not engine.is_running:
        return {"success": False, "message": "No session running"}
        
    results, total_time = engine.end_session()
    
    csv_file = ""
    if results:
        today = datetime.now().strftime("%Y-%m-%d_%H-%M")
        df = pd.DataFrame(results)
        csv_file = f"attendance_{today}.csv"
        df.to_csv(csv_file, index=False)
        print(f"[MAIN] CSV saved: {csv_file}")
        
        try:
            upload_attendance(results)
        except Exception as e:
            print(f"[MAIN ERROR] Firebase Upload: {e}")
            
    return {
        "success": True,
        "attendance": results,
        "csvFile": csv_file,
        "message": "Session ended successfully."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)