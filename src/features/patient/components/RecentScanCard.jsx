import React from 'react';
import { useNavigate } from 'react-router-dom';

const resolveImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3300/api/v1';
  const baseUrl = apiUrl.split('/api')[0]; 
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// PROPS status dan isVerified DIHAPUS
const RecentScanCard = ({ id, scanId, date, title, image }) => {
  const navigate = useNavigate();
  const imgSrc = resolveImageUrl(image);

  const handleNavigate = () => {
    if (id) {
      navigate(`/patient/history-detail/${id}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigate();
    }
  };

  return (
    <div 
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer group"
    >
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200">
          <img src={imgSrc} alt="Scan thumbnail" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">
            {scanId} <span className="mx-1">•</span> {date}
          </p>
          <h4 className="text-gray-900 font-bold text-sm group-hover:text-blue-600 transition-colors">{title}</h4>
          {/* LABEL STATUS DI BAWAH JUDUL DIHAPUS */}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* LABEL PILL VERIFIED/PENDING DI KANAN DIHAPUS */}
        <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-600 group-hover:bg-[#EBF3FF] group-hover:text-[#0A58CA] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>
    </div>
  );
};

export default RecentScanCard;