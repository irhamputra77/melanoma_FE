import React, { useState } from 'react';
import LoadingButton from '../../../components/common/LoadingButton';
import RecentScanCard from '../components/RecentScanCard';

const HistoricalListPage = () => {
  // ================= STATE MANAGEMENT =================
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ================= DUMMY DATA =================
  // Simulasi data historis (sesuai gambar)
  const dummyHistory = [
    { id: '1', scanId: '#SCAN-8892', date: 'July 15, 2024', title: 'Left Shoulder Analysis', status: 'Benign Recommendation', isVerified: true, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=100&q=80' },
    { id: '2', scanId: '#SCAN-8841', date: 'July 12, 2024', title: 'Forehead Pigment Check', status: 'Requires Professional Review', isVerified: false, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=100&q=80' },
    { id: '3', scanId: '#SCAN-8892', date: 'July 15, 2024', title: 'Left Shoulder Analysis', status: 'Benign Recommendation', isVerified: true, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=100&q=80' },
    { id: '4', scanId: '#SCAN-8841', date: 'July 12, 2024', title: 'Forehead Pigment Check', status: 'Requires Professional Review', isVerified: false, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=100&q=80' },
    { id: '5', scanId: '#SCAN-8892', date: 'July 15, 2024', title: 'Left Shoulder Analysis', status: 'Benign Recommendation', isVerified: true, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=100&q=80' },
    { id: '6', scanId: '#SCAN-8841', date: 'July 12, 2024', title: 'Forehead Pigment Check', status: 'Requires Professional Review', isVerified: false, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=100&q=80' },
  ];

  // ================= ACTION HANDLERS =================
  const handleDownloadHistory = async () => {
    setIsDownloading(true);

    /* === API READY CODE === 
    try {
      const response = await fetch('https://api.yourdomain.com/v1/patient/history/download', {
        method: 'GET',
        // headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Gagal mengunduh data');
      
      // Logika konversi response blob ke file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'case_history.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error downloading:', error);
    } finally {
      setIsDownloading(false);
    }
    ========================= */

    // Dummy Flow
    setTimeout(() => {
      setIsDownloading(false);
    }, 1500);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    /* === API READY CODE === 
    try {
      const response = await fetch('https://api.yourdomain.com/v1/patient/reports/generate', {
        method: 'POST',
        // headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Gagal membuat report');
      // Berhasil
    } catch (error) {
      console.error('Error generating:', error);
    } finally {
      setIsGenerating(false);
    }
    ========================= */

    // Dummy Flow
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  // ================= RENDER =================
  return (
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Historical Data</h1>
        <p className="text-gray-600 mb-6">Your AI-assisted monitoring log</p>
        
        <div className="flex flex-wrap gap-3">
          <LoadingButton 
            variant="white"
            onClick={handleDownloadHistory}
            isLoading={isDownloading}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download Case History
          </LoadingButton>
          
          <LoadingButton 
            onClick={handleGenerateReport}
            isLoading={isGenerating}
            className="px-5 py-2.5 bg-[#0A58CA] text-white font-medium rounded-lg hover:bg-blue-700 flex items-center shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Generate Report
          </LoadingButton>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-8">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name or Case ID..." 
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" 
          />
        </div>
        <div className="flex space-x-4">
          <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 shadow-sm flex items-center hover:bg-gray-50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg> 
            Status
          </button>
          <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 shadow-sm flex items-center hover:bg-gray-50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> 
            Date
          </button>
        </div>
      </div>

      {/* Data List (Menggunakan komponen RecentScanCard yang sama) */}
      <div className="space-y-4 mb-8">
        {dummyHistory.map((item) => (
          <RecentScanCard 
            key={item.id}
            id={item.id}
            scanId={item.scanId}
            date={item.date}
            title={item.title}
            status={item.status}
            isVerified={item.isVerified}
            image={item.image}
          />
        ))}
      </div>

      {/* Pagination & Footer */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-12 mb-8 text-sm text-gray-500 border-t border-gray-200 pt-8">
        <p className="mb-4 md:mb-0">Showing <span className="font-bold text-gray-900">1-6</span> of 1,240 records</p>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <button 
            onClick={() => setCurrentPage(1)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold shadow-sm transition ${currentPage === 1 ? 'bg-[#0A58CA] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            1
          </button>
          
          <button 
            onClick={() => setCurrentPage(2)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold shadow-sm transition ${currentPage === 2 ? 'bg-[#0A58CA] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            2
          </button>
          
          <button 
            onClick={() => setCurrentPage(currentPage + 1)}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400">
        <p>© 2026 MySkin The Clinical Atelier. AI-powered dermatology support.</p>
      </div>

    </div>
  );
};

export default HistoricalListPage;