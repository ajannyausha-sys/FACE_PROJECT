import React from 'react';
import StatCard from '../components/dashboard/StatCard';
import AttendanceTable from '../components/dashboard/AttendanceTable';
import LiveMonitor from '../components/dashboard/LiveMonitor';
import { Users, CheckCircle, XCircle, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppState } from '../context/AppStateContext';

const Dashboard = () => {
  const { students, attendance } = useAppState();

  const presentCount = attendance.length;
  const absentCount = Math.max(0, students.length - presentCount);
  const drowsyCount = 0; // In a real app, this would come from a session state

  const stats = [
    { icon: Users, label: 'Total Students', value: students.length.toString(), colorClass: 'text-primary', glowClass: 'glow-border-primary' },
    { icon: CheckCircle, label: 'Present', value: presentCount.toString(), colorClass: 'text-success', glowClass: 'border-success/30 shadow-glow-success hover:border-success/60' },
    { icon: XCircle, label: 'Absent', value: absentCount.toString(), colorClass: 'text-danger', glowClass: 'border-danger/30 shadow-glow-danger hover:border-danger/60' },
    { icon: AlertTriangle, label: 'Drowsy', value: drowsyCount.toString(), colorClass: 'text-warning', glowClass: 'border-warning/30 shadow-glow-warning hover:border-warning/60' },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <StatCard {...stat} />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <AttendanceTable />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-2 mb-4 px-2 tracking-widest text-xs font-bold text-textSecondary uppercase">
                <Activity className="w-4 h-4 text-primary" />
                Live Monitoring
              </div>
              <LiveMonitor />
              
              <div className="glass-card mt-6 p-6 border-secondary/20 bg-secondary/5">
                <h4 className="text-sm font-bold text-secondary mb-2">SYSTEM TIP</h4>
                <p className="text-xs text-textSecondary leading-relaxed">
                  Real-time face recognition and drowsiness detection are active. Ensure campus-wide cameras are calibrated for optimal performance.
                </p>
              </div>
            </motion.div>
          </div>
    </div>
  );
};

export default Dashboard;
