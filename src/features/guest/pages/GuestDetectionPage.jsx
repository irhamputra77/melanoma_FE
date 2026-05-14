import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingButton from '../../../components/common/LoadingButton';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // Wajib di-import untuk styling bawaan crop

const DetectionPage = () => {
    const navigate = useNavigate();

    // ================= STATE MANAGEMENT =================
    const [viewState, setViewState] = useState('upload'); // 'upload' | 'preview' | 'result'

    // File states
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Crop states (Fitur FE Only)
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);

    // Loading states
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states (Untuk API Ready)
    const [complaint, setComplaint] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('Dr. Elena Aris - Senior Dermatologist');

    const fileInputRef = useRef(null);

    // Cleanup URL object saat komponen unmount untuk mencegah memory leak
    useEffect(() => {
        return () => {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        };
    }, [imagePreviewUrl]);

    // ================= UPLOAD HANDLERS =================
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        setErrorMessage('');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e) => {
        setErrorMessage('');
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/heic'];
        const maxSize = 20 * 1024 * 1024; // 20MB

        if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
            setErrorMessage('Format file tidak didukung. Harap unggah format JPG, PNG, atau HEIC.');
            return;
        }

        if (file.size > maxSize) {
            setErrorMessage('Ukuran file terlalu besar. Maksimal ukuran file adalah 20MB.');
            return;
        }

        setSelectedFile(file);
        const newPreviewUrl = URL.createObjectURL(file);
        setImagePreviewUrl(newPreviewUrl);
        setViewState('preview');
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleDeleteImage = () => {
        setSelectedFile(null);
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
        setIsCropping(false);
        setViewState('upload');
    };

    // ================= CROP HANDLER (FRONTEND ONLY) =================
    const handleSaveCrop = async () => {
        if (!completedCrop || !imgRef.current) return;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        
        // Menyesuaikan rasio gambar asli vs gambar yang ditampilkan di layar
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        const ctx = canvas.getContext('2d');

        // Render potongan gambar ke canvas
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY
        );

        // Ekstrak canvas kembali menjadi File baru
        canvas.toBlob((blob) => {
            if (!blob) return;
            const croppedFile = new File([blob], "cropped_image.jpeg", { type: "image/jpeg" });
            const croppedUrl = URL.createObjectURL(blob);
            
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); // Bersihkan memory URL lama
            setImagePreviewUrl(croppedUrl);
            setSelectedFile(croppedFile);
            setIsCropping(false);
        }, 'image/jpeg');
    };

    // ================= ACTION HANDLERS (API READY & DUMMY FLOW) =================
    const handleAnalyze = async () => {
        if (!selectedFile) {
            setErrorMessage('Harap unggah gambar terlebih dahulu.');
            setViewState('upload');
            return;
        }

        setIsAnalyzing(true);

        /* === API READY CODE === 
        try {
          const formData = new FormData();
          formData.append('image', selectedFile);
          const response = await fetch('https://api.yourdomain.com/v1/analyze', {
            method: 'POST', body: formData,
          });
          if (!response.ok) throw new Error('Gagal menganalisis gambar');
          const data = await response.json();
          setViewState('result');
        } catch (error) {
          setErrorMessage(error.message || 'Terjadi kesalahan sistem.');
        } finally {
          setIsAnalyzing(false);
        }
        ========================= */

        setTimeout(() => {
            setIsAnalyzing(false);
            setViewState('result');
        }, 2500);
    };

    const handleSubmitVerification = async () => {
        setIsSubmitting(true);

        /* === API READY CODE === 
        try {
          const payload = { complaint, doctor: selectedDoctor };
          const response = await fetch('https://api.yourdomain.com/v1/verifications', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error('Gagal mengirim verifikasi');
          navigate('/auth/login');
        } catch (error) {
          alert(error.message || 'Gagal mengirim data.');
        } finally {
          setIsSubmitting(false);
        }
        ========================= */

        setTimeout(() => {
            setIsSubmitting(false);
            navigate('/auth/login');
        }, 1500);
    };

    // ================= RENDER =================
    return (
        <div className="w-full bg-[#F8F9FA] min-h-screen pt-10 pb-24">
            <div className="max-w-4xl mx-auto px-6 md:px-8">

                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                        Dermatological Analysis
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl max-w-2xl leading-relaxed">
                        Securely upload high-resolution images for AI-powered lesion screening. Our models are trained on over 50,000 clinical dermatoscopy cases.
                    </p>
                </div>

                {/* ==================== VIEW 1: UPLOAD AREA ==================== */}
                {viewState === 'upload' && (
                    <>
                        {/* Kode View Upload tetap sama... */}
                        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 mb-8">
                            <div
                                className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-20 px-6 text-center transition-colors duration-300 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="w-16 h-16 bg-[#EBF3FF] text-[#0A58CA] rounded-2xl flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Drag & drop lesion image</h3>
                                <p className="text-gray-500 text-sm mb-8">Supports JPG, PNG or HEIC (Max 20MB)</p>
                                <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/jpeg, image/png, .heic" />
                                <button onClick={triggerFileInput} className="bg-[#0A58CA] text-white py-3 px-8 rounded-lg font-medium hover:bg-blue-700 transition">Browse Files</button>
                                {errorMessage && <p className="mt-4 text-sm text-red-500 font-medium bg-red-50 py-2 px-4 rounded-lg">{errorMessage}</p>}
                            </div>
                        </div>

                        <div className="bg-[#F0F2F5] rounded-2xl p-6 flex items-start gap-4">
                            <svg className="w-6 h-6 text-[#0A58CA] flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            <div>
                                <h4 className="text-gray-900 font-bold mb-2">For Best Results</h4>
                                <ul className="text-gray-600 text-sm space-y-1">
                                    <li>✓ Ensure even, bright lighting without harsh shadows.</li>
                                    <li>✓ Keep the camera parallel to the skin surface.</li>
                                </ul>
                            </div>
                        </div>
                    </>
                )}

                {/* ==================== VIEW 2: IMAGE PREVIEW & CROP ==================== */}
                {viewState === 'preview' && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-fadeIn">
                        <div className="relative rounded-2xl overflow-hidden mb-6 bg-gray-100 flex flex-col items-center justify-center min-h-[400px]">
                            
                            {!isCropping ? (
                                <>
                                    {/* object-contain agar gambar ter-fit utuh */}
                                    {imagePreviewUrl && (
                                        <img src={imagePreviewUrl} alt="Lesion Preview" className="w-full h-auto max-h-[500px] object-contain" />
                                    )}

                                    <div className="absolute top-4 right-4 flex space-x-2 z-10">
                                        <button onClick={() => setIsCropping(true)} className="bg-white/90 backdrop-blur p-2.5 rounded-lg text-blue-600 hover:bg-white shadow-sm transition" title="Potong Gambar">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                        </button>
                                        <button onClick={handleDeleteImage} className="bg-white/90 backdrop-blur p-2.5 rounded-lg text-red-500 hover:bg-white shadow-sm transition" title="Hapus Gambar">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center w-full bg-gray-900 p-6">
                                    <ReactCrop
                                        crop={crop}
                                        onChange={(c) => setCrop(c)}
                                        onComplete={(c) => setCompletedCrop(c)}
                                    >
                                        <img 
                                            ref={imgRef} 
                                            src={imagePreviewUrl} 
                                            alt="Crop Area" 
                                            className="max-h-[500px] w-auto object-contain"
                                        />
                                    </ReactCrop>
                                    <div className="flex space-x-4 mt-6">
                                        <button onClick={() => setIsCropping(false)} className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-medium">Batal</button>
                                        <button onClick={handleSaveCrop} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">Simpan Potongan</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isCropping && (
                            <LoadingButton
                                onClick={handleAnalyze}
                                isLoading={isAnalyzing}
                                className="w-full py-4 text-lg"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                Analyze Scan
                            </LoadingButton>
                        )}
                    </div>
                )}

                {/* ==================== VIEW 3: ANALYSIS RESULT ==================== */}
                {viewState === 'result' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                            {/* Gambar Kiri (Tombol Crop Dihapus) */}
                            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 h-full">
                                <div className="relative rounded-2xl overflow-hidden h-full min-h-[300px] bg-gray-100 flex items-center justify-center">
                                    {imagePreviewUrl && (
                                        <img src={imagePreviewUrl} alt="Analyzed Lesion" className="w-full h-full absolute inset-0 object-contain" />
                                    )}
                                    <div className="absolute top-4 right-4 flex space-x-2 z-10">
                                        <button onClick={handleDeleteImage} className="bg-white/90 backdrop-blur p-2.5 rounded-lg text-red-500 hover:bg-white shadow-sm transition" title="Hapus Gambar">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full tracking-wider">HIGH RISK</span>
                                        <span className="text-gray-500 text-sm font-medium">ID: #SK-8821</span>
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Melanoma</h2>
                                    <div className="flex items-baseline space-x-2 mb-6">
                                        <span className="text-4xl font-extrabold text-[#0A58CA]">94.2%</span>
                                        <span className="text-gray-500 font-medium">Confidence</span>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        The analysis indicates significant atypical network patterns and regression structures. This lesion exhibits architectural disorder consistent with superficial spreading melanoma.
                                    </p>
                                </div>

                                <div className="bg-[#F0F5FF] rounded-2xl p-6 border border-blue-100">
                                    <h4 className="text-[#0A58CA] font-bold mb-2">Urgent Recommendation</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Due to the high confidence score, we recommend a physical biopsy within the next 48-72 hours. Digital analysis is a screening tool and does not replace a clinical diagnosis.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Verification Tetap Sama */}
                        <div className="bg-[#F8F9FA] rounded-3xl p-8 shadow-sm border border-gray-200 mt-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Submit for Medical Verification</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-blue-600 text-xs font-bold mb-2 tracking-widest uppercase">Complaint</label>
                                    <textarea
                                        rows="4"
                                        value={complaint}
                                        onChange={(e) => setComplaint(e.target.value)}
                                        className="w-full bg-gray-100 border-transparent rounded-xl p-4 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none resize-none"
                                        placeholder="Describe clinical observations, patient history, or specific concerns..."
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-blue-600 text-xs font-bold mb-2 tracking-widest uppercase">Choose Doctor</label>
                                    <div className="relative">
                                        <select
                                            value={selectedDoctor}
                                            onChange={(e) => setSelectedDoctor(e.target.value)}
                                            className="w-full bg-gray-100 border-transparent rounded-xl p-4 text-gray-900 appearance-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none font-medium"
                                        >
                                            <option value="Dr. Elena Aris - Senior Dermatologist">Dr. Elena Aris - Senior Dermatologist</option>
                                            <option value="Dr. Marcus Chen - Dermatologist">Dr. Marcus Chen - Dermatologist</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <LoadingButton
                                    onClick={handleSubmitVerification}
                                    isLoading={isSubmitting}
                                    variant="white"
                                    className="w-full py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 border-none shadow-none font-bold mt-4"
                                >
                                    Submit Verification
                                </LoadingButton>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}} />
        </div>
    );
};

export default DetectionPage;
