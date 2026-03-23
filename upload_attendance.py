import pickle
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import pandas as pd
import glob
import os

# Connect to Firebase
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Find the latest CSV file
csv_files = glob.glob("attendance_*.csv")
latest_csv = max(csv_files, key=os.path.getctime)
print(f"[INFO] Uploading: {latest_csv}")

# Read CSV
df = pd.read_csv(latest_csv)

# Upload each row to Firestore
today = datetime.now().strftime("%Y-%m-%d")
for _, row in df.iterrows():
    doc_ref = db.collection("attendance").document(today)\
                .collection("students").document(row["Name"])
    doc_ref.set({
        "name": row["Name"],
        "status": row["Status"],
        "timeMarked": row["Time Marked"],
        "activeTime": row["Active Time(s)"],
        "engagement": row["Engagement(%)"],
        "drowsyEvents": row["Drowsy Events"],
        "date": today
    })
    print(f"[UPLOADED] {row['Name']} → {row['Status']}")

print("[DONE] Attendance uploaded to Firebase!")