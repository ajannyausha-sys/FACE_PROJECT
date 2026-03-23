import React from 'react';
import { Search, Bell, User, Cpu } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';

const Navbar = () => {
  const { currentUser } = useAppState();

  return (
    <div className="h-20 border-b border-white/5 bg-card/30 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40">
      <div>
        <h2 className="text-xl font-semibold tracking-tight uppercase">Control Center</h2>
        <p className="text-[10px] text-textSecondary font-bold mt-1 bg-white/5 px-2 py-0.5 rounded-md inline-block">
          SYSTEM STATUS: <span className="text-success">NOMINAL</span>
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block group">
          <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search student or record..." 
            className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all w-64 focus:w-80"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-xl hover:bg-white/5 text-textSecondary transition-colors relative group">
            <Bell className="w-5 h-5 group-hover:text-primary transition-colors" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full ring-2 ring-background animate-pulse"></span>
          </button>
          
          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end hidden sm:flex">
               <span className="text-sm font-bold text-textPrimary">{currentUser?.name || 'Instructor'}</span>
               <span className="text-[9px] text-primary font-bold tracking-widest uppercase opacity-80">
                 {currentUser?.role || 'Teacher'} / Auth Valid
               </span>
             </div>
             <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-glow-primary group cursor-pointer hover:bg-primary/20 transition-all">
               <User className="w-6 h-6" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
