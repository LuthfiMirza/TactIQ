import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  subtext,
}) => {
  return (
    <div className="relative p-5 bg-tactiq-card border border-tactiq-border rounded-xl overflow-hidden group hover:border-tactiq-borderHover transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-tactiq-muted uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-tactiq-surface flex items-center justify-center text-tactiq-emerald group-hover:scale-105 transition-transform">
          <Icon size={16} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline space-x-2">
        <span className="text-2xl font-black text-white tracking-tight">{value}</span>
        {change && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded border ${
              isPositive ? 'bg-tactiq-surface text-tactiq-emerald border-tactiq-emerald/40' : 'bg-tactiq-surface text-tactiq-away border-tactiq-away/40'
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {subtext && <p className="mt-1 text-xs text-tactiq-muted">{subtext}</p>}

      {/* Solid bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-tactiq-emerald opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
