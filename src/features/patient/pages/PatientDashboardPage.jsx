import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingButton from '../../../components/common/LoadingButton';
import RecentScanCard from '../components/RecentScanCard';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import {
  uploadPatientScan,
  analyzePatientScan,
  getRecentScans,
  getAvailableDoctors,
  submitVerificationRequest,
  getActiveConsultation,
} from '../services/patientService';

const formatDate = (dateString) => {
  if (!dateString) return new Date().toLocaleDateString();
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? new Date().toLocaleDateString() : d.toLocaleDateString();
};

const normalizeAvailableDoctor = (doctor = {}) => {
  const profile = doctor.doctorProfile || doctor.profile || {};
  const user = doctor.user || {};
  const userId = doctor.id || doctor.userId || doctor.doctorUserId || user.id || "";
  const doctorProfileId = doctor.doctorProfileId || doctor.doctorId || doctor.profileId || profile.id || user.doctorProfile?.id || "";
  
  // Mengambil status dari berbagai kemungkinan key JSON Backend
  const status = String(doctor.status || profile.status || profile.practitionerStatus?.status || doctor.practitionerStatus?.status || user.doctorProfile?.status || "").toLowerCase();
  const verificationStatus = String(doctor.verificationStatus || profile.verificationStatus || user.doctorProfile?.verificationStatus || status || "").toLowerCase();

  return {
    ...doctor,
    id: userId || doctorProfileId,
    name: doctor.name || doctor.fullName || user.name || user.fullName || "Doctor",
    specialty: doctor.specialty || doctor.specialization || profile.specialization || "Dermatologist",
    clinicName: doctor.clinicName || profile.clinicName || doctor.clinic?.name || profile.clinic?.name || "",
    avatarUrl: doctor.avatarUrl || doctor.photoUrl || profile.avatarUrl || profile.profilePhotoUrl || user.avatarUrl || "",
    status,
    verificationStatus,
  };
};

const PatientDashboardPage = () => {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [bodySite, setBodySite] = useState('');
  const [complaint, setComplaint] = useState('');

  const [currentScanId, setCurrentScanId] = useState(null);
  const [currentScanDisplayId, setCurrentScanDisplayId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  
  // State Dokter
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [activeConsultation, setActiveConsultation] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isLoadingActiveConsultation, setIsLoadingActiveConsultation] = useState(true);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fitur Crop
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRecentScans();
    fetchDoctors();
    fetchActiveConsultation();
    return () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); };
  }, [imagePreviewUrl]);

  const fetchRecentScans = async () => {
    try {
      const data = await getRecentScans({ page: 1, limit: 3 });
      setRecentScans(data.data || data || []);
    } catch (error) {
      console.error("Gagal memuat riwayat:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await getAvailableDoctors();
      const doctorsList = (data.data || data || [])
        .map(normalizeAvailableDoctor)
        .filter((doctor) => {
          return doctor.id && (
            doctor.status === 'active' || 
            doctor.verificationStatus === 'active' ||
            doctor.verificationStatus === 'verified' || 
            (!doctor.status && doctor.verificationStatus)
          );
        });
      
      setAvailableDoctors(doctorsList);
    } catch (error) {
      console.error("Gagal memuat daftar dokter:", error);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const fetchActiveConsultation = async () => {
    try {
      const consultation = await getActiveConsultation();
      setActiveConsultation(consultation);
    } catch (error) {
      console.error("Gagal memuat konsultasi aktif:", error);
    } finally {
      setIsLoadingActiveConsultation(false);
    }
  };

  const handleFileInput = (e) => {
    setErrorMessage('');
    setSuccessMessage('');
    setVerificationError('');
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setErrorMessage('Format file tidak didukung. Harap unggah format JPG atau PNG.');
        return;
      }
      setCurrentScanId(null);
      setCurrentScanDisplayId(null);
      setAnalysisResult(null);
      setSelectedDoctorId('');
      setSelectedFile(file);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(URL.createObjectURL(file));
      setIsCropping(false);
      setViewState('preview');
    }
  };

  const handleDeleteImage = () => {
    setSelectedFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setIsCropping(false);
    setBodySite('');
    setComplaint('');
    setCurrentScanId(null);
    setCurrentScanDisplayId(null);
    setAnalysisResult(null);
    setViewState('upload');
    setErrorMessage('');
    setVerificationError('');
    setSelectedDoctorId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      image,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0,
      completedCrop.width * scaleX, completedCrop.height * scaleY
    );
    canvas.toBlob((blob) => {
      if (!blob) return;
      const timestamp = new Date().getTime();
      const croppedFile = new File([blob], `cropped_image_${timestamp}.jpeg`, { type: "image/jpeg" });
      const croppedUrl = URL.createObjectURL(blob);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(croppedUrl);
      setSelectedFile(croppedFile);
      setIsCropping(false);
    }, 'image/jpeg');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    if (!bodySite.trim()) return setErrorMessage("Lokasi di tubuh wajib diisi.");
    if (complaint.trim().length < 5) return setErrorMessage("Keluhan minimal 5 karakter.");

    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      setCurrentScanId(null);
      setCurrentScanDisplayId(null);
      setAnalysisResult(null);

      const uploadData = await uploadPatientScan(selectedFile, complaint, bodySite);
      const scanId = uploadData.id || uploadData.scanId;
      const scanDisplayId = uploadData.scanId || uploadData.id;
      if (!scanId) {
        throw new Error('Upload berhasil, tetapi ID scan tidak ditemukan.');
      }
      setCurrentScanId(scanId);
      setCurrentScanDisplayId(scanDisplayId);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const rawResultData = await analyzePatientScan(scanId);
      const resultData = rawResultData?.analysis || rawResultData?.data || rawResultData;

      setAnalysisResult(resultData);
      setViewState('result');
      fetchRecentScans();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Gagal memproses gambar AI.');
      fetchRecentScans();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // DIKEMBALIKAN: Fungsi untuk Submit ke Dokter
  const handleRequestVerification = async () => {
    if (activeConsultation) {
      setVerificationError('Anda masih memiliki konsultasi aktif. Selesaikan case tersebut dengan dokter sebelum request ke dokter lain.');
      return;
    }
    if (!currentScanId || !selectedDoctorId) {
      setVerificationError('Silakan pilih dokter terlebih dahulu.');
      return;
    }
    setIsRequesting(true);
    setVerificationError('');
    setSuccessMessage('');

    try {
      await submitVerificationRequest({
        doctorUserId: selectedDoctorId,
        doctorId: selectedDoctorId,
        scanId: currentScanId,
        patientScanId: currentScanId,
        source: 'verification_request',
        createConsultation: false,
        triggerChatbot: false,
        autoStartChatbot: false,
      });
      fetchActiveConsultation();
      setSuccessMessage('Permintaan verifikasi berhasil dikirim ke Dokter. Anda akan diberi notifikasi.');
    } catch (error) {
      setVerificationError(error.response?.data?.message || 'Gagal mengirim permintaan verifikasi.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCloseSuccessPopup = () => {
    handleDeleteImage();
    setSuccessMessage('');
  };

  let confValue = Number(analysisResult?.aiConfidence || analysisResult?.confidence || 0);
  let displayConf = confValue > 1 ? confValue.toFixed(1) : (confValue * 100).toFixed(1);
  if (displayConf === "0.0") displayConf = "--";

  const safeClass = analysisResult?.aiPrediction || analysisResult?.classification || 'Unknown';
  const safeRisk = analysisResult?.riskLevel || (safeClass.toLowerCase().includes('malignant') ? 'HIGH' : 'LOW');
  const safeObs = analysisResult?.message || analysisResult?.observation || 'Analysis completed successfully.';
  const activeConsultationId = activeConsultation?.id || activeConsultation?.consultationId;
  const activeDoctorName = activeConsultation?.doctor?.name || activeConsultation?.doctorName || 'dokter Anda';
  const hasActiveConsultation = Boolean(activeConsultation);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">New Detection</h2>
            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">AI POWERED</span>
          </div>

          <div className={`relative rounded-2xl bg-gray-50 flex flex-col items-center justify-center mb-4 ${viewState === 'upload'
              ? 'border-2 border-dashed border-gray-200 h-72 overflow-hidden'
              : isCropping ? 'h-auto min-h-[300px]' : 'h-[300px] overflow-hidden'
            }`}>
            {viewState === 'upload' && (
              <div className="text-center cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current.click()}>
                <svg className="w-12 h-12 text-blue-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-gray-900 font-bold mb-1">Drop lesion image here</p>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/jpeg, image/png" />
              </div>
            )}

            {(viewState === 'preview' || viewState === 'result') && (
              <>
                {!isCropping ? (
                  <>
                    <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-contain bg-black" />
                    {viewState === 'preview' && (
                      <div className="absolute top-4 right-4 flex space-x-2 z-10">
                        <button onClick={() => setIsCropping(true)} className="bg-white/90 backdrop-blur p-2.5 rounded-lg text-blue-600 hover:bg-white shadow-sm transition" title="Potong Gambar">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        </button>
                        <button onClick={handleDeleteImage} className="bg-white/90 backdrop-blur p-2.5 rounded-lg text-red-500 hover:bg-white shadow-sm transition" title="Hapus Gambar">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center w-full bg-gray-900 p-6 rounded-2xl">
                    <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)}>
                      <img ref={imgRef} src={imagePreviewUrl} alt="Crop Area" className="max-h-[500px] w-auto object-contain" />
                    </ReactCrop>
                    <div className="flex space-x-4 mt-6">
                      <button onClick={() => setIsCropping(false)} className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-medium text-sm">Batal</button>
                      <button onClick={handleSaveCrop} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">Simpan Potongan</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {viewState === 'preview' && !isCropping && (
            <div className="mb-6 space-y-4 animate-fadeIn">
              <div>
                <label className="block text-gray-700 text-[11px] font-bold mb-2 tracking-widest uppercase">Lokasi di Tubuh</label>
                <input type="text" value={bodySite} onChange={(e) => { setBodySite(e.target.value); setErrorMessage(''); }} placeholder="Contoh: Lengan Kanan, Wajah..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-gray-700 text-[11px] font-bold mb-2 tracking-widest uppercase">Keluhan</label>
                <textarea value={complaint} onChange={(e) => { setComplaint(e.target.value); setErrorMessage(''); }} minLength={5} rows="3" placeholder="Jelaskan keluhan Anda..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 outline-none resize-none focus:border-blue-500"></textarea>
              </div>
            </div>
          )}

          {errorMessage && viewState !== 'result' && <p className="mb-4 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg font-medium shadow-sm">{errorMessage}</p>}

          <div className="flex justify-end">
            {viewState === 'preview' && !isCropping && (
              <LoadingButton onClick={handleAnalyze} isLoading={isAnalyzing} className="px-6 py-2.5 w-full md:w-auto">Start AI Analysis</LoadingButton>
            )}
            {viewState === 'result' && (
              <button onClick={handleDeleteImage} className="px-6 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition">Scan Baru</button>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Scan History</h3>
              <p className="text-sm text-gray-500">Your AI-assisted monitoring log</p>
            </div>
          </div>
          <div className="space-y-3">
            {isLoadingHistory ? (
              <div className="text-center py-6 text-sm text-gray-500">Memuat riwayat...</div>
            ) : recentScans.length > 0 ? (
              recentScans.map((scan) => (
                <RecentScanCard
                  key={scan.id}
                  id={scan.id}
                  scanId={`#${scan.scanId || scan.id.substring(0, 6).toUpperCase()}`}
                  date={formatDate(scan.createdAt || scan.uploadedAt)}
                  title={scan.aiPrediction || scan.classification || "Skin Analysis"}
                  image={scan.imageUrl}
                />
              ))
            ) : (
              <div className="text-center py-6 text-sm text-gray-500 bg-white rounded-2xl border border-gray-100">Belum ada riwayat deteksi.</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* PANEL HASIL AI */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          {viewState === 'result' && analysisResult ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${safeRisk === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {safeRisk} RISK
                </span>
                <span className="text-gray-500 text-xs font-medium">ID: #{currentScanDisplayId || currentScanId?.substring(0, 6).toUpperCase()}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{safeClass}</h2>
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-3xl font-extrabold text-[#0A58CA]">{displayConf}%</span>
                <span className="text-gray-500 text-sm font-medium">Confidence</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{safeObs}</p>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">UNKNOWN RISK</span>
                <span className="text-gray-400 text-xs font-medium">ID: -</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-300 mb-1">-</h2>
              <div className="w-16 h-8 bg-blue-50 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-100 rounded w-full"></div>
                <div className="h-2 bg-gray-100 rounded w-4/5"></div>
              </div>
            </>
          )}
        </div>
        
        {/* PANEL LAMA: SUBMIT TO DOCTOR (Radio Button) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-[380px]">
          <h3 className="text-lg font-bold text-gray-900 mb-1 shrink-0">Submit to Doctor</h3>
          <p className="text-xs text-gray-500 mb-4 shrink-0">Pilih pakar untuk memverifikasi hasil deteksi Anda.</p>
          
          <div className="flex-1 min-h-0 flex flex-col">
            <label className="block text-blue-600 text-[10px] font-bold mb-2 tracking-widest uppercase shrink-0">Select Active Dermatologist</label>

            {activeConsultation && (
              <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 shrink-0">
                Anda masih memiliki konsultasi aktif dengan {activeDoctorName}. Tutup case tersebut terlebih dahulu sebelum request dokter lain.
              </div>
            )}
            
            {/* Area Daftar Dokter yang bisa di-scroll */}
            <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 ${viewState !== 'result' || hasActiveConsultation ? 'opacity-50 pointer-events-none' : ''}`}>
              {isLoadingDoctors ? (
                <p className="text-xs text-gray-500">Memuat data dokter...</p>
              ) : availableDoctors.length > 0 ? (
                availableDoctors.map((doc) => (
                  <label key={doc.id} className={`flex items-center p-3 border rounded-xl cursor-pointer transition ${selectedDoctorId === doc.id ? 'border-blue-600 border-2 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <img src={doc.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.name}`} className="w-10 h-10 rounded-full bg-gray-100 mr-3 shrink-0" alt={doc.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500 truncate">{doc.specialty || 'Dermatologist'}</p>
                    </div>
                    {/* Menggunakan Radio Button kembali sesuai instruksi */}
                    <input type="radio" name="doctor" value={doc.id} checked={selectedDoctorId === doc.id} onChange={(e) => setSelectedDoctorId(e.target.value)} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border-4 shrink-0 ml-2 ${selectedDoctorId === doc.id ? 'border-blue-600 bg-white' : 'border-gray-300'}`}></div>
                  </label>
                ))
              ) : (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-xs text-red-600 font-medium">Tidak ada dokter aktif saat ini.</p>
                </div>
              )}
            </div>

            {verificationError && (
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 shrink-0">
                {verificationError}
              </div>
            )}

            {/* Tombol Submit di Bawah */}
            <LoadingButton 
              onClick={handleRequestVerification} 
              isLoading={isRequesting} 
              disabled={viewState !== 'result' || isRequesting || isLoadingActiveConsultation || hasActiveConsultation || !selectedDoctorId} 
              className="w-full py-3 mt-4 shrink-0"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> 
              Request Verification
            </LoadingButton>
            {activeConsultationId && (
              <button
                type="button"
                onClick={() => navigate(`/patient/messages/${activeConsultationId}`)}
                className="mt-2 w-full rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100"
              >
                Buka Konsultasi Aktif
              </button>
            )}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } 
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E5E7EB; border-radius: 20px; }
      ` }} />

      {successMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">Request Sent</h3>
            <p className="mt-3 text-sm font-medium leading-relaxed text-gray-600">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={handleCloseSuccessPopup}
              className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboardPage;
