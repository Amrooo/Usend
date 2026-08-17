import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto isolate">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[999998]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-[999999] w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 flex flex-col my-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0 bg-white z-20">
              <h3 className="text-xl font-black text-zinc-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>
            <div className="p-0 flex-1 overflow-y-auto min-h-0">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
