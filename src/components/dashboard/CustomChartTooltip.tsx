// src/components/dashboard/CustomChartTooltip.tsx
import React from 'react';
import { TooltipProps } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

// FIX: Changed props type to 'any' to resolve library type issue.
export const CustomChartTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-[#f3e7e8] shadow-md">
        <p className="text-sm font-semibold text-[#1b0e0e]">{`${data.name}`}</p>
        <p className="text-sm text-[#ea2832]">{formatCurrency(data.value)}</p>
      </div>
    );
  }
  return null;
};