import React from 'react';
import { ICONS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, isAdmin, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <a href="/#" className="flex items-center gap-3">
              <div className="w-12 h-12 text-green-600 bg-green-100 rounded-2xl flex items-center justify-center shadow-inner-sm">
                {ICONS.Tree}
              </div>
              <span className="text-2xl font-black text-gray-800">Tree<span className="text-green-600">Fund</span></span>
            </a>
            <nav>
              {isAdmin ? (
                <button onClick={onLogout} className="font-bold text-sm text-red-600 hover:text-red-800 flex items-center gap-2">
                  {ICONS.Logout} Logout
                </button>
              ) : (
                <a href="/#admin" className="font-bold text-sm text-gray-500 hover:text-gray-800">
                  Admin Portal
                </a>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-white border-t border-gray-200/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} TreeFund. A Project for a Greener Tomorrow.</p>
          <p className="mt-1">All donations are processed securely.</p>
        </div>
      </footer>
    </div>
  );
};