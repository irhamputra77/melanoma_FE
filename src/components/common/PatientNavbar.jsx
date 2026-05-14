import React from 'react';

const PatientNavbar = () => {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center">
      </div>
      <div className="flex items-center space-x-6">
        <button className="text-gray-400 hover:text-blue-600 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </button>
        <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-900">Sarah Johnson</p>
            <p className="text-xs text-gray-500">Patient</p>
          </div>
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Profile" className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100" />
        </div>
      </div>
    </header>
  );
};

export default PatientNavbar;