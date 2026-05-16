import React, { useState, useEffect } from 'react';
import LoadingButton from '../../../components/common/LoadingButton';
import { 
  getPatientSettings,
  getPatientProfile, // Ditambahkan untuk mengambil data Email asli
  updatePatientAccountSettings, 
  updatePatientTwoFactor, 
  updatePatientNotificationSettings, 
  updatePatientPrivacySettings,
  updatePatientPreferences // Ditambahkan untuk preferensi bahasa
} from '../services/patientService';

const SystemSettingsPatient = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Pisahkan state email karena email biasanya bagian dari account/profile, bukan settings murni
  const [email, setEmail] = useState('');

  // Settings State
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: false,
    verificationAlerts: false,
    dataVisibility: 'Restricted (Clinical Team Only)',
    language: 'English (US)'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Jalankan 2 request secara paralel: Profile (untuk email) & Settings
      const [profileData, settingsData] = await Promise.all([
        getPatientProfile(),
        getPatientSettings()
      ]);

      // Set Email dari profile atau user object
      setEmail(profileData?.email || profileData?.user?.email || '');

      // Set Settings
      if (settingsData) {
        setSettings({
          twoFactorEnabled: settingsData.twoFactorEnabled || false,
          emailNotifications: settingsData.emailNotifications || false,
          verificationAlerts: settingsData.verificationAlerts || false,
          dataVisibility: settingsData.dataVisibility || 'Restricted (Clinical Team Only)',
          language: settingsData.language || 'English (US)'
        });
      }
    } catch (error) {
      console.error("Gagal load settings:", error);
      setMessage({ text: 'Gagal memuat pengaturan. Periksa koneksi Anda.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Tembak semua spesifik PATCH endpoint API secara paralel
      await Promise.all([
        updatePatientAccountSettings({ email }),
        updatePatientTwoFactor(settings.twoFactorEnabled),
        updatePatientNotificationSettings({
          emailNotifications: settings.emailNotifications,
          verificationAlerts: settings.verificationAlerts
        }),
        updatePatientPrivacySettings({
          dataVisibility: settings.dataVisibility
        }),
        updatePatientPreferences({
          language: settings.language
        })
      ]);
      
      setMessage({ text: 'Pengaturan berhasil disimpan!', type: 'success' });
      
      // Hilangkan pesan sukses setelah 3 detik
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error(error);
      setMessage({ 
        text: error.response?.data?.message || 'Terjadi kesalahan saat menyimpan pengaturan.', 
        type: 'error' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
         <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
         <p className="text-gray-500 font-medium">Memuat pengaturan sistem...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Settings</h1>
        <p className="text-gray-600">Manage your clinic preferences and security protocols.</p>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-xl font-medium text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        
        {/* Account Settings */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Account Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2">Email Address</label>
                {/* READONLY DIHAPUS - SEKARANG BISA DIEDIT */}
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-2">Password</label>
                <div className="relative">
                  {/* Password biasanya di-update lewat flow khusus/modal, jadi tetap readOnly di view ini */}
                  <input type="password" value="********" readOnly className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 focus:outline-none pr-20" />
                  <button onClick={() => alert('Fitur ganti password akan diproses di form terpisah.')} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-bold text-blue-600 hover:text-blue-800">Change</button>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 flex items-center justify-between border border-gray-100 h-fit">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Two-Factor Authentication</h4>
                <p className="text-xs text-gray-500">Enhanced security for clinical data access.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.twoFactorEnabled} onChange={() => handleToggle('twoFactorEnabled')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Notification Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 transition hover:border-blue-200 cursor-pointer" onClick={() => handleToggle('emailNotifications')}>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Email Notifications</h4>
                  <p className="text-xs text-gray-500">Weekly summaries and system updates.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                <input type="checkbox" className="sr-only peer" checked={settings.emailNotifications} readOnly />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 transition hover:border-blue-200 cursor-pointer" onClick={() => handleToggle('verificationAlerts')}>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Verification Alerts</h4>
                  <p className="text-xs text-gray-500">Instant alerts for new high-confidence detections.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                <input type="checkbox" className="sr-only peer" checked={settings.verificationAlerts} readOnly />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Bawah: Privacy & Systems */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
             <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Privacy Settings
                </h3>
                <label className="block text-xs font-bold text-gray-900 mb-2">Data Visibility</label>
                <div className="relative mb-4">
                  <select 
                    value={settings.dataVisibility}
                    onChange={(e) => handleChange('dataVisibility', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="Restricted (Clinical Team Only)">Restricted (Clinical Team Only)</option>
                    <option value="Full Access (All Specialists)">Full Access (All Specialists)</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                     <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
             </div>
             <p className="text-xs text-gray-500 italic mt-4">Data is encrypted using AES-256 standards.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
             <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                  System Preferences
                </h3>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-900">Language</span>
                  
                  {/* SEKARANG BISA DIGANTI (Dropdown) */}
                  <select 
                    value={settings.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="text-sm font-bold text-blue-600 bg-transparent outline-none cursor-pointer text-right appearance-none"
                    style={{ textAlignLast: 'right' }} // Mengatur text di select agar rata kanan
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  </select>
                </div>
             </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button 
            onClick={fetchData}
            disabled={isSaving}
            className="px-6 py-3 text-blue-600 font-bold hover:bg-blue-50 rounded-xl transition disabled:opacity-50"
          >
            Discard Changes
          </button>
          <LoadingButton 
            onClick={handleSave} 
            isLoading={isSaving}
            className="px-6 py-3 bg-[#0A58CA] text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            Save Preferences
          </LoadingButton>
        </div>

      </div>
    </div>
  );
};

export default SystemSettingsPatient;