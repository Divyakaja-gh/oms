import React from 'react';
import { X, Wrench } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function ComingSoonModal({ isOpen, onClose, title }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-md animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-zinc-900 mb-2">Feature in Development</h4>
          <p className="text-sm text-zinc-500 mb-6">
            The module for <strong>{title}</strong> is currently being built and will be available in an upcoming release.
          </p>
          <button onClick={onClose} className="w-full bg-zinc-900 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-zinc-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
