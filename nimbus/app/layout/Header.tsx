import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center py-4 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        {/* Mobile menu button could go here */}
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard</h2>
      </div>
      <div className="flex items-center space-x-4">
        {/* Placeholder for user menu / profile */}
        <div className="relative">
          <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white focus:outline-none">
            <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
               {/* Avatar placeholder */}
               <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
            </div>
            <span className="hidden md:block font-medium">User</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
