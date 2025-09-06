// src/components/shared/EmptyState.tsx
import React from 'react';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';

interface EmptyStateProps {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const DefaultIcon = () => (
    <svg className="mx-auto h-12 w-12 text-[#d1c0c1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    </svg>
);

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, actionText, onAction, icon = <DefaultIcon /> }) => {
  return (
    <Card className="text-center py-10">
        {icon}
        <h3 className="mt-2 text-xl font-semibold text-[#1b0e0e]">{title}</h3>
        <p className="mt-2 text-sm text-[#5f5252]">{message}</p>
        {actionText && onAction && (
            <div className="mt-6">
                <Button variant="primary" onClick={onAction}>
                    {actionText}
                </Button>
            </div>
        )}
    </Card>
  );
};
