// src/components/shared/Fallback.tsx
import React from 'react';
import { Card } from './Card.tsx';
import { Button } from './Button.tsx';

interface FallbackProps {
  error: Error | null;
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

export const Fallback: React.FC<FallbackProps> = ({ 
  error, 
  title = "Errore Critico",
  message = "Si è verificato un errore imprevisto che impedisce il corretto funzionamento dell'applicazione.",
  actionText = "Ricarica la pagina",
  onAction = () => window.location.reload()
}) => (
  <div className="flex h-full min-h-[400px] items-center justify-center p-4 bg-[#fcf8f8]">
    <Card title={title} className="max-w-lg w-full border-l-4 border-red-500">
      <p className="text-[#1b0e0e] mb-4">{message}</p>
      {error && (
        <details className="bg-[#f3e7e8] p-2 rounded text-sm text-[#c02128] overflow-auto mb-4 cursor-pointer">
          <summary className="font-medium">Dettagli tecnici</summary>
          <pre className="mt-2 text-xs whitespace-pre-wrap">
            {error.toString()}
          </pre>
        </details>
      )}
      <Button onClick={onAction} variant="primary">
        {actionText}
      </Button>
    </Card>
  </div>
);
