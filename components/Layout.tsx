
import React from 'react';
import { ICONS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  onLogout?: () => void;
  onAdminClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, isAdmin, onLogout, onAdminClick }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.hash = ''}>
              <div className="text-green-600 p-2 bg-green-50 rounded-xl">
                {ICONS.Tree}
              </div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">Tree<span className="text-green-600">Fund</span></span>
            </div>

            <nav className="flex items-center gap-4">
              {isAdmin ? (
                <>
                  <button 
                    onClick={() => window.location.hash = '#admin'} 
                    className="text-sm font-medium text-gray-600 hover:text-green-600 px-3 py-2 flex items-center gap-2"
                  >
                    {ICONS.Dashboard} Dashboard
                  </button>
                  <button 
                    onClick={onLogout}
                    className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-2 flex items-center gap-2"
                  >
                    {ICONS.Logout} Logout
                  </button>
                </>
              ) : (
                <button 
                  onClick={onAdminClick}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Admin Portal
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} TreeFund Malaysia. All rights reserved.</p>
          <p className="mt-2">1 TREE = RM10. Let's make a difference together.</p>
        </div>
      </footer>
    </div>
  );
};
