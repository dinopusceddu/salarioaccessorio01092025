// components/layout/Header.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../shared/Button';
import { APP_NAME } from '../../constants';

interface HeaderProps {
  toggleSidebar: () => void;
}

const AppLogo = () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <rect width="100" height="100" fill="#ea2832" />
      <text
        x="50"
        y="38"
        fontFamily="system-ui, -apple-system, 'Public Sans', sans-serif"
        fontSize="48"
        fontWeight="900"
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        FP
      </text>
      <text
        x="50"
        y="78"
        fontFamily="system-ui, -apple-system, 'Public Sans', sans-serif"
        fontSize="24"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        CGIL
      </text>
    </svg>
  );

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, signOut } = useAuth();
  const { state, dispatch } = useAppContext();
  const { selectedEntityId } = state;

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Errore durante il logout:', error.message);
    }
  };

  const handleBackToDashboard = () => {
    dispatch({ type: 'SET_SELECTED_ENTITY', payload: null });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#fcf8f8] border-b border-solid border-b-[#f3e7e8]">
      <div className="mx-auto px-6 sm:px-10">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="text-[#1b0e0e] hover:text-[#ea2832] focus:outline-none focus:text-[#ea2832] md:hidden"
              aria-label="Toggle sidebar"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <AppLogo />
            <h1 className="text-[#1b0e0e] text-lg font-bold leading-tight tracking-[-0.015em]">{APP_NAME}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#1b0e0e] text-sm font-medium hidden sm:block">
              {user?.email}
            </span>
            {selectedEntityId && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBackToDashboard}
              >
                ← Dashboard
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
