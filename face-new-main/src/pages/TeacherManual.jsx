import { useMemo, useState } from "react";
import { useAppState } from "../context/AppStateContext";
import { motion } from "framer-motion";
import { 
  ClipboardList, 
  User, 
  Book, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Settings2
} from "lucide-react";

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

export default function TeacherManual() {
  const { students, currentUser, addNotification } = useAppState();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [mode, setMode] = useState("add_both");
  const [message, setMessage] = useState("");

  const subjects = loadJson(SUBJECTS_STORAGE_KEY, []);

  const teacherSubjects = useMemo(
    () => subjects.filter((subject) => subject.teacherId === currentUser?.id),
    [subjects, currentUser]
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedStudentId || !selectedSubjectId) {
      setMessage("Please select both student and subject.");
      return;
    }

    const data = loadJson(SUBJECT_ATTENDANCE_STORAGE_KEY, {});
    const current = data?.[selectedStudentId]?.[selectedSubjectId] ?? {
      totalHours: 0,
      presentHours: 0
    };

    let nextTotal = Number(current.totalHours) || 0;
    let nextPresent = Number(current.presentHours) || 0;

    if (mode === "add_both") {
      nextTotal += 1;
      nextPresent += 1;
    } else if (mode === "add_total_only") {
      nextTotal += 1;
    } else if (mode === "add_present_only") {
      nextPresent += 1;
    }

    const nextData = {
      ...data,
      [selectedStudentId]: {
        ...(data[selectedStudentId] ?? {}),
        [selectedSubjectId]: {
          totalHours: nextTotal,
          presentHours: nextPresent
        }
      }
    };

    localStorage.setItem(SUBJECT_ATTENDANCE_STORAGE_KEY, JSON.stringify(nextData));
    setMessage("Attendance record updated successfully.");

    const selectedStudent = students.find((student) => student.id === selectedStudentId);
    const selectedSubject = teacherSubjects.find((subject) => subject.id === selectedSubjectId);
    if (selectedStudent && selectedSubject) {
      addNotification({
        message: `Manual override: ${selectedStudent.name} attendance updated in ${selectedSubject.subjectName}.`,
        targetRole: "teacher"
      });
      addNotification({
        message: `Manual attendance update received for ${selectedSubject.subjectName} (${selectedSubject.subjectCode}).`,
        targetRole: "student",
        targetUserId: selectedStudent.id
      });
    }
  };

  return (
    <div className="p-8 max-w-[800px] mx-auto space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center gap-4 mb-8">
           <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-glow-primary">
             <ClipboardList className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-xl font-bold tracking-tight">Manual Override</h2>
             <p className="text-xs text-textSecondary font-bold uppercase tracking-widest mt-1">Direct Record Modification</p>
           </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-textSecondary uppercase ml-1 flex items-center gap-2">
                <User className="w-3 h-3" /> Target Student
              </span>
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-card">Choose student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id} className="bg-card">
                    {student.name} ({student.rollNo})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-textSecondary uppercase ml-1 flex items-center gap-2">
                <Book className="w-3 h-3" /> Subject Context
              </span>
              <select
                value={selectedSubjectId}
                onChange={(event) => setSelectedSubjectId(event.target.value)}
                disabled={teacherSubjects.length === 0}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="" className="bg-card">
                  {teacherSubjects.length === 0
                    ? "No assigned subjects"
                    : "Choose subject..."}
                </option>
                {teacherSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id} className="bg-card">
                    {subject.subjectName} ({subject.subjectCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-bold text-textSecondary uppercase ml-1 flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> Modification Logic
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'add_both', label: 'Full Credit', sub: '+1 Total / +1 Present' },
                { id: 'add_total_only', label: 'Absence', sub: '+1 Total Only' },
                { id: 'add_present_only', label: 'Bonus', sub: '+1 Present Only' },
              ].map((item) => (
                <label 
                  key={item.id}
                  className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    mode === item.id 
                    ? 'bg-primary/10 border-primary/40 shadow-glow-primary' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={item.id}
                    checked={mode === item.id}
                    onChange={(event) => setMode(event.target.value)}
                    className="sr-only"
                  />
                  <span className={`text-sm font-bold ${mode === item.id ? 'text-primary' : 'text-textPrimary'}`}>{item.label}</span>
                  <span className="text-[10px] text-textSecondary font-medium mt-1">{item.sub}</span>
                </label>
              ))}
            </div>
          </div>

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                message.includes('successfully') ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
              }`}
            >
              {message.includes('successfully') ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.toUpperCase()}
            </motion.div>
          )}

          <button 
            type="submit"
            className="w-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-glow-primary"
          >
            EXECUTE OVERRIDE
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
