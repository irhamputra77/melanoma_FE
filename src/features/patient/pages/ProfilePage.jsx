import React, { useState, useEffect, useRef } from 'react';
import LoadingButton from '../../../components/common/LoadingButton';
import { 
  getPatientProfile,
  getPatientDashboard,
  updatePatientProfile, 
  updatePatientProfilePhoto 
} from '../services/patientService';

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

const formatDateForInput = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

const formatJoinedDate = (isoString) => {
  if (!isoString) return 'Oct 2023';
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? 'Oct 2023' : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    phone: '',
    birthDate: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const [dataProfile, dataDashboard] = await Promise.all([
        getPatientProfile(),
        getPatientDashboard()
      ]);

      const mergedData = {
        ...dataProfile,
        avatarUrl: dataDashboard?.profile?.avatarUrl
      };

      setProfileData(mergedData);
      setFormData({
        name: mergedData.name || '',
        email: mergedData.email || '',
        gender: mergedData.gender || '',
        phone: mergedData.phone || '',
        birthDate: formatDateForInput(mergedData.birthDate)
      });
    } catch (error) {
      setMessage({ text: 'Gagal memuat profil. Periksa koneksi Anda.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDiscard = () => {
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        gender: profileData.gender || '',
        phone: profileData.phone || '',
        birthDate: formatDateForInput(profileData.birthDate)
      });
    }
    setMessage({ text: '', type: '' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        gender: formData.gender,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null
      };
      
      await updatePatientProfile(payload);
      setMessage({ text: 'Profil berhasil diperbarui!', type: 'success' });
      await fetchProfile();
      
      window.dispatchEvent(new Event('profileUpdated'));
      
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Terjadi kesalahan saat menyimpan profil.', 
        type: 'error' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      await updatePatientProfilePhoto(file);
      await fetchProfile(); 
      
      window.dispatchEvent(new Event('profileUpdated'));
      
      setMessage({ text: 'Foto profil berhasil diperbarui!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: 'Gagal mengunggah foto profil.', type: 'error' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
         <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
         <p className="text-gray-500 font-medium">Memuat profil...</p>
      </div>
    );
  }

  const displayId = profileData?.id ? `#SK-${profileData.id.substring(0, 4).toUpperCase()}` : '#SK-9921';
  
  let displayAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData?.name || 'Patient'}`;
  const rawPhotoUrl = profileData?.avatarUrl || profileData?.photoUrl;
  if (rawPhotoUrl) {
    displayAvatar = resolveImageUrl(rawPhotoUrl);
  }

  const handleImageError = (e) => {
    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData?.name || 'Patient'}`;
  };

  const joinedDate = formatJoinedDate(profileData?.createdAt);

  return (
    <div className="max-w-6xl pb-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Profile Settings</h1>
        <p className="text-gray-600">Manage your clinical credentials, personal information, and platform preferences for the MySkin diagnostic ecosystem.</p>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-xl font-medium text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="relative mb-4">
              <div className={`w-32 h-32 rounded-3xl overflow-hidden bg-gray-100 border-4 border-white shadow-sm ${isUploadingPhoto ? 'opacity-50' : ''}`}>
                <img 
                  src={displayAvatar} 
                  onError={handleImageError}
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <button 
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-sm hover:bg-blue-700 transition"
              >
                {isUploadingPhoto ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoChange} 
                className="hidden" 
                accept="image/jpeg, image/png" 
              />
            </div>
            
            <h2 className="text-xl font-extrabold text-gray-900 mb-1">{formData.name || 'Patient'}</h2>
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-8">Patient</p>

            <div className="w-full space-y-3">
              <div className="flex justify-between items-center bg-[#F8F9FA] px-4 py-3 rounded-xl">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clinic ID</span>
                <span className="text-sm font-bold text-gray-900">{displayId}</span>
              </div>
              <div className="flex justify-between items-center bg-[#F8F9FA] px-4 py-3 rounded-xl">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</span>
                <span className="text-sm font-bold text-gray-900">{joinedDate}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#F0F5FF] rounded-3xl p-6 border border-blue-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Practitioner Status</p>
                <p className="font-bold text-gray-900 text-sm">Verified Patient</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your patient account for the MySkin platform has been verified to access and view your Melanoma AI analysis results.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              General Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-2">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name} 
                  onChange={handleChange}
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl p-3.5 text-sm text-gray-900 font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-2">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email} 
                  readOnly
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl p-3.5 text-sm text-gray-500 font-medium outline-none cursor-not-allowed" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-2">Gender</label>
                <select 
                  name="gender"
                  value={formData.gender} 
                  onChange={handleChange}
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl p-3.5 text-sm text-gray-900 font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition appearance-none"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-2">Role</label>
                <input 
                  type="text" 
                  value="Patient" 
                  readOnly
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl p-3.5 text-sm text-gray-500 font-medium outline-none cursor-not-allowed" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-2">Phone Number</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone} 
                  onChange={handleChange}
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl p-3.5 text-sm text-gray-900 font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-2">Birth Date</label>
                <input 
                  type="date" 
                  name="birthDate"
                  value={formData.birthDate} 
                  onChange={handleChange}
                  className="w-full bg-[#F8F9FA] border border-transparent rounded-xl p-3.5 text-sm text-gray-900 font-medium outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-2">
            <button 
              onClick={handleDiscard}
              disabled={isSaving || isUploadingPhoto}
              className="px-6 py-3.5 text-blue-600 font-bold hover:bg-blue-50 rounded-xl transition disabled:opacity-50 text-sm"
            >
              Discard Changes
            </button>
            <LoadingButton 
              onClick={handleSave} 
              isLoading={isSaving}
              className="px-6 py-3.5 bg-[#0A58CA] text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm text-sm"
            >
              Save Profile Changes
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;