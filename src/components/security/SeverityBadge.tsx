import React from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ShieldAlert
} from 'lucide-react';
import { AuditSeverity } from '../../types';

export interface SeverityBadgeProps {
  severity: AuditSeverity | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showPulse?: boolean;
  format?: 'full' | 'short' | 'category';
  className?: string;
}

interface SeverityConfig {
  label: string;
  shortLabel: string;
  categoryLabel: string;
  description: string;
  bg: string;
  text: string;
  border: string;
  dotBg: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  pulse: boolean;
}

export function getSeverityConfig(rawSeverity: AuditSeverity | string): SeverityConfig {
  const norm = (rawSeverity || 'INFO').toUpperCase();

  switch (norm) {
    case 'CRITICAL':
      return {
        label: 'Critical',
        shortLabel: 'CRIT',
        categoryLabel: 'Critical Threat',
        description: 'Critical security incident or threshold breach requiring immediate review',
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/70',
        dotBg: 'bg-rose-500',
        icon: AlertOctagon,
        iconColor: 'text-rose-600 dark:text-rose-400',
        pulse: true
      };

    case 'HIGH':
      return {
        label: 'Warning · High',
        shortLabel: 'WARNING',
        categoryLabel: 'Warning (High Risk)',
        description: 'High-severity administrative change, privilege elevation, or KMS access',
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        text: 'text-amber-800 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/70',
        dotBg: 'bg-amber-500',
        icon: AlertTriangle,
        iconColor: 'text-amber-600 dark:text-amber-400',
        pulse: false
      };

    case 'MEDIUM':
      return {
        label: 'Warning',
        shortLabel: 'WARN',
        categoryLabel: 'Warning (Medium Risk)',
        description: 'Medium-priority action or security policy configuration update',
        bg: 'bg-yellow-50 dark:bg-yellow-950/50',
        text: 'text-yellow-800 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800/60',
        dotBg: 'bg-yellow-500',
        icon: AlertCircle,
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        pulse: false
      };

    case 'LOW':
      return {
        label: 'Low',
        shortLabel: 'LOW',
        categoryLabel: 'Low Risk',
        description: 'Low-impact client file access, download, or routine filing action',
        bg: 'bg-sky-50 dark:bg-sky-950/50',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800/60',
        dotBg: 'bg-sky-500',
        icon: Info,
        iconColor: 'text-sky-600 dark:text-sky-400',
        pulse: false
      };

    case 'INFO':
    default:
      return {
        label: 'Info',
        shortLabel: 'INFO',
        categoryLabel: 'Informational',
        description: 'Informational audit telemetry, successful authentication, or system event',
        bg: 'bg-zinc-100 dark:bg-zinc-800/80',
        text: 'text-zinc-700 dark:text-zinc-300',
        border: 'border-zinc-200 dark:border-zinc-700/80',
        dotBg: 'bg-zinc-400 dark:bg-zinc-500',
        icon: Info,
        iconColor: 'text-zinc-500 dark:text-zinc-400',
        pulse: false
      };
  }
}

export function SeverityBadge({
  severity,
  size = 'md',
  showIcon = true,
  showPulse,
  format = 'full',
  className = ''
}: SeverityBadgeProps) {
  const config = getSeverityConfig(severity);
  const IconComponent = config.icon;
  const isPulsing = showPulse !== undefined ? showPulse : config.pulse;

  const displayLabel = 
    format === 'short' 
      ? config.shortLabel 
      : format === 'category' 
      ? config.categoryLabel 
      : config.label;

  const sizeClasses = {
    xs: {
      container: 'text-[9px] px-1.5 py-0.5 gap-1 rounded',
      icon: 'w-2.5 h-2.5',
      dot: 'w-1 h-1'
    },
    sm: {
      container: 'text-[10px] px-2 py-0.5 gap-1 rounded-md font-semibold',
      icon: 'w-3 h-3',
      dot: 'w-1.5 h-1.5'
    },
    md: {
      container: 'text-[11px] px-2 py-0.5 gap-1.5 rounded-md font-semibold',
      icon: 'w-3.5 h-3.5',
      dot: 'w-1.5 h-1.5'
    },
    lg: {
      container: 'text-xs px-2.5 py-1 gap-2 rounded-lg font-bold',
      icon: 'w-4 h-4',
      dot: 'w-2 h-2'
    }
  }[size];

  return (
    <span
      title={`${config.categoryLabel}: ${config.description}`}
      className={`inline-flex items-center ${sizeClasses.container} ${config.bg} ${config.text} ${config.border} border font-mono tracking-tight transition-colors shadow-xs ${className}`}
    >
      {isPulsing ? (
        <span className="relative flex shrink-0 items-center justify-center">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotBg} opacity-75`} />
          <span className={`relative inline-flex rounded-full ${sizeClasses.dot} ${config.dotBg}`} />
        </span>
      ) : (
        <span className={`inline-block rounded-full shrink-0 ${sizeClasses.dot} ${config.dotBg}`} />
      )}

      {showIcon && (
        <IconComponent className={`${sizeClasses.icon} ${config.iconColor} shrink-0`} />
      )}

      <span className="font-sans whitespace-nowrap">{displayLabel}</span>
    </span>
  );
}
