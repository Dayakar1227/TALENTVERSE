import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, Briefcase, Users, GraduationCap, Settings, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo.jsx';

const navItems = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard',      path: '/dashboard' },
  { icon: <Upload className="w-5 h-5" />,          label: 'Portfolio',      path: '/upload' },
  { icon: <Briefcase className="w-5 h-5" />,       label: 'Jobs',           path: '/jobs' },
  { icon: <Users className="w-5 h-5" />,           label: 'Collaborations', path: '/collaborations' },
  { icon: <GraduationCap className="w-5 h-5" />,   label: 'Learning',       path: '/learning' },
  { icon: <Settings className="w-5 h-5" />,        label: 'Settings',       path: '/settings' },
];

const recruiterNavItems = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard',      path: '/dashboard' },
  { icon: <Upload className="w-5 h-5" />,          label: 'Portfolio',      path: '/upload' },
  { icon: <Briefcase className="w-5 h-5" />,       label: 'Post Jobs',      path: '/jobs' },
  { icon: <Users className="w-5 h-5" />,           label: 'Candidates',     path: '/candidates' },
  { icon: <Users className="w-5 h-5" />,           label: 'Collaborations', path: '/collaborations' },
  { icon: <Settings className="w-5 h-5" />,        label: 'Settings',       path: '/settings' },
];

export default function Sidebar({ user, onLogout, accountMode }) {
  const items = accountMode === 'RECRUITER' ? recruiterNavItems : navItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-20 dark:bg-slate-950 dark:border-slate-800">
      <div className="p-6">
        <div className="mb-8">
          <Logo />
        </div>
        <nav className="space-y-1">
          {items.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 font-semibold shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-brand-600 to-indigo-600 rounded-2xl p-4 text-white mb-4 soft-shadow"
        >
          <p className="text-xs opacity-80 mb-1">Current Trust Score</p>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{user.trustScore}%</span>
            <div className="w-12 h-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${user.trustScore}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="bg-white h-full"
              />
            </div>
          </div>
        </motion.div>

        <button
          onClick={onLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
