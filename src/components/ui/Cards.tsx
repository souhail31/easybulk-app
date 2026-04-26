import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';

export const Card = ({ children, className }: { children: React.ReactNode, className?: string, key?: React.Key }) => (
  <div className={cn("bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden", className)}>
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
    blue: "bg-blue-50 text-blue-600 shadow-blue-100",
    green: "bg-emerald-50 text-emerald-600 shadow-emerald-100",
    purple: "bg-purple-50 text-purple-600 shadow-purple-100",
    orange: "bg-orange-50 text-orange-600 shadow-orange-100"
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">
            {typeof value === 'number' ? formatNumber(value) : value}
          </h3>
          {trend && (
            <div className={cn("flex items-center space-x-1 mt-2 text-sm font-semibold", trend.up ? "text-emerald-600" : "text-rose-600")}>
              <span>{trend.up ? '↑' : '↓'} {trend.value}</span>
              <span className="text-slate-400 font-normal">vs mois précédent</span>
            </div>
          )}
        </div>
        <div className={cn("p-4 rounded-xl shadow-sm", colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};
