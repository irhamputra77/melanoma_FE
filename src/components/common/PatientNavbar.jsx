import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom'; 
import { 
  getPatientDashboard, 
  getPatientNotifications, 
  markPatientNotificationAsRead,
  markAllPatientNotificationsAsRead 
} from '../../features/patient/services/patientService';
import { useLanguage } from '../../contexts/LanguageContext';

const resolveImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    if (path.includes('dicebear')) return path;
    return `${path}${path.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
  }
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3300/api';
  const baseUrl = apiUrl.split('/api')[0]; 
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}?t=${new Date().getTime()}`;
};

const PatientNavbar = () => {
  const { t } = useLanguage();
  const navigate = useNavigate(); 
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const notifRef = useRef(null);

  const fetchProfileOnly = async () => {
    try {
      const dashboardData = await getPatientDashboard();
      setProfile(dashboardData?.profile);
    } catch (error) {}
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, notifData] = await Promise.all([
          getPatientDashboard(),
          getPatientNotifications({ limit: 10 })
        ]);
        setProfile(dashboardData?.profile);
        setNotifications(notifData?.data || []);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener('profileUpdated', fetchProfileOnly);
    
    // Polling notifikasi setiap 15 detik agar bel hijau up-to-date
    const notifInterval = setInterval(async () => {
        try {
            const notifData = await getPatientNotifications({ limit: 10 });
            setNotifications(notifData?.data || []);
        } catch (error) {}
    }, 15000);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('profileUpdated', fetchProfileOnly);
      clearInterval(notifInterval);
    };
  }, []);

  // FITUR TAHAP 6: Smart Navigation pada Notifikasi
  const handleNotifClick = async (notif) => {
    // 1. Tandai sebagai terbaca di background
    if (!notif.isRead) {
        try {
            await markPatientNotificationAsRead(notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        } catch (error) {}
    }

    // 2. Navigasi pintar berdasarkan tipe notifikasi (Asumsi dari backend)
    setShowNotif(false); // Tutup dropdown
    
    if (notif.type === 'CHAT_MESSAGE' || notif.consultationId) {
        // Jika notifikasi pesan baru, bawa ke ruang chat
        navigate(`/patient/messages/${notif.consultationId || ''}`);
    } else if (notif.type === 'SCAN_RESULT' || notif.scanId) {
        // Jika notifikasi hasil scan, bawa ke detail histori
        navigate(`/patient/history-detail/${notif.scanId || ''}`);
    } else {
        // Fallback jika tidak ada data spesifik
        navigate('/patient/history');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllPatientNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayName = profile?.name || "Patient";
  
  let displayAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;
  const rawPhotoUrl = profile?.avatarUrl || profile?.photoUrl;
  if (rawPhotoUrl) {
    displayAvatar = resolveImageUrl(rawPhotoUrl);
  }

  const handleImageError = (e) => {
    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center"></div>
      <div className="flex items-center space-x-6 relative">
        
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

          <AnimatePresence>
          {showNotif && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-sm">{t('Notifications')}</h3>
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
                      onClick={() => handleNotifClick(notif)} // MENGGUNAKAN FUNGSI BARU
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
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        <div 
          onClick={() => navigate('/patient/profile')}
          className="flex items-center space-x-3 border-l border-gray-200 pl-6 cursor-pointer hover:opacity-80 transition-opacity"
        >
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
            <img 
              src={displayAvatar} 
              onError={handleImageError}
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
