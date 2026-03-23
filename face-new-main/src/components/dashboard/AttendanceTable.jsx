import React from 'react';
import { useAppState } from '../../context/AppStateContext';

const AttendanceTable = () => {
  const { attendance, students } = useAppState();

  // Combine data: use attendance for "Present" and students for the rest
  const tableData = (attendance || []).map(a => ({
    name: a.name || 'Unknown',
    roll: 'S-' + (a.studentId ? a.studentId.slice(0, 4) : '????'),
    dept: 'CSE',
    time: a.time || '-',
    active: 'N/A',
    status: 'Present'
  }));

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Present': return 'bg-success/20 text-success border-success/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case 'Drowsy': return 'bg-warning/20 text-warning border-warning/30 shadow-[0_0_10px_rgba(250,204,21,0.2)]';
      case 'Absent': return 'bg-danger/20 text-danger border-danger/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      default: return '';
    }
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-primary/20', 'bg-secondary/20', 'bg-purple-500/20', 'bg-blue-500/20', 'bg-pink-500/20'];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('');

  return (
    <div className="glass-card mt-8 p-8 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold tracking-tight px-4 border-l-4 border-primary">ATTENDANCE REGISTER</h3>
        <button className="text-sm font-bold text-primary hover:underline transition-all underline-offset-4">View All Logs</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-3">
          <thead>
            <tr className="text-textSecondary text-xs font-bold tracking-widest uppercase">
              <th className="pb-4 px-4">Student Name</th>
              <th className="pb-4 px-4">Roll No</th>
              <th className="pb-4 px-4">Department</th>
              <th className="pb-4 px-4">Time In</th>
              <th className="pb-4 px-4">Active Time</th>
              <th className="pb-4 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr 
                key={index} 
                className="group hover:bg-white/5 transition-all duration-300"
              >
                <td className="py-4 px-4 rounded-l-2xl border-y border-l border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(row.name)} border border-white/10 group-hover:scale-110 transition-transform`}>
                      {getInitials(row.name)}
                    </div>
                    <span className="font-semibold text-textPrimary group-hover:text-primary transition-colors">{row.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 border-y border-white/5 font-mono text-sm">{row.roll}</td>
                <td className="py-4 px-4 border-y border-white/5">{row.dept}</td>
                <td className="py-4 px-4 border-y border-white/5 font-medium">{row.time}</td>
                <td className="py-4 px-4 border-y border-white/5">
                   <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                     {row.active}
                   </div>
                </td>
                <td className="py-4 px-4 rounded-r-2xl border-y border-r border-white/5">
                  <div className="flex justify-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${getStatusStyles(row.status)}`}>
                      {row.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex items-center justify-between text-[10px] font-bold tracking-widest text-textSecondary uppercase">
        <span>CAM_01 / FRONT_SEC_DASH</span>
        <span className="text-primary/50">ENC_V3 / DLIB_RESNET</span>
      </div>
    </div>
  );
};

export default AttendanceTable;
