import { useState, useMemo } from "react";
import { useAppState } from "../context/AppStateContext";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Download,
  Save,
  AlertCircle,
  Clock
} from "lucide-react";

export default function TeacherManual() {
  const { students, addNotification } = useAppState();
  const [attendance, setAttendance] = useState(() => {
    // Initialize with all students
    const initial = {};
    students.forEach(student => {
      initial[student.id] = {
        name: student.name,
        rollNo: student.rollNo,
        status: "Present",
        timeIn: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 8),
        remarks: ""
      };
    });
    return initial;
  });

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    return students;
  }, [students]);

  // Calculate stats
  const stats = useMemo(() => {
    const values = Object.values(attendance);
    return {
      present: values.filter(a => a.status === 'Present').length,
      late: values.filter(a => a.status === 'Late').length,
      absent: values.filter(a => a.status === 'Absent').length,
      total: values.length
    };
  }, [attendance]);

  const handleStatusChange = (studentId, newStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus
      }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleMarkAllPresent = () => {
    const updated = {};
    Object.keys(attendance).forEach(studentId => {
      updated[studentId] = {
        ...attendance[studentId],
        status: 'Present'
      };
    });
    setAttendance(updated);
    addNotification({
      message: "All students marked as Present",
      type: 'success'
    });
  };

  const handleMarkAllAbsent = () => {
    const updated = {};
    Object.keys(attendance).forEach(studentId => {
      updated[studentId] = {
        ...attendance[studentId],
        status: 'Absent'
      };
    });
    setAttendance(updated);
    addNotification({
      message: "All students marked as Absent",
      type: 'warning'
    });
  };

  const handleReset = () => {
    const initial = {};
    students.forEach(student => {
      initial[student.id] = {
        name: student.name,
        rollNo: student.rollNo,
        status: 'Present',
        timeIn: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 8),
        remarks: ""
      };
    });
    setAttendance(initial);
    addNotification({
      message: "Attendance reset to default",
      type: 'info'
    });
  };

  const handleSaveAttendance = () => {
    addNotification({
      message: `Attendance saved: ${stats.present} Present, ${stats.late} Late, ${stats.absent} Absent`,
      type: 'success'
    });
  };

  const handleExportCSV = () => {
    const date = new Date().toISOString().split('T')[0];
    const filename = `attendance_${date}.csv`;
    
    const headers = ['#', 'Name', 'Roll No', 'Department', 'Status', 'Time In', 'Remarks'];
    const rows = filteredStudents.map((student, idx) => {
      const att = attendance[student.id];
      return [
        idx + 1,
        att.name,
        att.rollNo,
        student.department || 'N/A',
        att.status,
        att.timeIn,
        att.remarks
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);

    addNotification({
      message: `Attendance exported to ${filename}`,
      type: 'success'
    });
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-textPrimary flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-primary" />
          Manual Attendance
        </h1>
        <p className="text-textSecondary">Computer Vision (CS401) · 24 Mar 2026 · Lab 3 - Block B</p>
      </motion.div>

      {/* Top Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Action Buttons */}
          <button
            onClick={handleMarkAllPresent}
            className="px-4 py-2.5 bg-success/20 text-success border border-success/30 hover:bg-success/30 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark All Present
          </button>
          <button
            onClick={handleMarkAllAbsent}
            className="px-4 py-2.5 bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Mark All Absent
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-white/10 text-textSecondary border border-white/20 hover:bg-white/15 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Save Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveAttendance}
            className="px-4 py-2.5 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <Save className="w-4 h-4" />
            Save Attendance
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Save & Export CSV
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest w-8">#</th>
                <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Roll No</th>
                <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Dept</th>
                <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Time In</th>
                <th className="px-6 py-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((student, idx) => {
                const att = attendance[student.id];
                if (!att) return null;

                return (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4 text-xs font-mono text-textSecondary">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                          {(att.name || '?').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-textPrimary group-hover:text-primary transition-colors">{att.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-white/5 px-2 py-1 rounded border border-white/10 font-mono text-secondary">
                        {att.rollNo}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-xs text-textSecondary">{student.department || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={att.status}
                        onChange={(e) => handleStatusChange(student.id, e.target.value)}
                        className="text-[10px] font-bold px-2 py-1 rounded border cursor-pointer transition-all"
                        style={{
                          backgroundColor: att.status === 'Present' ? 'rgba(16,185,129,0.1)' : att.status === 'Late' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          borderColor: att.status === 'Present' ? 'rgba(16,185,129,0.2)' : att.status === 'Late' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                          color: att.status === 'Present' ? '#10b981' : att.status === 'Late' ? '#f59e0b' : '#ef4444'
                        }}
                      >
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-textSecondary">{att.timeIn}</td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="optional..."
                        value={att.remarks}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-primary/50 transition-all placeholder-textSecondary/40"
                      />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Footer Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-xl"
      >
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm font-bold text-textSecondary">Present <span className="text-success ml-1">{stats.present}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-sm font-bold text-textSecondary">Late <span className="text-warning ml-1">{stats.late}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-danger" />
            <span className="text-sm font-bold text-textSecondary">Absent <span className="text-danger ml-1">{stats.absent}</span></span>
          </div>
        </div>
        <div className="text-sm font-bold text-textSecondary">
          Total Students:<span className="ml-2 text-primary">{stats.total}</span>
        </div>
      </motion.div>
    </div>
  );
}
