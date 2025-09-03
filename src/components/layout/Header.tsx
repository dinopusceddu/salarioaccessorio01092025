// components/layout/Header.tsx
import React from 'react';
import { useAppContext } from '../../contexts/AppContext.tsx';
import { APP_NAME } from '../../constants.ts';

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
  const { state } = useAppContext();
  const { currentUser } = state;

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
          <div className="flex items-center">
            <span className="text-[#1b0e0e] text-sm font-medium mr-3 hidden sm:block">
              {currentUser.name} ({currentUser.role})
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
