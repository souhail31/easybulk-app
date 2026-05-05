import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';

export const Card = ({ children, className }: { children: React.ReactNode, className?: string, key?: React.Key }) => (
  <div className={cn("bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

export const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  color = "blue" 
}: { 
  label: string, 
  value: string | number, 
  icon: LucideIcon, 
  trend?: { value: string, up: boolean },
  color?: "blue" | "green" | "purple" | "orange"
}) => {
  const colorClasses = {
    blue: "bg-primary/10 text-primary",
    green: "bg-emerald-50 text-emerald-500",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-amber-50 text-amber-500"
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{label}</p>
          <h3 className="text-2xl font-bold text-on-surface">
            {typeof value === 'number' ? formatNumber(value) : value}
          </h3>
          {trend && (
            <div className={cn("flex items-center space-x-1 mt-2 text-xs font-bold", trend.up ? "text-emerald-500" : "text-rose-500")}>
              <span>{trend.up ? '↑' : '↓'} {trend.value}</span>
              <span className="text-on-surface-variant/60 font-medium">vs dernier mois</span>
            </div>
          )}
        </div>
        <div className={cn("p-3.5 rounded-xl", colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
};
