import React, { useState } from 'react';
import { Bell, User, Mail, Shield, X } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { currentUser, notifications } = useAppState();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter(n => n.status === 'new').length;

  return (
    <div className="h-20 border-b border-white/5 bg-card/30 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40">
      <div>
        <h2 className="text-xl font-semibold tracking-tight uppercase">Control Center</h2>
        <p className="text-[10px] text-textSecondary font-bold mt-1 bg-white/5 px-2 py-0.5 rounded-md inline-block">
          SYSTEM STATUS: <span className="text-success">NOMINAL</span>
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl hover:bg-white/5 text-textSecondary transition-colors relative group"
          >
            <Bell className="w-5 h-5 group-hover:text-primary transition-colors" />
            {unreadNotifications > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full ring-2 ring-background animate-pulse"></span>
            )}
          </button>
          
          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end hidden sm:flex">
               <span className="text-sm font-bold text-textPrimary">{currentUser?.name || 'Instructor'}</span>
               <span className="text-[9px] text-primary font-bold tracking-widest uppercase opacity-80">
                 {currentUser?.role || 'Teacher'} / Auth Valid
               </span>
             </div>
             <button 
               onClick={() => setShowProfile(!showProfile)}
               className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-glow-primary group cursor-pointer hover:bg-primary/20 transition-all"
             >
               <User className="w-6 h-6" />
             </button>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowProfile(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              onClick={e => e.stopPropagation()}
              className="absolute top-24 right-8 w-80 glass-card overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 bg-gradient-to-r from-primary/10 to-secondary/10 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-lg font-bold text-primary">
                    {(currentUser?.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-textPrimary">{currentUser?.name || 'Unknown'}</h3>
                    <p className="text-xs text-textSecondary">{currentUser?.role || 'Teacher'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfile(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-textSecondary" />
                </button>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-textSecondary">Email</p>
                    <p className="text-sm font-mono text-textPrimary truncate">{currentUser?.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <Shield className="w-4 h-4 text-success flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-textSecondary">Role</p>
                    <p className="text-sm font-bold text-success uppercase">{currentUser?.role || 'Teacher'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <User className="w-4 h-4 text-secondary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-textSecondary">User ID</p>
                    <p className="text-xs font-mono text-secondary truncate">{currentUser?.id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                <button 
                  onClick={() => setShowProfile(false)}
                  className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-bold text-sm text-textSecondary transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowNotifications(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              onClick={e => e.stopPropagation()}
              className="absolute top-24 right-8 w-96 glass-card overflow-hidden shadow-2xl max-h-96 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-bold text-textPrimary flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Notifications
                </h3>
                <span className="text-xs font-bold px-2 py-1 bg-primary/20 text-primary rounded">
                  {unreadNotifications}
                </span>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-textSecondary">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.slice(0, 10).map((notif, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 ${notif.status === 'new' ? 'bg-primary/5' : 'bg-transparent'} hover:bg-white/5 transition-colors border-l-2 ${
                          notif.type === 'success' ? 'border-success/50' : notif.type === 'error' ? 'border-danger/50' : 'border-primary/50'
                        }`}
                      >
                        <p className="text-xs font-bold text-textPrimary">{notif.message}</p>
                        <p className="text-[10px] text-textSecondary mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-white/5 bg-white/[0.02]">
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="w-full px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-bold text-textSecondary transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
