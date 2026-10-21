import React from 'react';

export type BadgeVariant = 'default' | 'system' | 'ai' | 'uncertain' | 'success' | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
  };

  const variantConfig: Record<
    BadgeVariant,
    { classes: string; icon?: string; defaultLabel?: string }
  > = {
    default: {
      classes:
        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
    },
    // 🔒 1. DỮ LIỆU HỆ THỐNG (Khóa, lấy từ PostgreSQL)
    system: {
      classes:
        'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      icon: '🔒',
      defaultLabel: 'Hệ thống',
    },
    // ⚡ 2. DỮ LIỆU AI GỢI Ý (Tím nhạt, độ tự tin cao)
    ai: {
      classes:
        'bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      icon: '⚡',
      defaultLabel: 'AI Gợi ý',
    },
    // ⚠️ 3. DỮ LIỆU AI CHƯA CHẮC CHẮN (Viền vàng, cần xác nhận)
    uncertain: {
      classes:
        'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 font-semibold',
      icon: '⚠️',
      defaultLabel: 'AI Cần hỏi lại',
    },
    success: {
      classes:
        'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    },
    danger: {
      classes:
        'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    },
  };

  const config = variantConfig[variant];

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${config.classes} ${className}`} {...props}>
      {config.icon && <span aria-hidden="true">{config.icon}</span>}
      <span>{children || config.defaultLabel}</span>
    </span>
  );
};

export default Badge;
