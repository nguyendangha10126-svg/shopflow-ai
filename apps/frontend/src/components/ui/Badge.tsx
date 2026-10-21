import React from 'react';
import { Lock, Sparkles, AlertCircle, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export type BadgeVariant = 'default' | 'system' | 'ai' | 'uncertain' | 'success' | 'danger' | 'warning' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  showIcon = true,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
  };

  const iconSizes = {
    sm: 11,
    md: 13,
  };

  const variantConfig: Record<
    BadgeVariant,
    { classes: string; defaultIcon?: React.ReactNode; defaultLabel?: string }
  > = {
    default: {
      classes:
        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
    },
    system: {
      classes:
        'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      defaultIcon: <ShieldCheck size={iconSizes[size]} className="shrink-0" />,
      defaultLabel: 'Hệ thống',
    },
    ai: {
      classes:
        'bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      defaultIcon: <Sparkles size={iconSizes[size]} className="shrink-0" />,
      defaultLabel: 'AI Gợi ý',
    },
    uncertain: {
      classes:
        'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 font-semibold',
      defaultIcon: <AlertCircle size={iconSizes[size]} className="shrink-0" />,
      defaultLabel: 'AI Cần hỏi lại',
    },
    success: {
      classes:
        'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      defaultIcon: <CheckCircle2 size={iconSizes[size]} className="shrink-0" />,
    },
    danger: {
      classes:
        'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      defaultIcon: <AlertTriangle size={iconSizes[size]} className="shrink-0" />,
    },
    warning: {
      classes:
        'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      defaultIcon: <AlertCircle size={iconSizes[size]} className="shrink-0" />,
    },
    info: {
      classes:
        'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      defaultIcon: <Lock size={iconSizes[size]} className="shrink-0" />,
    },
  };

  const config = variantConfig[variant];
  const renderedIcon = icon !== undefined ? icon : showIcon ? config.defaultIcon : null;

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${config.classes} ${className}`} {...props}>
      {renderedIcon && <span aria-hidden="true" className="inline-flex items-center">{renderedIcon}</span>}
      <span>{children || config.defaultLabel}</span>
    </span>
  );
};

export default Badge;
