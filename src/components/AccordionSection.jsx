import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccordionSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:opacity-80 transition-opacity outline-none"
      >
        <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "'Neue Montreal', 'Inter', sans-serif" }}>
          {title}
        </h2>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-white/[0.4] text-2xl font-light"
        >
          +
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-8 text-white/[0.6] leading-relaxed whitespace-pre-wrap text-sm sm:text-base" style={{ fontFamily: "'Neue Montreal', 'Inter', sans-serif" }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
