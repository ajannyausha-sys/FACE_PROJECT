import AttendancePanel from "./AttendancePanel";

function StudentDashboard({ user, students, attendanceMap, onLogout }) {
  const myStudentRecord =
    students.find((student) => student.id === user.id) ||
    (user.rollNo
      ? students.find((student) => student.rollNo.toLowerCase() === user.rollNo.toLowerCase())
      : null);

  if (!myStudentRecord) {
    return (
      <div className="app-shell">
        <header className="page-header">
          <div>
            <h1>Student Dashboard</h1>
            <p>Welcome, {user.name}.</p>
          </div>
          <button className="secondary-btn" onClick={onLogout}>
            Logout
          </button>
        </header>

        <section className="card">
          <p>Your student profile is not registered by a teacher yet.</p>
          {user.rollNo ? (
            <p>Ask your teacher to create your record with roll number {user.rollNo}.</p>
          ) : (
            <p>Ask your teacher to add your roll number in your student account.</p>
          )}
        </section>
      </div>
    );
  }

  const myEntry = attendanceMap.get(myStudentRecord.id);

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <h1>Student Dashboard</h1>
          <p>Welcome, {user.name}. You can only view your attendance.</p>
        </div>
        <button className="secondary-btn" onClick={onLogout}>
          Logout
        </button>
      </header>

      <main className="grid">
        <section className="card">
          <h2>My Status</h2>
          <p>
            <strong>Name:</strong> {myStudentRecord.name}
          </p>
          <p>
            <strong>Roll:</strong> {myStudentRecord.rollNo}
          </p>
          <p>
            <strong>Today:</strong> {myEntry ? "Present" : "Absent"}
          </p>
          <p>
            <strong>Marked at:</strong> {myEntry?.time ?? "-"}
          </p>
        </section>

        <section className="card full-width">
          <h2>My Attendance Record</h2>
          <AttendancePanel students={[myStudentRecord]} attendanceMap={attendanceMap} />
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
