import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Zap, Camera, Film, Palette, PenTool } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from '../components/Logo.jsx';

const Clapperboard = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11V4a2 2 0 0 1 2-2h10l4 4v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    <path d="m4 11 16-4" /><path d="m4 8 16-4" /><path d="m4 5 16-4" />
  </svg>
);

const categories = [
  { icon: <Camera className="w-8 h-8" />,      title: 'Photographers',    desc: 'Showcase high-res albums and get verified with our AI metadata checker.' },
  { icon: <Film className="w-8 h-8" />,         title: 'Video Editors',    desc: 'Streamline reels and collaborate with recruiters using interactive timelines.' },
  { icon: <Palette className="w-8 h-8" />,      title: 'Digital Artists',  desc: 'Protect your IP and find unique commission opportunities globally.' },
  { icon: <PenTool className="w-8 h-8" />,      title: 'Story Writers',    desc: 'Protect your scripts and connect with directors for collaborative screenwriting.' },
  { icon: <Clapperboard className="w-8 h-8" />, title: 'Direction',        desc: 'Manage casting calls and oversee creative production with integrated workflow tools.' },
  { icon: <Zap className="w-8 h-8" />,          title: 'Content Creators', desc: 'Viral growth tools and verified performance metrics for brand partnerships.' },
];

export default function LandingPage() {
  return (
    <div className="bg-white text-slate-900 overflow-x-hidden">
      {/* Header */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Logo />
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-brand-600 transition-colors">Features</a>
          <a href="#" className="hover:text-brand-600 transition-colors">Creators</a>
          <a href="#" className="hover:text-brand-600 transition-colors">Hiring</a>
          <Link to="/auth" className="text-brand-600 hover:text-brand-700">Log In</Link>
          <Link to="/auth" className="bg-brand-600 text-white px-6 py-3 rounded-full hover:bg-brand-700 transition-all soft-shadow hover:scale-105">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-brand-100/50 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto text-center md:text-left flex flex-col md:flex-row items-center gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <div className="inline-flex items-center space-x-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-current" />
              <span>AI-Powered Talent Matching</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 font-display text-slate-900">
              Where Creative Talent Meets <span className="text-brand-600">Opportunity.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed">
              Build your verified portfolio, learn new high-demand skills, and get hired by world-class teams through our AI-driven creative ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/auth" className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-full font-semibold hover:bg-brand-700 hover:scale-105 transition-all soft-shadow flex items-center justify-center">
                Join Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-semibold hover:bg-slate-50 transition-all">
                Explore Skills
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 relative"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden soft-shadow border-8 border-white">
              <img src="https://picsum.photos/seed/creative/800/600" alt="Creative Work" className="w-full h-auto rounded-2xl" />
              <div className="absolute bottom-6 left-6 right-6 glass p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Top Rated Creator</p>
                  <p className="font-bold text-slate-900">Alex Rivers</p>
                </div>
                <div className="bg-brand-600 text-white px-3 py-1 rounded-full text-xs font-bold">98% Trust Score</div>
              </div>
            </div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl soft-shadow z-20 hidden lg:block"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-teal-100 p-2 rounded-lg text-teal-600"><ShieldCheck className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-400">AI Verification</p>
                  <p className="text-sm font-bold">100% Original</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-display mb-4">Built for Every Creative Mind</h2>
            <p className="text-slate-500">Industry-specific features tailored to your unique craft.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl soft-shadow hover:-translate-y-2 transition-transform duration-300 border border-slate-100">
                <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mb-6">{cat.icon}</div>
                <h3 className="text-xl font-bold mb-3">{cat.title}</h3>
                <p className="text-slate-500 leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <Logo size="sm" className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all" />
          <p className="text-slate-400 text-sm">© 2026 TalentVerse. AI Powered Platform for Creativity.</p>
          <div className="flex space-x-6 text-slate-400 text-sm font-medium">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
