import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppState } from "../context/AppStateContext";

export default function Login() {
  const { login, isFirebaseConfigured } = useAppState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await login({ email, password });
      if (!result.ok) {
        setError(result.message);
        return;
      }

      navigate(result.role === "teacher" ? "/teacher/home" : "/student/home", { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-layout">
        <aside className="auth-visual">
          <p className="kicker">F . A . C . E</p>
          <h1>Welcome Back</h1>
          <p>Sign in with your existing account and continue.</p>
        </aside>

        <section className="auth-card">
          <h2>Login</h2>
          {!isFirebaseConfigured && (
            <p className="error-text">Firebase config missing. Add VITE_FIREBASE_* to .env.</p>
          )}

          <form className="stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label className="field">
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="primary-wide" disabled={submitting}>
              {submitting ? "Logging In..." : "Login"}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/">Sign Up</Link>
          </p>
        </section>
      </section>
    </div>
  );
}
