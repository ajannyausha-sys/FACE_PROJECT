import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  UserPlus, 
  FileBarChart, 
  Settings, 
  LogOut, 
  Activity,
  Home,
  Camera,
  ClipboardList
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';

const Sidebar = () => {
  const { logout } = useAppState();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher/dashboard' },
    { icon: Home, label: 'Home', path: '/teacher/home' },
    { icon: Camera, label: 'AI Monitoring', path: '/teacher/attendance' },
    { icon: Users, label: 'Students List', path: '/teacher/students' },
    { icon: ClipboardList, label: 'Manual Entry', path: '/teacher/manual' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-64 h-screen bg-card border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6">
        <h1 className="text-primary text-xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6" />
          FACE Engine
        </h1>
        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-success animate-pulse">
          <span className="w-2 h-2 bg-success rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          System Active
        </div>
      </div>

      <nav className="flex-1 mt-4 px-4 space-y-2">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-glow-primary' 
                : 'text-textSecondary hover:bg-white/5 hover:text-textPrimary border border-transparent'
              }`
            }
          >
            <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 group-hover:translate-x-1" />
          <span className="font-bold">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
