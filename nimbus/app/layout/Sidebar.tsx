import React from 'react';
import Link from 'next/link';

const Sidebar: React.FC = () => {
  return (
    <div className="hidden md:flex md:shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center shrink-0 px-4">
              <span className="text-white text-2xl font-bold">Nimbus</span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              <Link href="/dashboard" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white bg-gray-900">
                Dashboard
              </Link>
              <Link href="/files" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
                Files
              </Link>
              <Link href="/upload" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
                Upload
              </Link>
              <Link href="/profile" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
                Profile
              </Link>
            </nav>
          </div>
          <div className="shrink-0 flex bg-gray-700 p-4">
             <div className="shrink-0 w-full group block">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">Storage</p>
                    <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">4.5 GB of 10 GB used</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
