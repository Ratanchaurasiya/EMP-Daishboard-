import React from 'react';
import { AssetStatus, AssetCondition, EmployeeStatus, ProblemCategory, ServiceStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  className?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
  dotColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'md',
  dot = false,
  dotColor,
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-medium';

  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60',
    warning: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60',
    purple: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md ${sizeStyles} ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            dotColor ||
            (variant === 'success'
              ? 'bg-emerald-500'
              : variant === 'warning'
              ? 'bg-amber-500'
              : variant === 'danger'
              ? 'bg-rose-500'
              : variant === 'info'
              ? 'bg-blue-500'
              : 'bg-slate-400')
          }`}
        />
      )}
      {children}
    </span>
  );
};

export const AssetStatusBadge: React.FC<{ status: AssetStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  switch (status) {
    case 'Assigned':
      return (
        <Badge variant="info" size={size} dot dotColor="bg-blue-500">
          Assigned
        </Badge>
      );
    case 'Available':
      return (
        <Badge variant="success" size={size} dot dotColor="bg-emerald-500">
          Available
        </Badge>
      );
    case 'Under Service':
      return (
        <Badge variant="warning" size={size} dot dotColor="bg-amber-500 animate-pulse">
          Under Service
        </Badge>
      );
    case 'Returned':
      return (
        <Badge variant="neutral" size={size} dot dotColor="bg-slate-400">
          Returned
        </Badge>
      );
    case 'Damaged':
      return (
        <Badge variant="danger" size={size} dot dotColor="bg-rose-500">
          Damaged
        </Badge>
      );
    case 'Retired':
      return (
        <Badge variant="neutral" size={size} dot dotColor="bg-gray-400">
          Retired
        </Badge>
      );
    default:
      return <Badge size={size}>{status}</Badge>;
  }
};

export const ConditionBadge: React.FC<{ condition: AssetCondition; size?: 'sm' | 'md' }> = ({
  condition,
  size = 'md',
}) => {
  switch (condition) {
    case 'New':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
          New
        </span>
      );
    case 'Good':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Good
        </span>
      );
    case 'Fair':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
          Fair
        </span>
      );
    case 'Damaged':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60">
          Damaged
        </span>
      );
    default:
      return <Badge size={size}>{condition}</Badge>;
  }
};

export const EmployeeStatusBadge: React.FC<{ status: EmployeeStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  switch (status) {
    case 'Active':
      return (
        <Badge variant="success" size={size} dot dotColor="bg-emerald-500">
          Active
        </Badge>
      );
    case 'On Probation':
      return (
        <Badge variant="warning" size={size} dot dotColor="bg-amber-500">
          On Probation
        </Badge>
      );
    case 'On Leave':
      return (
        <Badge variant="purple" size={size} dot dotColor="bg-indigo-500">
          On Leave
        </Badge>
      );
    case 'Contractual':
      return (
        <Badge variant="info" size={size} dot dotColor="bg-blue-500">
          Contractual
        </Badge>
      );
    case 'Inactive':
      return (
        <Badge variant="warning" size={size} dot dotColor="bg-amber-500">
          Inactive
        </Badge>
      );
    case 'Resigned':
      return (
        <Badge variant="neutral" size={size} dot dotColor="bg-slate-400">
          Resigned
        </Badge>
      );
    default:
      return <Badge size={size}>{status}</Badge>;
  }
};

export const ServiceStatusBadge: React.FC<{ status: ServiceStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  switch (status) {
    case 'Completed':
      return (
        <Badge variant="success" size={size} dot dotColor="bg-emerald-500">
          Completed
        </Badge>
      );
    case 'In Progress':
      return (
        <Badge variant="warning" size={size} dot dotColor="bg-amber-500 animate-pulse">
          In Progress
        </Badge>
      );
    case 'Pending Parts':
      return (
        <Badge variant="purple" size={size} dot dotColor="bg-indigo-500">
          Pending Parts
        </Badge>
      );
    case 'Cannot Repair':
      return (
        <Badge variant="danger" size={size} dot dotColor="bg-rose-500">
          Cannot Repair
        </Badge>
      );
    default:
      return <Badge size={size}>{status}</Badge>;
  }
};

export const ProblemCategoryBadge: React.FC<{ category: ProblemCategory; size?: 'sm' | 'md' }> = ({
  category,
}) => {
  return (
    <span className="inline-block px-2 py-0.5 text-[11px] rounded font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80">
      {category}
    </span>
  );
};
