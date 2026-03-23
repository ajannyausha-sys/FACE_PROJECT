import { useMemo } from "react";
import { useAppState } from "../context/AppStateContext";

const SUBJECTS_STORAGE_KEY = "face-attendance-subjects";
const SUBJECT_ATTENDANCE_STORAGE_KEY = "face-attendance-subject-attendance";

const loadJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export default function StudentAttendance() {
  const { currentUser, students } = useAppState();
  const subjects = loadJson(SUBJECTS_STORAGE_KEY, []);
  const subjectAttendance = loadJson(SUBJECT_ATTENDANCE_STORAGE_KEY, {});

  const myStudentRecord =
    students.find((student) => student.id === currentUser?.id) ||
    (currentUser?.rollNo
      ? students.find((student) => student.rollNo.toLowerCase() === currentUser.rollNo.toLowerCase())
      : null);

  const rows = useMemo(() => {
    if (!myStudentRecord) return [];

    return subjects.map((subject) => {
      const record = subjectAttendance?.[myStudentRecord.id]?.[subject.id] ?? null;
      const totalHours = Number(record?.totalHours ?? 0);
      const presentHours = Number(record?.presentHours ?? 0);
      const percentage = totalHours > 0 ? (presentHours / totalHours) * 100 : 0;

      return {
        id: subject.id,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        totalHours,
        presentHours,
        percentage: `${percentage.toFixed(2)}%`
      };
    });
  }, [myStudentRecord, subjects, subjectAttendance]);

  return (
    <main className="grid">
      <section className="card">
        <h2>My Attendance</h2>
        {!myStudentRecord ? (
          <p>Your profile is not linked to a student record yet.</p>
        ) : (
          <>
            <p>Name: {myStudentRecord.name}</p>
            <p>Roll: {myStudentRecord.rollNo}</p>
            <p>Subjects tracked: {subjects.length}</p>
          </>
        )}
      </section>

      {myStudentRecord && (
        <section className="card full-width">
          <h2>Attendance Across All Subjects</h2>
          {subjects.length === 0 ? (
            <p>No subjects found yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Subject Code</th>
                    <th>Total Hours</th>
                    <th>Present Hours</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.subjectName}</td>
                      <td>{row.subjectCode}</td>
                      <td>{row.totalHours}</td>
                      <td>{row.presentHours}</td>
                      <td>{row.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
