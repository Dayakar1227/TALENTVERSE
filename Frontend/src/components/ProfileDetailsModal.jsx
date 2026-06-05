import React from 'react';
import { X, Mail, Calendar, UserRound, BriefcaseBusiness, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { resolveAssetUrl } from '../lib/api.js';

function formatValue(value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not added yet';
  return value || 'Not added yet';
}

function formatRole(role) {
  return String(role || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
      <div className="mt-0.5 text-brand-600 dark:text-brand-300">{icon}</div>
      <div>
        <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

export default function ProfileDetailsModal({ user, onClose }) {
  if (!user) return null;

  const roles = user.roles?.length ? user.roles.map(formatRole) : [formatRole(user.role)];
  const accountRoles = (user.accountRoles || [user.role || 'CREATIVE']).map((role) => (
    role === 'RECRUITER' ? 'Recruiter' : 'Job Seeker'
  ));
  const interestedRoles = user.interestedRoles?.length ? user.interestedRoles : user.skills;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-100 bg-white soft-shadow dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <img
              src={resolveAssetUrl(user.avatar)}
              alt={user.name}
              className="h-16 w-16 rounded-2xl border-2 border-white object-cover soft-shadow dark:border-slate-800"
            />
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.bio || user.location || 'TalentVerse member'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close profile details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <DetailRow icon={<UserRound className="h-5 w-5" />} label="Name" value={formatValue(user.name)} />
          <DetailRow icon={<Mail className="h-5 w-5" />} label="Email" value={formatValue(user.email)} />
          <DetailRow icon={<UserRound className="h-5 w-5" />} label="Gender" value={formatValue(user.gender)} />
          <DetailRow icon={<Calendar className="h-5 w-5" />} label="DOB" value={formatValue(user.dateOfBirth)} />
          <DetailRow icon={<BriefcaseBusiness className="h-5 w-5" />} label="Account Type" value={formatValue([...new Set(accountRoles)])} />
          <DetailRow icon={<BriefcaseBusiness className="h-5 w-5" />} label="Roles" value={formatValue(roles)} />
          <DetailRow icon={<Sparkles className="h-5 w-5" />} label="Interested Roles" value={formatValue(interestedRoles)} />
        </div>
      </motion.div>
    </div>
  );
}
