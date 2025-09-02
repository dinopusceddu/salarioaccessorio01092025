// src/components/dashboard/CustomChartTooltip.tsx
import React from 'react';
import { TooltipProps } from 'recharts';
import { formatCurrency } from '../../utils/formatters.ts';

// FIX: Changed generic types for TooltipProps to `any, any` to resolve a TypeScript error where the `payload` property was not being recognized.
export const CustomChartTooltip: React.FC<TooltipProps<any, any>> = ({ active, payload }) => {
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