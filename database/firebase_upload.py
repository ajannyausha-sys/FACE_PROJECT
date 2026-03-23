# pyre-ignore-all-errors
# ============================================================
#  F.A.C.E — firebase_upload.py
#  Converts from: upload_attendance.py
#  Purpose: Upload attendance results to Firebase Firestore
#           in the exact format the React frontend expects
# ============================================================

import firebase_admin # type: ignore
from firebase_admin import credentials, firestore # type: ignore
from datetime import datetime

_db = None


def init_firebase():
    """Initialize Firebase connection"""
    global _db
    if not firebase_admin._apps:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    _db = firestore.client()
    print("[FIREBASE] Connected to Firestore.")


def upload_attendance(attendance_results):
    """
    Upload attendance to Firestore.

    attendance_results = list of dicts:
    {
      "name": "Ajannya",
      "status": "Present",
      "timeMarked": "09:15:00",
      "activeTime": 12.5,
      "engagement": 75.3,
      "drowsyEvents": 1
    }
    """
    if _db is None:
        init_firebase()
    
    if _db is None:
        print("[FIREBASE ERROR] Could not initialize database.")
        return

    today = datetime.now().strftime("%Y-%m-%d")
    batch = _db.batch()

    for record in attendance_results:
        name    = record["name"]
        doc_ref = _db.collection("attendance").document(today)\
                     .collection("students").document(name)
        batch.set(doc_ref, {
            "name":         name,
            "status":       record["status"],
            "timeMarked":   record.get("timeMarked", "—"),
            "activeTime":   record.get("activeTime", 0),
            "engagement":   record.get("engagement", 0),
            "drowsyEvents": record.get("drowsyEvents", 0),
            "date":         today
        })
        print(f"[FIREBASE] Queued: {name} -> {record['status']}")

    batch.commit()
    print(f"[FIREBASE] All attendance uploaded for {today}!")