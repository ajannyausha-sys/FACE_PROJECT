import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppState } from "../context/AppStateContext";

export default function Signup() {
  const { signup, isFirebaseConfigured } = useAppState();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await signup({ firstName, lastName, email, password, role });
      if (!result.ok) {
        setError(result.message);
        return;
      }

      navigate(role === "teacher" ? "/teacher/home" : "/student/home", { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-layout">
        <aside className="auth-visual">
          <p className="kicker">F . A . C . E</p>
          <h1>Create Your Account</h1>
          <p>Join the attendance system as a teacher or student.</p>
        </aside>

        <section className="auth-card">
          <h2>Sign Up</h2>
          {!isFirebaseConfigured && (
            <p className="error-text">Firebase config missing. Add VITE_FIREBASE_* to .env.</p>
          )}

          <form className="stack" onSubmit={handleSubmit}>
            <div className="social-row">
              <label className="field half-field">
                <span>First Name</span>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </label>
              <label className="field half-field">
                <span>Last Name</span>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </label>
            </div>

            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label className="field">
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            <label className="field">
              <span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student" style={{backgroundColor: '#1a1a2e', color: '#00d4ff'}}>Student</option>
                <option value="teacher" style={{backgroundColor: '#1a1a2e', color: '#00d4ff'}}>Teacher</option>
              </select>
            </label>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="primary-wide" disabled={submitting}>
              {submitting ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </section>
      </section>
    </div>
  );
}
