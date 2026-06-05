import React, { useEffect, useState } from 'react';
import { Bell, BriefcaseBusiness, Moon, Search, Sun, UserPen, UserRound } from 'lucide-react';
import { motion } from 'motion/react';
import NotificationsPanel from './NotificationsPanel.jsx';
import { getNotifications, resolveAssetUrl } from '../lib/api.js';

function accountLabel(user) {
  const accountRoles = user.accountRoles || [user.role || 'CREATIVE'];
  const labels = accountRoles.map((role) => (role === 'RECRUITER' ? 'Recruiter' : 'Job Seeker'));
  return [...new Set(labels)].join(' + ');
}

export default function Navbar({ user, onOpenProfile, onEditProfile, isDarkMode, onToggleDarkMode, accountMode, onAccountModeChange }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const canSwitchModes = user.accountRoles?.includes('RECRUITER') || user.role === 'RECRUITER';

  useEffect(() => {
    let active = true;

    getNotifications()
      .then((data) => {
        if (active) setUnreadCount(data.unread_count || 0);
      })
      .catch(() => {
        if (active) setUnreadCount(0);
      });

    return () => {
      active = false;
    };
  }, [user.id]);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 dark:bg-slate-900/85 dark:border-slate-800">
      <div className="flex-1 flex items-center max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-brand-600 transition-colors" />
          <input
            type="text"
            placeholder="Search for skills, projects, or jobs..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {canSwitchModes && (
          <div className="hidden items-center rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800 md:flex">
            <button
              type="button"
              onClick={() => onAccountModeChange('JOB_SEEKER')}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors ${
                accountMode === 'JOB_SEEKER'
                  ? 'bg-white text-brand-600 soft-shadow dark:bg-slate-900 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <UserRound className="h-3.5 w-3.5" />
              Job Seeker
            </button>
            <button
              type="button"
              onClick={() => onAccountModeChange('RECRUITER')}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors ${
                accountMode === 'RECRUITER'
                  ? 'bg-white text-brand-600 soft-shadow dark:bg-slate-900 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Recruiter
            </button>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={onToggleDarkMode}
          animate={{ rotate: isDarkMode ? 180 : 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all duration-1000 ease-out dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-300"
          aria-label="Toggle dark mode"
        >
          <motion.span
            key={isDarkMode ? 'sun' : 'moon'}
            initial={{ scale: 0.35, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.35, opacity: 0, y: -6 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="block"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.span>
        </motion.button>
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsNotificationsOpen((value) => !value)}
            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors relative dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-300"
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>
          <NotificationsPanel isOpen={isNotificationsOpen} onUnreadChange={setUnreadCount} />
        </div>
        <div className="h-8 w-[1px] bg-slate-200 mx-2 dark:bg-slate-800"></div>
        <button
          onClick={onEditProfile}
          className="hidden items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-brand-300 md:inline-flex"
        >
          <UserPen className="h-4 w-4" />
          Profile
        </button>
        <motion.button
          whileHover={{ x: 5 }}
          onClick={onOpenProfile}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors dark:text-slate-100 dark:group-hover:text-brand-300">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{accountLabel(user)}</p>
          </div>
          <img
            src={resolveAssetUrl(user.avatar)}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-white soft-shadow ring-2 ring-transparent group-hover:ring-brand-100 transition-all dark:border-slate-800 dark:group-hover:ring-brand-800"
          />
        </motion.button>
      </div>
    </header>
  );
}
