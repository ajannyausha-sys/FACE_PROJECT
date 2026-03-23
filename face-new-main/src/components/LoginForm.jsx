import { useState } from "react";

function LoginForm({ onLogin, onSignup, firebaseReady }) {
  const [mode, setMode] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetMessages = () => {
    setError("");
    setMessage("");
  };

  const switchToLogin = () => {
    setMode("login");
    resetMessages();
  };

  const switchToSignup = () => {
    setMode("signup");
    resetMessages();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await onLogin({ email, password });
      if (!result.ok) {
        setError(result.message);
        setMessage("");
        return;
      }

      setError("");
      setMessage(result.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await onSignup({ firstName, lastName, email, password, role });
      if (!result.ok) {
        setError(result.message);
        setMessage("");
        return;
      }

      setError("");
      setMessage(result.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-layout">
        <aside className="auth-visual">
          <p className="kicker">F . A . C . E</p>
          <h1>Mark Attendance Through Face Detection</h1>
          <p>Secure access for teachers and students with a premium workflow.</p>
          <button type="button" className="ghost-cta">
            Explore Platform
          </button>
        </aside>

        <section className="auth-card">
          {!firebaseReady && (
            <p className="error-text">Firebase config missing. Add VITE_FIREBASE_* in .env.</p>
          )}

          {mode === "signup" ? (
            <>
              <h2>Create Your Account</h2>
              <p className="muted">Fill your details to create a new account.</p>

              <form className="stack" onSubmit={handleSignup}>
                <div className="social-row">
                  <label className="field half-field">
                    <span>First Name</span>
                    <input
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      type="text"
                      placeholder="First name"
                      required
                    />
                  </label>

                  <label className="field half-field">
                    <span>Last Name</span>
                    <input
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      type="text"
                      placeholder="Last name"
                      required
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="Email address"
                    required
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    placeholder="Password"
                    required
                  />
                </label>

                <label className="field">
                  <span>Role</span>
                  <select value={role} onChange={(event) => setRole(event.target.value)}>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </label>

                {error && <p className="error-text">{error}</p>}
                {message && <p className="success-text">{message}</p>}

                <button type="submit" className="primary-wide" disabled={submitting}>
                  {submitting ? "Signing Up..." : "Sign Up"}
                </button>
              </form>

              <p className="auth-switch">
                Already have an account?{" "}
                <button type="button" className="inline-link" onClick={switchToLogin}>
                  Login
                </button>
              </p>
            </>
          ) : (
            <>
              <h2>Sign In To Continue</h2>
              <p className="muted">Enter your email and password.</p>

              <form className="stack" onSubmit={handleLogin}>
                <label className="field">
                  <span>Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="Enter email"
                    required
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    placeholder="Enter password"
                    required
                  />
                </label>

                {error && <p className="error-text">{error}</p>}
                {message && <p className="success-text">{message}</p>}

                <button type="submit" className="primary-wide" disabled={submitting}>
                  {submitting ? "Logging In..." : "Login"}
                </button>
              </form>

              <p className="auth-switch">
                Don&apos;t have an account?{" "}
                <button type="button" className="inline-link" onClick={switchToSignup}>
                  Sign Up
                </button>
              </p>
            </>
          )}
        </section>
      </section>
    </div>
  );
}

export default LoginForm;
