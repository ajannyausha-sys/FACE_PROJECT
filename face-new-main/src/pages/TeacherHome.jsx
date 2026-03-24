import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAppState } from "../context/AppStateContext";
import { db } from "../firebase";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Plus, 
  Users, 
  CheckCircle, 
  GraduationCap, 
  PlusCircle, 
  LayoutGrid 
} from "lucide-react";

const SUBJECTS_STORAGE_KEY = "face-attendance-subjects";

const loadSubjects = () => {
  try {
    const raw = localStorage.getItem(SUBJECTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export default function TeacherHome() {
  const { students, attendance, currentUser, isFirebaseConfigured, addNotification } =
    useAppState();
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjects, setSubjects] = useState(loadSubjects);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [formMessage, setFormMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadTeachers = async () => {
      if (!isFirebaseConfigured || !db) {
        if (!active) return;
        const fallback = currentUser ? [currentUser] : [];
        setTeachers(fallback);
        setTeacherId(fallback[0]?.id ?? "");
        setLoadingTeachers(false);
        return;
      }

      try {
        const q = query(collection(db, "users"), where("role", "==", "teacher"));
        const snap = await getDocs(q);
        const found = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
            email: data.email || ""
          };
        });

        if (!active) return;
        const nextTeachers = found.length ? found : currentUser ? [currentUser] : [];
        setTeachers(nextTeachers);
        setTeacherId(nextTeachers[0]?.id ?? "");
      } catch {
        if (!active) return;
        const fallback = currentUser ? [currentUser] : [];
        setTeachers(fallback);
        setTeacherId(fallback[0]?.id ?? "");
      } finally {
        if (active) setLoadingTeachers(false);
      }
    };

    loadTeachers();
    return () => {
      active = false;
    };
  }, [currentUser, isFirebaseConfigured]);

  const handleAddSubject = (event) => {
    event.preventDefault();
    const trimmedName = subjectName.trim();
    const trimmedCode = subjectCode.trim().toUpperCase();

    if (!trimmedName || !trimmedCode || !teacherId) {
      setFormMessage("Please fill all fields.");
      return;
    }

    const alreadyExists = subjects.some(
      (subject) => subject.subjectCode.toUpperCase() === trimmedCode
    );
    if (alreadyExists) {
      setFormMessage("Subject code already exists.");
      return;
    }

    const assignedTeacher = teachers.find((teacher) => teacher.id === teacherId);
    const nextSubject = {
      id: crypto.randomUUID(),
      subjectName: trimmedName,
      subjectCode: trimmedCode,
      teacherId,
      teacherName: assignedTeacher?.name || "Unknown",
      createdAt: new Date().toISOString()
    };

    const next = [nextSubject, ...subjects];
    setSubjects(next);
    localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(next));
    setSubjectName("");
    setSubjectCode("");
    setFormMessage("Subject added.");
    addNotification({
      message: `New subject added: ${trimmedName} (${trimmedCode}).`,
      targetRole: "teacher"
    });
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 relative overflow-hidden group"
      >
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight mb-4 flex items-center gap-3">
            <GraduationCap className="w-10 h-10 text-primary" />
            Welcome, {currentUser?.name}
          </h2>
          <p className="text-textSecondary max-w-2xl leading-relaxed">
            Centralized control center for academic tracking. Manage subjects, faculty assignments, and real-time attendance pipelines from this secure interface.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity translate-x-1/4 -translate-y-1/4 pointer-events-none">
          <BookOpen className="w-64 h-64 text-primary" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics and Quick Actions */}
        <div className="space-y-8">
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-6 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Add New Subject
            </h2>
            <form className="space-y-5" onSubmit={handleAddSubject}>
              <div className="space-y-2">
                <span className="text-xs font-bold text-textSecondary uppercase ml-1">Subject Name</span>
                <input
                  type="text"
                  placeholder="e.g. Data Structures"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  value={subjectName}
                  onChange={(event) => setSubjectName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-textSecondary uppercase ml-1">Subject Code</span>
                <input
                  type="text"
                  placeholder="e.g. CS301"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  value={subjectCode}
                  onChange={(event) => setSubjectCode(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-textSecondary uppercase ml-1">Assign Faculty</span>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-textPrimary focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer hover:bg-white/10"
                  style={{
                    backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"white\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                  value={teacherId}
                  onChange={(event) => setTeacherId(event.target.value)}
                  disabled={loadingTeachers || teachers.length === 0}
                >
                  {loadingTeachers && <option style={{backgroundColor: '#1a1a2e', color: '#00d4ff'}}>Loading faculty data...</option>}
                  {!loadingTeachers && teachers.length === 0 && <option style={{backgroundColor: '#1a1a2e', color: '#00d4ff'}}>No faculty found</option>}
                  {!loadingTeachers &&
                    teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id} style={{backgroundColor: '#1a1a2e', color: '#00d4ff'}}>
                        {teacher.name}
                      </option>
                    ))}
                </select>
              </div>

              {formMessage && (
                <div className={`mt-2 p-3 rounded-lg text-xs font-bold ${formMessage.includes('added') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                  {formMessage.toUpperCase()}
                </div>
              )}
              <button 
                type="submit"
                className="w-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-glow-primary"
              >
                <Plus className="w-5 h-5" />
                REGISTER SUBJECT
              </button>
            </form>
          </motion.section>
        </div>

        {/* Subjects Table */}
        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-widest text-primary uppercase flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Department Enrollment
            </h2>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-textSecondary">
              {subjects.length} REGISTERED
            </span>
          </div>
          
          <div className="flex-1 overflow-auto">
            {!subjects.length ? (
              <div className="flex flex-col items-center justify-center h-full p-20 text-center space-y-4 opacity-50">
                <BookOpen className="w-16 h-16" />
                <p className="text-sm font-medium">No subjects have been registered in the system yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Reference Code</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Assigned Faculty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {subjects.map((subject, idx) => (
                      <motion.tr 
                        key={subject.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <span className="text-sm font-bold text-textPrimary group-hover:text-primary transition-colors">{subject.subjectName}</span>
                        </td>
                        <td className="px-6 py-5">
                          <code className="text-xs bg-white/5 px-2 py-1 rounded border border-white/10 font-mono text-primary">
                            {subject.subjectCode}
                          </code>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-success"></div>
                             <span className="text-sm text-textSecondary">{subject.teacherName}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
