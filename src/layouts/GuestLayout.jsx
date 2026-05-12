import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/GuestNavbar';
import Footer from '../components/common/Footer';

const GuestLayout = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col pt-16">
      <Navbar />
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default GuestLayout;