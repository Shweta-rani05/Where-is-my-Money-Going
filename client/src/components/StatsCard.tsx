import React from 'react';
import { type LucideIcon } from 'lucide-react';


interface StatsCardProps {
  title: string;
  value: string;
  changeText: string;
  isPositive?: boolean;
  icon: LucideIcon;
  type: 'income' | 'expense' | 'savings' | 'budget';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  changeText,
  isPositive = true,
  icon: Icon,
  type
}) => {
  // Theme styling mapping based on card type
  const typeStyles = {
    income: {
      iconBg: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20',
      glow: 'shadow-[var(--success)]/5'
    },
    expense: {
      iconBg: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20',
      glow: 'shadow-[var(--danger)]/5'
    },
    savings: {
      iconBg: 'bg-primary/10 text-primary border-primary/20',
      glow: 'shadow-primary/5'
    },
    budget: {
      iconBg: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20',
      glow: 'shadow-[var(--warning)]/5'
    }
  };

  const activeStyle = typeStyles[type];

  return (
    <div className={`p-6 rounded-[var(--radius-card)] bg-card-custom border border-border-custom shadow-sm hover:shadow-md transition-all duration-300 flex items-start justify-between group ${activeStyle.glow}`}>
      <div className="space-y-3">
        <span className="text-sm font-medium text-text-muted select-none">
          {title}
        </span>
        <div className="space-y-1">
          <h3 className="text-3xl font-bold text-text-custom tabular-nums" style={{ letterSpacing: '-0.01em' }}>
            {value}
          </h3>
          {changeText && (
            <p className="text-xs font-medium flex items-center gap-1">
              <span className={isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
                {changeText.startsWith('+') || changeText.startsWith('-') ? '' : isPositive ? '+' : '-'}
                {changeText}
              </span>
              <span className="text-text-muted">from last month</span>
            </p>
          )}
        </div>
      </div>

      <div className={`p-3 rounded-full border transition-all duration-300 group-hover:scale-110 ${activeStyle.iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

export default StatsCard;
