import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

// Kamus terjemahan sederhana (Bisa diperluas ke file JSON terpisah jika sudah banyak)
const translations = {
  'English (US)': {
    'Overview': 'Overview',
    'Historical Data': 'Historical Data',
    'Patient Reports': 'Patient Reports',
    'System Settings': 'System Settings',
    'Logout': 'Logout',
    'Patient': 'Patient'
  },
  'Bahasa Indonesia': {
    'Overview': 'Ringkasan',
    'Historical Data': 'Riwayat Data',
    'Patient Reports': 'Laporan Pasien',
    'System Settings': 'Pengaturan Sistem',
    'Logout': 'Keluar',
    'Patient': 'Pasien'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('English (US)');

  useEffect(() => {
    // Ambil preferensi bahasa dari localStorage saat web dimuat
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang) setLanguage(savedLang);
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('appLanguage', lang);
  };

  const t = (key) => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    return key; // Fallback ke key asli jika tidak ada terjemahan
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);