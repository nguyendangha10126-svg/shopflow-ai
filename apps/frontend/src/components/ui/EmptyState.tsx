import React from 'react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📦',
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 my-4">
      <span className="text-4xl select-none mb-3" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} size="sm" className="mt-4">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

