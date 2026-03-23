import RegisterStudentForm from "./RegisterStudentForm";
import AttendancePanel from "./AttendancePanel";
import FaceDetectionCamera from "./FaceDetectionCamera";

function TeacherDashboard({ user, students, attendanceMap, onAddStudent, onMatch, onLogout }) {
  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <h1>Teacher Dashboard</h1>
          <p>Welcome, {user.name}. Manage students and mark attendance using face detection.</p>
        </div>
        <button className="secondary-btn" onClick={onLogout}>
          Logout
        </button>
      </header>

      <main className="grid">
        <section className="card">
          <h2>1) Register Students</h2>
          <RegisterStudentForm onAddStudent={onAddStudent} />
        </section>

        <section className="card">
          <h2>2) Face Detection Camera</h2>
          <FaceDetectionCamera students={students} onMatch={onMatch} attendanceMap={attendanceMap} />
        </section>

        <section className="card full-width">
          <h2>3) Attendance Log</h2>
          <AttendancePanel students={students} attendanceMap={attendanceMap} />
        </section>
      </main>
    </div>
  );
}

export default TeacherDashboard;
