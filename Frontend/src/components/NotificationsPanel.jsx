import React, { useEffect, useState } from 'react';
import { Bell, Briefcase, CheckCheck, Image, UserRound, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { getNotifications, markNotificationsRead } from '../lib/api.js';

const icons = {
  profile: <UserRound className="h-4 w-4" />,
  portfolio: <Image className="h-4 w-4" />,
  jobs: <Briefcase className="h-4 w-4" />,
  connections: <Users className="h-4 w-4" />,
};

export default function NotificationsPanel({ isOpen, onUnreadChange }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setIsLoading(true);
    setError('');

    getNotifications()
      .then((data) => {
        if (!active) return;
        setItems(data.items || []);
        onUnreadChange(data.unread_count || 0);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load notifications.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, onUnreadChange]);

  const handleMarkRead = async () => {
    try {
      await markNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, is_read: true })));
      onUnreadChange(0);
    } catch (err) {
      setError(err.message || 'Could not mark notifications as read.');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-[24px] border border-slate-100 bg-white soft-shadow dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Notifications</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Account updates and next steps</p>
        </div>
        <button
          onClick={handleMarkRead}
          className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <CheckCheck className="h-4 w-4" />
          Read
        </button>
      </div>

      <div className="max-h-[380px] overflow-y-auto p-2">
        {isLoading && <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading notifications...</div>}
        {error && <div className="m-2 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
        {!isLoading && !error && !items.length && (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <Bell className="mx-auto mb-3 h-6 w-6 text-slate-300" />
            You are all caught up.
          </div>
        )}
        {!isLoading && !error && items.map((item) => (
          <div
            key={item.id}
            className={`m-2 flex gap-3 rounded-2xl p-3 transition-colors ${item.is_read ? 'bg-white dark:bg-slate-900' : 'bg-brand-50 dark:bg-brand-950/30'}`}
          >
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 dark:bg-slate-800 dark:text-brand-300">
              {icons[item.type] || <Bell className="h-4 w-4" />}
            </div>
            <div>
              <div className="flex items-start gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                {!item.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
