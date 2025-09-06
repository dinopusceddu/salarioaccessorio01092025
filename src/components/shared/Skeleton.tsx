// src/components/shared/Skeleton.tsx
import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`bg-[#f3e7e8] animate-pulse rounded-md ${className}`}
      {...props}
    />
  );
};
