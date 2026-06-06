import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RecentScanCard from '../components/RecentScanCard';
import { getScanHistory } from '../services/patientService';

const formatDate = (dateString) => {
  if (!dateString) return new Date().toLocaleDateString();
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? new Date().toLocaleDateString() : d.toLocaleDateString();
};

const HistoricalListPage = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
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
      const dataArray = response?.data || response?.scans || response?.history || [];
      setAllHistoryList(Array.isArray(dataArray) ? dataArray : []);
      setFilteredList(Array.isArray(dataArray) ? dataArray : []);
    } catch (error) {
      console.error('Gagal memuat data histori:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = allHistoryList;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        return (
          item.id?.toLowerCase().includes(term) ||
          item.scanId?.toLowerCase().includes(term) ||
          item.analysis?.classification?.toLowerCase().includes(term) ||
          item.classification?.toLowerCase().includes(term) ||
          item.aiPrediction?.toLowerCase().includes(term)
        );
      });
    }

    setFilteredList(result);
    setCurrentPage(1);
  }, [searchTerm, allHistoryList]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const currentItems = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Historical Data</h1>
        <p className="text-gray-600 mb-6">Your AI-assisted monitoring log</p>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-8">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by Case ID or Classification..." className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500 font-medium">Memuat data histori...</div>
        ) : currentItems.length > 0 ? (
          currentItems.map((item) => {
            return (
              <div key={item.id} className="relative group">
                {item.consultation && item.consultation.status !== 'CLOSED' && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/patient/messages/${item.consultation.id}`); }} title="Go to Chat" className="absolute -top-3 -right-2 z-10 bg-[#0A58CA] text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center shadow-md hover:bg-blue-700 transition-colors cursor-pointer border-2 border-white">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> Active Chat
                  </button>
                )}
                <RecentScanCard
                  id={item.id}
                  scanId={`#SCAN-${String(item.scanId || item.id).substring(0, 6).toUpperCase()}`}
                  date={formatDate(item.createdAt || item.created_at || item.updatedAt)}
                  title={item.analysis?.classification || item.classification || item.aiPrediction || 'Skin Analysis'}
                  image={item.imageUrl}
                />
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-500 shadow-sm">Tidak ada riwayat scan yang cocok dengan filter.</div>
        )}
      </div>

      {!isLoading && filteredList.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 mb-8 text-sm text-gray-500 border-t border-gray-200 pt-8">
          <p className="mb-4 md:mb-0">Showing Page <span className="font-bold text-gray-900">{currentPage}</span> of {totalPages} (Total: {filteredList.length} records)</p>
          <div className="flex space-x-2">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalListPage;