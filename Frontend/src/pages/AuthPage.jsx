import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from '../components/Logo.jsx';
import { loginUser, registerUser } from '../lib/api.js';

const Palette = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.707-.484 2.15-1.108.434-.614 1.141-.892 1.85-.892 1.105 0 2 .895 2 2 0 .552.448 1 1 1 2.761 0 5-2.239 5-5 0-5.523-4.477-10-10-10z" />
  </svg>
);

const BriefcaseIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export default function AuthPage({ onLogin }) {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role')?.toUpperCase() === 'RECRUITER' ? 'RECRUITER' : 'CREATIVE';
  const [isLogin, setIsLogin] = useState(initialRole !== 'RECRUITER');
  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = isLogin
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser({
            name: form.name,
            email: form.email,
            password: form.password,
            role,
            skills: [],
          });

      onLogin(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-100 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 opacity-60" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-100 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 opacity-60" />

      <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-[40px] overflow-hidden soft-shadow relative z-10">
        {/* Left branding panel */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 to-indigo-700 text-white">
          <div>
            <div className="mb-12"><Logo className="brightness-0 invert" /></div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-4xl font-bold font-display leading-tight mb-6"
            >
              Empowering the next generation of creatives.
            </motion.h2>
            <div className="space-y-4">
              {['Verified portfolios & original works.', 'AI-curated job matching system.', 'Trust-score based reputation.'].map((text, i) => (
                <motion.div
                  key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center space-x-3 text-brand-100"
                >
                  <CheckCircle2 className="w-5 h-5 text-brand-300" />
                  <span>{text}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-sm"
          >
            <p className="text-sm italic opacity-90">"TalentVerse helped me land my first international gig as a travel photographer in just two weeks."</p>
            <div className="flex items-center space-x-3 mt-4">
              <img src="https://picsum.photos/seed/testimonial/100" className="w-10 h-10 rounded-full border-2 border-white/30" alt="User" />
              <div>
                <p className="text-sm font-bold">Marcus Chen</p>
                <p className="text-xs opacity-70">Travel Photographer</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right form panel */}
        <div className="p-12 md:p-16">
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{isLogin ? 'Welcome back!' : 'Create your account'}</h3>
            <p className="text-slate-500">{isLogin ? 'Enter your details to access your portal.' : 'Start your creative journey with us today.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Creative', value: 'CREATIVE', Icon: Palette },
                  { label: 'Recruiter', value: 'RECRUITER', Icon: BriefcaseIcon },
                ].map(({ label, value, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setRole(value);
                      if (value === 'RECRUITER') {
                        setError('Recruiter accounts are approved by admin after signup.');
                      } else {
                        setError('');
                      }
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center space-y-2 ${role === value ? 'border-brand-600 bg-brand-50 text-brand-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required={!isLogin}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email Address"
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                minLength={8}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
              />
            </div>

            {isLogin && (
              <div className="text-right">
                <a href="#" className="text-sm text-violet-600 hover:underline">Forgot Password?</a>
              </div>
            )}

            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold soft-shadow hover:bg-brand-700 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            >
              <span>{isSubmitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-violet-600 font-bold hover:underline ml-1"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
