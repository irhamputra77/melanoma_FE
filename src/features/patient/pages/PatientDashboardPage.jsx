import React, { useState, useRef } from 'react';
import LoadingButton from '../../../components/common/LoadingButton';
import RecentScanCard from '../components/RecentScanCard';

const PatientDashboardPage = () => {
  // State: 'upload' | 'preview' | 'result'
  const [viewState, setViewState] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const fileInputRef = useRef(null);

  // --- Handlers Upload (Mirip Guest Detection) ---
  const handleFileInput = (e) => {
    setErrorMessage('');
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png'];
      
      if (!validTypes.includes(file.type)) {
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

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    /* API READY:
    const formData = new FormData();
    formData.append('image', selectedFile);
    await fetch('/api/analyze', { method: 'POST', body: formData });
    */
    setTimeout(() => {
      setIsAnalyzing(false);
      setViewState('result');
    }, 2000);
  };

  const handleRequestVerification = async () => {
    setIsRequesting(true);
    /* API READY:
    await fetch('/api/request-verification', { method: 'POST', body: JSON.stringify({...}) });
    */
    setTimeout(() => {
      setIsRequesting(false);
      // Reset after success
      setViewState('upload');
      setImagePreviewUrl(null);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      
      {/* KIRI: Upload & History */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Detection Area */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">New Detection</h2>
            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">AI POWERED</span>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 h-72 flex flex-col items-center justify-center mb-4">
            {viewState === 'upload' && (
              <div className="text-center cursor-pointer" onClick={() => fileInputRef.current.click()}>
                <svg className="w-12 h-12 text-blue-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-gray-900 font-bold mb-1">Drop lesion image here</p>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                <input type="file" ref={fileInputRef} onChange={handleFileInput} className="hidden" accept="image/jpeg, image/png" />
              </div>
            )}
            
            {(viewState === 'preview' || viewState === 'result') && (
              <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
            )}
            
            {errorMessage && <p className="absolute bottom-4 text-sm text-red-500 bg-red-50 px-3 py-1 rounded">{errorMessage}</p>}
          </div>

          <div className="flex justify-end">
            {viewState === 'preview' && (
              <LoadingButton onClick={handleAnalyze} isLoading={isAnalyzing} className="px-6 py-2.5">
                Start AI Analysis
              </LoadingButton>
            )}
            {viewState === 'result' && (
              <button onClick={() => { setViewState('upload'); setImagePreviewUrl(null); }} className="px-6 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Recent History */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Scan History</h3>
              <p className="text-sm text-gray-500">Your AI-assisted monitoring log</p>
            </div>
            <button className="text-blue-600 text-sm font-bold hover:underline">See More</button>
          </div>
          
          <div className="space-y-3">
            <RecentScanCard id="1" scanId="#SCAN-8892" date="July 15, 2024" title="Left Shoulder Analysis" status="Benign Recommendation" isVerified={true} image="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=100&q=80" />
            <RecentScanCard id="2" scanId="#SCAN-8841" date="July 12, 2024" title="Forehead Pigment Check" status="Requires Professional Review" isVerified={false} image="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=100&q=80" />
          </div>
        </div>
      </div>

      {/* KANAN: Result & Form */}
      <div className="space-y-6">
        
        {/* Result Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          {viewState === 'result' ? (
             <>
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">HIGH RISK</span>
                  <span className="text-gray-500 text-xs font-medium">ID: #SK-8821</span>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Melanoma</h2>
                <div className="flex items-baseline space-x-2 mb-4">
                  <span className="text-3xl font-extrabold text-[#0A58CA]">94.2%</span>
                  <span className="text-gray-500 text-sm font-medium">Confidence</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  The analysis indicates significant atypical network patterns and regression structures. This lesion exhibits architectural disorder consistent with superficial spreading melanoma.
                </p>
             </>
          ) : (
            // Placeholder State
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

        {/* Submit to Doctor Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Submit to Doctor</h3>
          <p className="text-xs text-gray-500 mb-6">Get a verified diagnosis from our network of expert dermatologists.</p>
          
          <div className="space-y-5">
            <div>
              <label className="block text-blue-600 text-[10px] font-bold mb-2 tracking-widest uppercase">Describe Concerns</label>
              <textarea 
                disabled={viewState !== 'result'}
                rows="3" 
                className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none disabled:opacity-50"
                placeholder="Tell the doctor about any changes you've noticed..."
              ></textarea>
            </div>
            
            <div>
              <label className="block text-blue-600 text-[10px] font-bold mb-2 tracking-widest uppercase">Select Dermatologist</label>
              <div className={`space-y-2 ${viewState !== 'result' ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="flex items-center p-3 border-2 border-blue-600 rounded-xl cursor-pointer">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elena" className="w-10 h-10 rounded-full bg-gray-100 mr-3" alt="Dr Elena" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Dr. Elena Aris</p>
                    <p className="text-xs text-gray-500">Skin Cancer Specialist</p>
                  </div>
                  <div className="w-4 h-4 rounded-full border-4 border-blue-600"></div>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" className="w-10 h-10 rounded-full bg-gray-100 mr-3" alt="Dr Marcus" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Dr. Marcus Vance</p>
                    <p className="text-xs text-gray-500">Medical Aesthetician</p>
                  </div>
                  <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                </label>
              </div>
            </div>

            <LoadingButton 
              onClick={handleRequestVerification}
              isLoading={isRequesting}
              disabled={viewState !== 'result'}
              className="w-full py-3 mt-2"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              Request Verification
            </LoadingButton>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientDashboardPage;