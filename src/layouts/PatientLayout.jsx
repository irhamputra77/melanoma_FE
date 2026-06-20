import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PatientSidebar from '../components/common/PatientSidebar';
import PatientNavbar from '../components/common/PatientNavbar';

const PatientLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] font-sans overflow-hidden relative">

      <div className="hidden lg:block h-full shrink-0">
        <PatientSidebar />
      </div>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-[150] flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-[#F8F9FA] shadow-2xl animate-slideRight z-10 overflow-y-auto">
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 rounded-xl bg-white border border-gray-100 text-gray-500 hover:text-gray-900 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PatientSidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3 shrink-0 shadow-sm">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-base font-black text-gray-900 tracking-tight">
            MySkin<span className="text-[#0A58CA]">.</span>
          </span>
          <div className="w-10 h-10"></div>
        </div>

        <PatientNavbar />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8F9FA] p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slideRight {
          animation: slideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      ` }} />
    </div>
  );
};

export default PatientLayout;