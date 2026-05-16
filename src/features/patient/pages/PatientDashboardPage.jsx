import React, { useState, useRef, useEffect } from 'react';
import LoadingButton from '../../../components/common/LoadingButton';
import RecentScanCard from '../components/RecentScanCard';
import {
  uploadPatientScan,
  analyzePatientScan,
  sharePatientScan,
  getRecentScans,
  getAvailableDoctors
} from '../services/patientService';

const PatientDashboardPage = () => {
  const [viewState, setViewState] = useState('upload'); // 'upload' | 'preview' | 'result'
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Data Input Scan Baru
  const [bodySite, setBodySite] = useState('');
  const [complaint, setComplaint] = useState('');

  // State Data API
  const [currentScanId, setCurrentScanId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);

  // Form State Submit
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // Loading & Error States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRecentScans();
    fetchDoctors();

    // Cleanup memory URL saat unmount
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
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
      const doctorsList = data.data || data || [];
      setAvailableDoctors(doctorsList);
      if (doctorsList.length > 0) {
        setSelectedDoctorId(doctorsList[0].id);
      }
    } catch (error) {
      console.error("Gagal memuat daftar dokter:", error);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const handleFileInput = (e) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setErrorMessage('Format file tidak didukung. Harap unggah format JPG atau PNG.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Ukuran file maksimal adalah 10MB.');
        return;
      }

      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setViewState('preview');
    }
  };

  // Handler untuk menghapus gambar dan reset form sebelum scan
  const handleDeleteImage = () => {
    setSelectedFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setBodySite('');
    setComplaint('');
    setViewState('upload');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    if (!bodySite.trim()) {
      setErrorMessage("Lokasi di tubuh (Body Site) wajib diisi.");
      return;
    }
    if (complaint.trim().length < 5) {
      setErrorMessage("Keluhan (Complaint) minimal terdiri dari 5 karakter.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      let scanId = currentScanId;

      // 1. Upload jika belum ada scanId
      if (!scanId) {
        console.log("📤 Mengunggah gambar baru...");
        const uploadData = await uploadPatientScan(selectedFile, complaint, bodySite);
        scanId = uploadData.id;
        setCurrentScanId(scanId);
        console.log("✅ Gambar berhasil diunggah. Scan ID:", scanId);

        // Jeda 1 detik untuk memberi waktu database backend melakukan commit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 2. Lakukan Analisis AI
      console.log(`🧠 Memulai analisis AI untuk ID: ${scanId}...`);
      const resultData = await analyzePatientScan(scanId);

      console.log("✅ Analisis Berhasil:", resultData);
      setAnalysisResult(resultData);
      setViewState('result');

      fetchRecentScans();
    } catch (error) {
      console.error("❌ Error Detail:", error.response?.data || error.message);

      const msg = error.response?.data?.message || 'Gagal memproses gambar AI.';
      setErrorMessage(`${msg} Silakan coba klik 'Start AI Analysis' lagi.`);

      // Tetap refresh history agar user bisa melihat status data yang sudah masuk
      fetchRecentScans();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!currentScanId || !selectedDoctorId) return;
    setIsRequesting(true);
    setErrorMessage('');

    try {
      await sharePatientScan(currentScanId, {
        doctorId: selectedDoctorId
        // Complaint sudah tidak dikirim ke sini karena sudah disimpan saat Upload
      });

      setSuccessMessage('Permintaan verifikasi berhasil dikirim ke Dokter.');
      setTimeout(() => {
        setViewState('upload');
        setImagePreviewUrl(null);
        setSelectedFile(null);
        setCurrentScanId(null);
        setAnalysisResult(null);
        setBodySite('');
        setComplaint('');
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Gagal mengirim permintaan verifikasi. Silakan coba lagi.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      {/* KIRI: Upload, Preview, & History */}
      <div className="lg:col-span-2 space-y-8">

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">New Detection</h2>
            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">AI POWERED</span>
          </div>

          {successMessage && <p className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded-lg font-medium">{successMessage}</p>}

          <div className={`relative rounded-2xl overflow-hidden bg-gray-50 flex flex-col items-center justify-center mb-4 ${viewState === 'upload' ? 'border-2 border-dashed border-gray-200 h-72' : 'h-[300px]'}`}>
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
                <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-contain bg-black" />

                {/* Tombol Delete Gambar */}
                {viewState === 'preview' && (
                  <div className="absolute top-4 right-4 flex space-x-2 z-10">
                    <button
                      onClick={handleDeleteImage}
                      className="bg-white/90 backdrop-blur p-2.5 rounded-lg text-red-500 hover:bg-white shadow-sm transition"
                      title="Hapus Gambar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* FORM COMPLAINT & BODY SITE (Muncul di fase Preview) */}
          {viewState === 'preview' && (
            <div className="mb-6 space-y-4 animate-fadeIn">
              <div>
                <label className="block text-gray-700 text-[11px] font-bold mb-2 tracking-widest uppercase">Lokasi di Tubuh (Body Site)</label>
                <input
                  type="text"
                  value={bodySite}
                  onChange={(e) => setBodySite(e.target.value)}
                  placeholder="Contoh: Lengan Kanan, Wajah, Punggung..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-[11px] font-bold mb-2 tracking-widest uppercase">Keluhan (Complaint)</label>
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  rows="3"
                  placeholder="Jelaskan detail keluhan Anda (minimal 5 karakter)..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none transition"
                ></textarea>
              </div>
            </div>
          )}

          {errorMessage && <p className="mb-4 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg font-medium shadow-sm">{errorMessage}</p>}

          <div className="flex justify-end">
            {viewState === 'preview' && (
              <LoadingButton onClick={handleAnalyze} isLoading={isAnalyzing} className="px-6 py-2.5 w-full md:w-auto">
                Start AI Analysis
              </LoadingButton>
            )}
            {viewState === 'result' && (
              <button onClick={handleDeleteImage} className="px-6 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition">
                Scan Baru
              </button>
            )}
          </div>
        </div>

        {/* Recent History List */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Scan History</h3>
              <p className="text-sm text-gray-500">Your AI-assisted monitoring log</p>
            </div>
            <button className="text-blue-600 text-sm font-bold hover:underline">See More</button>
          </div>

          <div className="space-y-3">
            {isLoadingHistory ? (
              <div className="text-center py-6 text-sm text-gray-500">Memuat riwayat...</div>
            ) : recentScans.length > 0 ? (
              recentScans.map((scan) => (
                <RecentScanCard
                  key={scan.id}
                  id={scan.id}
                  scanId={`#SCAN-${scan.id.substring(0, 6).toUpperCase()}`}
                  date={new Date(scan.createdAt).toLocaleDateString()}
                  title={scan.analysis?.classification || "Skin Analysis"}
                  status={scan.statusLabel || scan.status}
                  isVerified={scan.status === 'verified'}
                  image={scan.imageUrl}
                />
              ))
            ) : (
              <div className="text-center py-6 text-sm text-gray-500 bg-white rounded-2xl border border-gray-100">Belum ada riwayat deteksi.</div>
            )}
          </div>
        </div>
      </div>

      {/* KANAN: Result & Form Verifikasi */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          {viewState === 'result' && analysisResult ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${analysisResult.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {analysisResult.riskLevel || 'ANALYZED'}
                </span>
                <span className="text-gray-500 text-xs font-medium">ID: #{currentScanId?.substring(0, 6).toUpperCase()}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{analysisResult.classification || 'Unknown'}</h2>
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-3xl font-extrabold text-[#0A58CA]">{analysisResult.confidence ? `${(analysisResult.confidence * 100).toFixed(1)}%` : '--%'}</span>
                <span className="text-gray-500 text-sm font-medium">Confidence</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {analysisResult.observation || 'Analysis completed successfully. Awaiting professional medical review.'}
              </p>

              {/* Menampilkan Data yang Diinput User */}
              <div className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Lokasi: {bodySite}</p>
                <p className="text-gray-800 italic">"{complaint}"</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">UNKNOWN</span>
                <span className="text-gray-400 text-xs font-medium">ID: -</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-300 mb-1">-</h2>
              <div className="w-16 h-8 bg-blue-50 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-2 bg-gray-100 rounded w-full"></div>
                <div className="h-2 bg-gray-100 rounded w-4/5"></div>
                <div className="h-2 bg-gray-100 rounded w-3/4"></div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Submit to Doctor</h3>
          <p className="text-xs text-gray-500 mb-6">Pilih pakar untuk memverifikasi hasil deteksi Anda.</p>

          <div className="space-y-5">
            <div>
              <label className="block text-blue-600 text-[10px] font-bold mb-3 tracking-widest uppercase">Select Dermatologist</label>
              <div className={`space-y-2 ${viewState !== 'result' ? 'opacity-50 pointer-events-none' : ''}`}>
                {isLoadingDoctors ? (
                  <p className="text-xs text-gray-500">Memuat data dokter...</p>
                ) : availableDoctors.length > 0 ? (
                  availableDoctors.map((doc) => (
                    <label key={doc.id} className={`flex items-center p-3 border rounded-xl cursor-pointer transition ${selectedDoctorId === doc.id ? 'border-blue-600 border-2 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                      <img src={doc.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.name}`} className="w-10 h-10 rounded-full bg-gray-100 mr-3" alt={doc.name} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.specialty || 'Dermatologist'}</p>
                      </div>
                      <input type="radio" name="doctor" value={doc.id} checked={selectedDoctorId === doc.id} onChange={(e) => setSelectedDoctorId(e.target.value)} className="hidden" />
                      <div className={`w-4 h-4 rounded-full border-4 ${selectedDoctorId === doc.id ? 'border-blue-600 bg-white' : 'border-gray-300'}`}></div>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-red-500">Tidak ada dokter yang tersedia saat ini.</p>
                )}
              </div>
            </div>

            <LoadingButton
              onClick={handleRequestVerification}
              isLoading={isRequesting}
              disabled={viewState !== 'result' || isRequesting || !selectedDoctorId}
              className="w-full py-3 mt-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              Request Verification
            </LoadingButton>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}} />
    </div>
  );
};

export default PatientDashboardPage;
