import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Pages
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import TeacherHome from "./pages/TeacherHome";
import TeacherAttendance from "./pages/TeacherAttendance";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherManual from "./pages/TeacherManual";
import Dashboard from "./pages/Dashboard";
import StudentHome from "./pages/StudentHome";
import StudentAttendance from "./pages/StudentAttendance";
import StudentAbsence from "./pages/StudentAbsence";
import StudentLeave from "./pages/StudentLeave";

// Layouts & Components
import TeacherLayout from "./layouts/TeacherLayout";
import StudentLayout from "./layouts/StudentLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import { AppStateProvider } from "./context/AppStateContext";
import { auth, db, isFirebaseConfigured } from "./firebase";

// Storage Keys
const STUDENTS_STORAGE_KEY = "face-attendance-students";
const ATTENDANCE_STORAGE_KEY = "face-attendance-records";
const NOTIFICATIONS_STORAGE_KEY = "face-attendance-notifications";
const SUBJECT_ATTENDANCE_STORAGE_KEY = "face-attendance-subject-attendance";
const NOTIFICATIONS_RESET_VERSION_KEY = "face-attendance-notifications-reset-version";
const NOTIFICATIONS_RESET_VERSION = "2026-03-01-reset-1";

const loadJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const toPublicUser = (firebaseUser, profile) => ({
  id: firebaseUser.uid,
  email: firebaseUser.email,
  firstName: profile.firstName,
  lastName: profile.lastName,
  name: profile.name,
  role: profile.role,
  rollNo: profile.rollNo ?? null
});

function App() {
  const [students, setStudents] = useState(() => loadJson(STUDENTS_STORAGE_KEY, []));
  const [attendance, setAttendance] = useState(() => loadJson(ATTENDANCE_STORAGE_KEY, []));
  const [notifications, setNotifications] = useState(() => {
    const appliedVersion = localStorage.getItem(NOTIFICATIONS_RESET_VERSION_KEY);
    if (appliedVersion !== NOTIFICATIONS_RESET_VERSION) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(NOTIFICATIONS_RESET_VERSION_KEY, NOTIFICATIONS_RESET_VERSION);
      return [];
    }
    return loadJson(NOTIFICATIONS_STORAGE_KEY, []);
  });
  
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const attendanceMap = useMemo(() => {
    return new Map(attendance.map((entry) => [entry.studentId, entry]));
  }, [attendance]);

  // Auth State Observer
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, "users", firebaseUser.uid);
        const snapshot = await getDoc(profileRef);

        if (!snapshot.exists()) {
          await signOut(auth);
          setCurrentUser(null);
          setAuthLoading(false);
          return;
        }

        setCurrentUser(toPublicUser(firebaseUser, snapshot.data()));
      } catch (err) {
        console.error("Auth observer error:", err);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // FIXED SIGNUP FUNCTION
  const signup = async ({ firstName, lastName, email, password, role }) => {
    if (!isFirebaseConfigured) {
      return {
        ok: false,
        message: "Firebase is not configured. Add VITE_FIREBASE_* values in .env."
      };
    }

    try {
      // 1. Create the Auth User (WAIT for the result)
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      const normalizedEmail = email.trim().toLowerCase();
      const profile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: normalizedEmail,
        role,
        rollNo: null
      };

      // 2. Save Profile to Firestore
      await setDoc(doc(db, "users", result.user.uid), profile);

      // 3. Update local student list if applicable
      if (role === "student") {
        setStudents((prev) => {
          const exists = prev.some((student) => student.id === result.user.uid);
          if (exists) return prev;

          const next = [
            ...prev,
            {
              id: result.user.uid,
              name: profile.name,
              rollNo: `AUTO-${result.user.uid.slice(0, 6).toUpperCase()}`
            }
          ];
          localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      }

      return { ok: true, message: "Sign up successful.", role };
    } catch (error) {
      console.error("Signup process failed:", error);
      if (error.code === "auth/email-already-in-use") {
        return { ok: false, message: "An account with this email already exists." };
      }
      if (error.code === "auth/weak-password") {
        return { ok: false, message: "Password should be at least 6 characters." };
      }
      return { ok: false, message: "Unable to sign up right now. Try again." };
    }
  };

  const login = async ({ email, password }) => {
    if (!isFirebaseConfigured) {
      return {
        ok: false,
        message: "Firebase is not configured."
      };
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const snapshot = await getDoc(doc(db, "users", result.user.uid));

      if (!snapshot.exists()) {
        await signOut(auth);
        return { ok: false, message: "User profile missing. Please sign up again." };
      }

      return { ok: true, message: "Login successful.", role: snapshot.data().role };
    } catch (error) {
      return { ok: false, message: "Invalid email or password." };
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) await signOut(auth);
    setCurrentUser(null);
  };

  const addStudent = (student) => {
    const rollAlreadyUsed = students.some(
      (existing) => existing.rollNo.toLowerCase() === student.rollNo.toLowerCase()
    );

    if (rollAlreadyUsed) {
      return { ok: false, message: "Roll number already exists." };
    }

    const next = [...students, student];
    setStudents(next);
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(next));
    return { ok: true, message: "Student added." };
  };

  const addNotification = ({
    message,
    targetRole = null,
    targetUserId = null,
    type = "info",
    status = "new",
    meta = null
  }) => {
    setNotifications((prev) => {
      const next = [
        {
          id: crypto.randomUUID(),
          message,
          targetRole,
          targetUserId,
          type,
          status,
          meta,
          createdAt: new Date().toISOString()
        },
        ...prev
      ];
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resolveDutyLeaveRequest = ({ notificationId, decision, approvedHours = 0 }) => {
    let resolvedRequest = null;

    setNotifications((prev) => {
      const next = prev.map((item) => {
        if (item.id !== notificationId || item.status !== "pending") return item;

        resolvedRequest = item;
        return {
          ...item,
          status: decision === "accepted" ? "accepted" : "rejected",
          resolvedAt: new Date().toISOString(),
          resolvedHours: decision === "accepted" ? approvedHours : 0
        };
      });

      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    if (!resolvedRequest) return { ok: false, message: "Request not found." };

    const requestMeta = resolvedRequest.meta ?? {};
    const studentId = requestMeta.studentId;
    const subjectId = requestMeta.subjectId;
    
    if (decision === "accepted") {
      const currentData = loadJson(SUBJECT_ATTENDANCE_STORAGE_KEY, {});
      const current = currentData?.[studentId]?.[subjectId] ?? { totalHours: 0, presentHours: 0 };

      const nextData = {
        ...currentData,
        [studentId]: {
          ...(currentData[studentId] ?? {}),
          [subjectId]: {
            totalHours: Number(current.totalHours) || 0,
            presentHours: (Number(current.presentHours) || 0) + Number(approvedHours)
          }
        }
      };
      localStorage.setItem(SUBJECT_ATTENDANCE_STORAGE_KEY, JSON.stringify(nextData));
    }

    return { ok: true };
  };

  const markPresent = (studentId) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;

    setAttendance((prev) => {
      if (prev.some((e) => e.studentId === studentId)) return prev;
      const next = [...prev, { studentId, name: target.name, time: new Date().toLocaleTimeString() }];
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const appState = {
    students,
    attendance,
    attendanceMap,
    currentUser,
    authLoading,
    signup,
    login,
    logout,
    addStudent,
    addNotification,
    resolveDutyLeaveRequest,
    notifications,
    markPresent,
    isFirebaseConfigured
  };

  return (
    <AppStateProvider value={appState}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />

          <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<TeacherHome />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="manual" element={<TeacherManual />} />
          </Route>

          <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<StudentHome />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="absence" element={<StudentAbsence />} />
            <Route path="leave" element={<StudentLeave />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}

export default App;