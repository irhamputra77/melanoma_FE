import React, { useState, useEffect } from 'react';
import { getPatientProfile } from '../../features/patient/services/patientService'; // Ganti ke patientService

const PatientNavbar = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getPatientProfile();
        setProfile(data);
      } catch (error) {
        console.error("Gagal mengambil data profile pasien:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const displayName = profile?.name || "Patient";
  const displayAvatar = profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center">
      </div>
      <div className="flex items-center space-x-6">
        <button className="text-gray-400 hover:text-blue-600 transition focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
          <div className="text-right hidden md:block">
            {isLoading ? (
              <div className="animate-pulse flex flex-col items-end space-y-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-100 rounded w-16"></div>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  Patient
                </p>
              </>
            )}
          </div>
          
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse border border-gray-100"></div>
          ) : (
            <img 
              src={displayAvatar} 
              alt="Profile" 
              className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 object-cover" 
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default PatientNavbar;