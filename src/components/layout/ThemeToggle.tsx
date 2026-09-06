import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  variant?: 'segmented' | 'compact';
  className?: string;
}

export function ThemeToggle({ variant = 'segmented', className }: ThemeToggleProps) {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "relative flex items-center justify-center p-2 rounded-full transition-all duration-200 cursor-pointer",
          isDark 
            ? "bg-zinc-800 text-amber-400 hover:bg-zinc-700 border border-zinc-700 shadow-xs" 
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 border border-zinc-200 shadow-xs",
          className
        )}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Current mode: ${isDark ? 'Dark' : 'Light'}. Click to toggle.`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-200 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-200 rotate-0 hover:-rotate-12" />
        )}
      </button>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
          Appearance
        </span>
        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 capitalize">
          {theme} Mode
        </span>
      </div>

      <div 
        role="group" 
        aria-label="Theme mode selection"
        className="grid grid-cols-2 gap-1 p-1 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/60 transition-colors"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={cn(
            "flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none",
            !isDark 
              ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/60 font-bold" 
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/40 font-medium"
          )}
          aria-pressed={!isDark}
        >
          <Sun className={cn("w-3.5 h-3.5", !isDark ? "text-amber-500" : "text-zinc-400")} />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={cn(
            "flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none",
            isDark 
              ? "bg-zinc-900 text-zinc-100 shadow-xs border border-zinc-700 font-bold text-amber-300" 
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60 font-medium"
          )}
          aria-pressed={isDark}
        >
          <Moon className={cn("w-3.5 h-3.5", isDark ? "text-amber-400" : "text-zinc-500")} />
          <span>Dark</span>
        </button>
      </div>
    </div>
  );
}
