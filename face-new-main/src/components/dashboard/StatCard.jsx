import React from 'react';
// Lucide icons are passed as props, no need for LucideIcon type in JSX

const StatCard = ({ icon: Icon, label, value, colorClass, glowClass }) => {
  return (
    <div className={`glass-card p-6 flex items-center gap-6 group cursor-pointer border-white/5 ${glowClass} transition-all duration-300 hover:-translate-y-1`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass} bg-opacity-10 border border-current shadow-sm group-hover:bg-opacity-20 transition-all duration-500`}>
        <Icon className="w-8 h-8" />
      </div>
      
      <div>
        <p className="text-textSecondary text-xs font-bold tracking-widest uppercase mb-1">{label}</p>
        <h3 className="text-3xl font-bold tracking-tight text-textPrimary">{value}</h3>
      </div>
      
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <div className={`w-2 h-2 rounded-full ${colorClass.split(' ')[0]} animate-ping`}></div>
      </div>
    </div>
  );
};

export default StatCard;
