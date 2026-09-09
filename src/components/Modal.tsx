import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}

export const Modal: React.FC<ModalProps> = ({ children, onClose, title }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm p-4 flex items-end sm:items-center justify-center pointer-events-auto"
  >
    <motion.div 
      initial={{ y: 20, scale: 0.95 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ y: 20, scale: 0.95 }}
      className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
    >
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
        <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">{title}</h3>
        <button 
          onClick={onClose} 
          aria-label="Tutup"
          className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[85vh] p-6">
        {children}
      </div>
    </motion.div>
  </motion.div>
);
