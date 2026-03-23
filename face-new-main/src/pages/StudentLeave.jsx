import { useMemo, useState } from "react";
import { useAppState } from "../context/AppStateContext";

const SUBJECTS_STORAGE_KEY = "face-attendance-subjects";

const loadJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export default function StudentLeave() {
  const { currentUser, addNotification } = useAppState();
  const [subjectId, setSubjectId] = useState("");
  const [reason, setReason] = useState("");
  const [hours, setHours] = useState("");
  const [message, setMessage] = useState("");

  const subjects = loadJson(SUBJECTS_STORAGE_KEY, []);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === subjectId) ?? null,
    [subjects, subjectId]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedReason = reason.trim();
    const numericHours = Number(hours);

    if (!subjectId || !trimmedReason || !numericHours || numericHours <= 0) {
      setMessage("Please fill subject, reason, and valid hours.");
      return;
    }

    if (!selectedSubject?.teacherId) {
      setMessage("Selected subject does not have an assigned teacher.");
      return;
    }

    addNotification({
      targetRole: "teacher",
      targetUserId: selectedSubject.teacherId,
      type: "duty_leave_request",
      status: "pending",
      message:
        `Duty leave request from ${currentUser?.name}: ` +
        `${selectedSubject.subjectName} (${selectedSubject.subjectCode}), ` +
        `Hours: ${numericHours}, Reason: ${trimmedReason}`,
      meta: {
        studentId: currentUser?.id,
        studentName: currentUser?.name,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.subjectName,
        subjectCode: selectedSubject.subjectCode,
        requestedHours: numericHours,
        reason: trimmedReason
      }
    });

    setSubjectId("");
    setReason("");
    setHours("");
    setMessage("Request sent to corresponding teacher.");
  };

  return (
    <main className="manual-attendance-shell">
      <section className="card manual-attendance-card">
        <h2>Request Duty Leave</h2>

        <form className="stack manual-attendance-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Subject</span>
            <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
              <option value="">Choose a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectName} ({subject.subjectCode})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Reason</span>
            <input
              type="text"
              placeholder="Enter reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Number of Hours</span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 2"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
            />
          </label>

          {message && <p className="form-note">{message}</p>}
          <button type="submit">Send Request</button>
        </form>
      </section>
    </main>
  );
}
