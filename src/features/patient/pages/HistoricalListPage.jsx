import React, { useState, useEffect } from 'react';
import LoadingButton from '../../../components/common/LoadingButton';
import RecentScanCard from '../components/RecentScanCard';
import { getScanHistory } from '../services/patientService';

const formatDate = (dateString) => {
  if (!dateString) return new Date().toLocaleDateString();
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? new Date().toLocaleDateString() : d.toLocaleDateString();
};

const HistoricalListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [allHistoryList, setAllHistoryList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const response = await getScanHistory({ page: 1, limit: 100 });
      const dataArray = response.data || [];
      setAllHistoryList(dataArray);
      setFilteredList(dataArray);
    } catch (error) {
      console.error("Gagal memuat histori data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = allHistoryList;

    // Filter by Search (Case ID or Classification)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.id?.toLowerCase().includes(term) ||
        item.analysis?.classification?.toLowerCase().includes(term) ||
        item.classification?.toLowerCase().includes(term)
      );
    }

    // FIX: Filter by Status yang dikelompokkan dengan benar
    if (statusFilter) {
      result = result.filter(item => {
        const itemStatus = item.status?.toLowerCase() || '';
        const isVerifiedData = itemStatus === 'verified' || itemStatus === 'approved';

        if (statusFilter === 'verified') {
          return isVerifiedData; // Hanya ambil yang verified
        } else if (statusFilter === 'pending') {
          return !isVerifiedData; // Ambil SEMUA yang belum verified (reviewing, submitted, pending, dll)
        }
        return true;
      });
    }

    setFilteredList(result);
    setCurrentPage(1); 
  }, [searchTerm, statusFilter, allHistoryList]);

  const handleDownloadHistory = async () => {
    setIsDownloading(true);
    setTimeout(() => {
      alert("Permintaan pengunduhan data historis sedang diproses dan akan dikirim ke email.");
      setIsDownloading(false);
    }, 1500);
  };

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const currentItems = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-5xl mx-auto pb-10">
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
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-8">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Case ID or Classification..." 
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" 
          />
        </div>
        
        <div className="flex space-x-4">
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none px-6 py-3 pl-10 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-10"
            >
              <option value="">Semua Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
            <svg className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            <svg className="w-4 h-4 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500 font-medium">Memuat data histori...</div>
        ) : currentItems.length > 0 ? (
          currentItems.map((item) => (
            <RecentScanCard 
              key={item.id}
              id={item.id}
              scanId={`#SCAN-${item.id.substring(0,6).toUpperCase()}`}
              date={formatDate(item.createdAt)}
              title={item.analysis?.classification || item.classification || 'Skin Analysis'}
              status={item.statusLabel || item.status}
              isVerified={item.status === 'verified' || item.status === 'approved'}
              image={item.imageUrl}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-500 shadow-sm">
            Tidak ada riwayat scan yang cocok dengan filter.
          </div>
        )}
      </div>

      {!isLoading && filteredList.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 mb-8 text-sm text-gray-500 border-t border-gray-200 pt-8">
          <p className="mb-4 md:mb-0">Showing Page <span className="font-bold text-gray-900">{currentPage}</span> of {totalPages} (Total: {filteredList.length} records)</p>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
              disabled={currentPage === 1} 
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
              disabled={currentPage === totalPages} 
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalListPage;