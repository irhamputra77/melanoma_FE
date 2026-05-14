import React from 'react';
import { Outlet } from 'react-router-dom';
import PatientSidebar from '../components/common/PatientSidebar';
import PatientNavbar from '../components/common/PatientNavbar';

const PatientLayout = () => {
  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans">
      <PatientSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PatientNavbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8F9FA] p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;