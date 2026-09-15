import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  isOpen?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full' | string;
  className?: string;
}

const maxWidthClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full'
};

export const Modal: React.FC<ModalProps> = ({ children, onClose, title, isOpen, maxWidth = 'lg', className }) => {
  if (isOpen === false) return null;

  const widthClass = maxWidthClasses[maxWidth] || maxWidth;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 flex items-end sm:items-center justify-center pointer-events-auto"
    >
      <motion.div 
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.95 }}
        className={`bg-white w-full ${widthClass} rounded-[28px] sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${className || ''}`}
      >
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs sm:text-sm">{title}</h3>
          <button 
            onClick={onClose} 
            aria-label="Tutup"
            className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[85vh] p-4 sm:p-6">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};
