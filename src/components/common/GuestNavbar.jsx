import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const GuestNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getLinkClasses = ({ isActive }) =>
    `font-medium transition duration-300 ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-900'} p-1`;

  return (
    <nav className="w-full bg-[#F8F9FA] px-8 py-4 flex items-center justify-between fixed top-0 z-50 border-b border-gray-100">
      <div className="flex-1">
        <NavLink to="/" className="text-blue-600 font-bold text-2xl tracking-tight">
          MySkin
        </NavLink>
      </div>
      
      <div className="hidden md:flex flex-1 justify-center space-x-8">
        <NavLink to="/" end className={getLinkClasses}>Home</NavLink>
        <NavLink to="/detection" className={getLinkClasses}>Detection</NavLink>
      </div>

      <div className="flex-1 flex items-center justify-end space-x-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-gray-500 hover:text-gray-900 focus:outline-none"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 p-6 flex flex-col space-y-4 shadow-xl z-40">
          <NavLink to="/" end className={getLinkClasses} onClick={() => setIsMobileMenuOpen(false)}>Home</NavLink>
          <NavLink to="/detection" className={getLinkClasses} onClick={() => setIsMobileMenuOpen(false)}>Detection</NavLink>
        </div>
      )}
    </nav>
  );
};

export default GuestNavbar;