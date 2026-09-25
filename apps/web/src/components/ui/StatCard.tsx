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
    <div className="relative p-5 bg-tactiq-card border border-tactiq-border rounded-xl backdrop-blur-md overflow-hidden group hover:border-tactiq-emerald/40 transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-tactiq-muted uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-tactiq-surface flex items-center justify-center text-tactiq-emerald group-hover:scale-110 transition-transform">
          <Icon size={16} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline space-x-2">
        <span className="text-2xl font-black text-white tracking-tight">{value}</span>
        {change && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {subtext && <p className="mt-1 text-xs text-tactiq-muted">{subtext}</p>}

      {/* Subtle bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-tactiq-emerald/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
