import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm ${
            trend.value >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="ml-2 text-sm text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}