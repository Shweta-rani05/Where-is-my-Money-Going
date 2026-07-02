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
      iconBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      glow: 'shadow-emerald-500/5'
    },
    expense: {
      iconBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      glow: 'shadow-rose-500/5'
    },
    savings: {
      iconBg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      glow: 'shadow-blue-500/5'
    },
    budget: {
      iconBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      glow: 'shadow-amber-500/5'
    }
  };

  const activeStyle = typeStyles[type];

  return (
    <div className={`p-6 rounded-2xl bg-card-custom border border-border-custom shadow-sm hover:shadow-md transition-all duration-300 flex items-start justify-between group ${activeStyle.glow}`}>
      <div className="space-y-3">
        <span className="text-sm font-medium text-text-muted select-none">
          {title}
        </span>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight text-text-custom">
            {value}
          </h3>
          {changeText && (
            <p className="text-xs font-medium flex items-center gap-1">
              <span className={isPositive ? 'text-emerald-500' : 'text-rose-500'}>
                {changeText.startsWith('+') || changeText.startsWith('-') ? '' : isPositive ? '+' : '-'}
                {changeText}
              </span>
              <span className="text-text-muted">from last month</span>
            </p>
          )}
        </div>
      </div>

      <div className={`p-3 rounded-xl border transition-all duration-300 group-hover:scale-110 ${activeStyle.iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

export default StatsCard;
