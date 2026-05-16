import React, { useState, useEffect, useRef } from 'react';
import { 
  getPatientProfile, 
  getPatientNotifications, 
  markPatientNotificationAsRead,
  markAllPatientNotificationsAsRead // FIX: Import endpoint baru
} from '../../features/patient/services/patientService';
import { useLanguage } from '../../contexts/LanguageContext';

const PatientNavbar = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const notifRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, notifData] = await Promise.all([
          getPatientProfile(),
          getPatientNotifications({ limit: 10 })
        ]);
        setProfile(profileData);
        setNotifications(notifData?.data || []);
      } catch (error) {
        console.error("Gagal mengambil data navbar:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Baca 1 notifikasi
  const handleReadNotif = async (id, isRead) => {
    if (isRead) return; // Jangan request jika sudah read
    try {
      await markPatientNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Gagal tandai dibaca:", error);
    }
  };

  // FIX: Baca semua notifikasi
  const handleMarkAllAsRead = async () => {
    try {
      await markAllPatientNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Gagal tandai semua dibaca:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayName = profile?.name || "Patient";
  const displayAvatar = profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center"></div>
      <div className="flex items-center space-x-6 relative">
        
        {/* Lonceng Notifikasi */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotif(!showNotif)}
            className="text-gray-400 hover:text-blue-600 transition focus:outline-none relative"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white justify-center items-center font-bold">{unreadCount}</span>
              </span>
            )}
          </button>

          {/* Dropdown Notifikasi */}
          {showNotif && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
              
              <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-sm">{t('Notifications')}</h3>
                {/* FIX: Tombol Mark All As Read */}
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition">
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => handleReadNotif(notif.id, notif.isRead)}
                      className={`p-4 border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                        {notif.title || notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-sm text-gray-500">Tidak ada notifikasi.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
          <div className="text-right hidden md:block">
            {isLoading ? (
              <div className="animate-pulse flex flex-col items-end space-y-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-100 rounded w-16"></div>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{displayName}</p>
                <p className="text-xs text-gray-500 capitalize">{t('Patient')}</p>
              </>
            )}
          </div>
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse border border-gray-100"></div>
          ) : (
            <img src={displayAvatar} alt="Profile" className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 object-cover" />
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }`}} />
    </header>
  );
};

export default PatientNavbar;