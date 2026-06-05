import React, { useState, useEffect } from 'react';
import LoadingButton from '../../../components/common/LoadingButton';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  getPatientSettings,
  updatePatientAccountSettings,
  updatePatientNotificationSettings,
  updatePatientPreferences,
} from '../services/patientService';

const SystemSettingsPatient = () => {
  const { changeLanguage } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [email, setEmail] = useState('');

  const [settings, setSettings] = useState({
    emailNotifications: true,
    scanNotifications: true,
    reportNotifications: true,
    language: 'Bahasa Indonesia',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const settingsData = await getPatientSettings();

      setEmail(settingsData?.account?.email || '');

      setSettings({
        emailNotifications: settingsData?.notifications?.emailNotifications ?? true,
        scanNotifications: settingsData?.notifications?.scanNotifications ?? true,
        reportNotifications: settingsData?.notifications?.reportNotifications ?? true,
        language: settingsData?.preferences?.language || 'Bahasa Indonesia',
      });
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Gagal memuat pengaturan. Periksa koneksi Anda.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    const emailError = getEmailValidationError(email);
    if (emailError) {
      setMessage({ text: emailError, type: 'error' });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await Promise.all([
        updatePatientAccountSettings({
          email,
        }),
        updatePatientNotificationSettings({
          emailNotifications: settings.emailNotifications,
          scanNotifications: settings.scanNotifications,
          reportNotifications: settings.reportNotifications,
        }),
        updatePatientPreferences({
          language: settings.language,
        }),
      ]);

      changeLanguage(settings.language);

      setMessage({
        text: 'Pengaturan berhasil disimpan!',
        type: 'success',
      });

      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Terjadi kesalahan saat menyimpan pengaturan.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
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
        <div className={`p-4 mb-6 rounded-xl font-medium text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            Account & Security
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-900 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            Notifications
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100/50 transition" onClick={() => handleToggle('emailNotifications')}>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Email Notifications</h4>
                <p className="text-xs text-gray-500">Receive general updates via email.</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                <input type="checkbox" className="sr-only peer" checked={settings.emailNotifications} readOnly />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100/50 transition" onClick={() => handleToggle('scanNotifications')}>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Scan Alerts</h4>
                <p className="text-xs text-gray-500">Alerts when new AI detections are completed.</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                <input type="checkbox" className="sr-only peer" checked={settings.scanNotifications} readOnly />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100/50 transition" onClick={() => handleToggle('reportNotifications')}>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Report Availability</h4>
                <p className="text-xs text-gray-500">Alerts when clinical PDF reports are ready.</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                <input type="checkbox" className="sr-only peer" checked={settings.reportNotifications} readOnly />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            System Preferences
          </h3>

          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900">Language</span>

            <select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="text-sm font-bold text-blue-600 bg-transparent outline-none cursor-pointer text-right appearance-none"
              style={{ textAlignLast: 'right' }}
            >
              <option value="English (US)">English (US)</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
            </select>
          </div>
        </div>

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
            className="px-6 py-3 bg-[#0A58CA] text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm transition"
          >
            Save Preferences
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPatient;
