import React, { useState } from 'react';
import { Bell, Download, Eye, Lock, Mail, Shield, Trash2 } from 'lucide-react';
import { resolveAssetUrl } from '../lib/api.js';

const settingGroups = [
  {
    title: 'Account',
    items: [
      { icon: <Mail className="h-5 w-5" />, title: 'Email updates', description: 'Receive product updates and portfolio activity.', key: 'emailUpdates' },
      { icon: <Bell className="h-5 w-5" />, title: 'Push notifications', description: 'Show alerts for jobs, collaborations, and messages.', key: 'pushNotifications' },
    ],
  },
  {
    title: 'Privacy',
    items: [
      { icon: <Eye className="h-5 w-5" />, title: 'Public portfolio', description: 'Allow people with your link to see profile and work.', key: 'publicPortfolio' },
      { icon: <Shield className="h-5 w-5" />, title: 'Show trust score', description: 'Display trust score on your public profile.', key: 'showTrustScore' },
      { icon: <Lock className="h-5 w-5" />, title: 'Connection requests only', description: 'Only allow messages from users who connect first.', key: 'connectionsOnly' },
    ],
  },
];

export default function SettingsPage({ user, isDarkMode, onToggleDarkMode }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('talentverse_settings');
    return saved ? JSON.parse(saved) : {
      emailUpdates: true,
      pushNotifications: true,
      publicPortfolio: true,
      showTrustScore: true,
      connectionsOnly: false,
    };
  });

  const updateSetting = (key) => {
    setSettings((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem('talentverse_settings', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Manage account preferences, privacy, notifications, and app appearance.</p>
      </div>

      <section className="rounded-[32px] border border-slate-100 bg-white p-6 soft-shadow dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <img src={resolveAssetUrl(user.avatar)} alt={user.name} className="h-16 w-16 rounded-2xl object-cover" />
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-100 bg-white p-6 soft-shadow dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Appearance</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark mode.</p>
          </div>
          <button onClick={onToggleDarkMode} className={`relative h-8 w-16 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-brand-600' : 'bg-slate-200'}`}>
            <span className={`block h-6 w-6 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-8' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      {settingGroups.map((group) => (
        <section key={group.title} className="rounded-[32px] border border-slate-100 bg-white p-6 soft-shadow dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-display text-lg font-bold text-slate-900 dark:text-white">{group.title}</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-slate-50 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-300">{item.icon}</div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                  </div>
                </div>
                <button onClick={() => updateSetting(item.key)} className={`relative h-7 w-14 shrink-0 rounded-full p-1 transition-colors ${settings[item.key] ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="grid gap-4 md:grid-cols-2">
        <button className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
          <Download className="h-5 w-5" />
          Export Account Data
        </button>
        <button className="flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 font-bold text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <Trash2 className="h-5 w-5" />
          Delete Account
        </button>
      </section>
    </div>
  );
}
