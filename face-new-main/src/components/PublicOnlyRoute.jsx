import { Navigate } from "react-router-dom";
import { useAppState } from "../context/AppStateContext";

export default function PublicOnlyRoute({ children }) {
  const { currentUser, authLoading } = useAppState();

  if (authLoading) {
    return (
      <div className="auth-shell">
        <section className="auth-layout">
          <aside className="auth-visual">
            <p className="kicker">F . A . C . E</p>
            <h1>Mark Attendance Through Face Detection</h1>
          </aside>
          <section className="auth-card">
            <h2>Loading</h2>
            <p className="muted">Checking session...</p>
          </section>
        </section>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to={currentUser.role === "teacher" ? "/teacher/home" : "/student/home"} replace />;
  }

  return children;
}
