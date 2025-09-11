// components/shared/AdminRoute.tsx - Componente per proteggere le route admin
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Verifica autorizzazioni..." />;
  }

  if (!isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-600 text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Accesso Non Autorizzato
          </h2>
          <p className="text-red-700 mb-4">
            Non hai i permessi necessari per accedere a questa sezione.
            Solo gli amministratori possono visualizzare questa pagina.
          </p>
          {fallback && (
            <div className="mt-4">
              {fallback}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};