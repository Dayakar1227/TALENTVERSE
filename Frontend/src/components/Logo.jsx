import React from 'react';
import { Hexagon } from 'lucide-react';
import { motion } from 'motion/react';

export default function Logo({ className = '', iconOnly = false, size = 'md' }) {
  const sizes = {
    sm: { icon: 'w-5 h-5', text: 'text-lg',  padding: 'p-1'   },
    md: { icon: 'w-7 h-7', text: 'text-2xl', padding: 'p-1.5' },
    lg: { icon: 'w-10 h-10', text: 'text-4xl', padding: 'p-2' },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      <motion.div
        initial={{ rotate: -10, scale: 0.9 }}
        animate={{ rotate: 0, scale: 1 }}
        whileHover={{ rotate: 10, scale: 1.1 }}
        className={`bg-gradient-to-br from-brand-600 to-indigo-600 text-white ${s.padding} rounded-xl shadow-lg shadow-brand-500/20`}
      >
        <Hexagon className={`${s.icon} fill-current`} />
      </motion.div>
      {!iconOnly && (
        <span className={`font-display font-bold ${s.text} tracking-tight text-slate-900`}>
          TALENT<span className="text-brand-600">VERSE</span>
        </span>
      )}
    </div>
  );
}
