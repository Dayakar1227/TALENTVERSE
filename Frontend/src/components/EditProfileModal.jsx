import React, { useState } from 'react';
import { Camera, Save, X } from 'lucide-react';
import { motion } from 'motion/react';
import { resolveAssetUrl, updateProfile, uploadAvatar } from '../lib/api.js';

function splitList(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function blankToNull(value) {
  const trimmed = String(value || '').trim();
  return trimmed || null;
}

export default function EditProfileModal({ user, onClose, onUserUpdate }) {
  const [form, setForm] = useState({
    name: user.name || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || '',
    roles: (user.roles?.length ? user.roles : []).filter(Boolean).join(', '),
    interestedRoles: (user.interestedRoles || []).join(', '),
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(resolveAssetUrl(user.avatar));
  const [avatarFile, setAvatarFile] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setIsSaving(true);

    try {
      let nextUser = await updateProfile({
        name: form.name.trim(),
        gender: blankToNull(form.gender),
        date_of_birth: blankToNull(form.dateOfBirth),
        roles: splitList(form.roles),
        interested_roles: splitList(form.interestedRoles),
        bio: blankToNull(form.bio),
        location: blankToNull(form.location),
        website: blankToNull(form.website),
      });

      if (avatarFile) {
        nextUser = await uploadAvatar(avatarFile);
      }

      onUserUpdate(nextUser);
      setStatus('Profile updated');
      window.setTimeout(onClose, 700);
    } catch (err) {
      setError(err.message || 'Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-100 bg-white soft-shadow dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Edit Profile</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Update what coworkers see on your profile.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close edit profile"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[180px_1fr]">
          <div>
            <div className="relative mx-auto h-32 w-32">
              <img src={avatarPreview} alt={user.name} className="h-32 w-32 rounded-3xl object-cover soft-shadow" />
              <label className="absolute -bottom-2 -right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white soft-shadow hover:bg-brand-700">
                <Camera className="h-5 w-5" />
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatar} />
              </label>
            </div>
            <p className="mt-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">PNG, JPG, or WEBP up to 5 MB</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-bold uppercase text-slate-400">Name</span>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-400">Gender</span>
              <input name="gender" value={form.gender} onChange={handleChange} placeholder="Female, Male, Non-binary..." className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-400">DOB</span>
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-bold uppercase text-slate-400">Roles</span>
              <input name="roles" value={form.roles} onChange={handleChange} placeholder="Photographer, Editor" className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-bold uppercase text-slate-400">Interested Roles</span>
              <input name="interestedRoles" value={form.interestedRoles} onChange={handleChange} placeholder="Director, Colorist, Scriptwriter" className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-bold uppercase text-slate-400">Bio</span>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} className="w-full resize-none rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-400">Location</span>
              <input name="location" value={form.location} onChange={handleChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-400">Website</span>
              <input name="website" value={form.website} onChange={handleChange} className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </label>
          </div>
        </div>

        {(error || status) && (
          <div className={`mx-6 mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${error ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300' : 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'}`}>
            {error || status}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 p-6 dark:border-slate-800">
          <button type="button" onClick={onClose} className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70">
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
