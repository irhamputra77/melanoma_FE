import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecentScanCard = ({ scanId, date, title, status, isVerified, image }) => {
  const navigate = useNavigate();

  // Handler navigasi
  const handleNavigate = () => {
    navigate(`/patient/history-detail`);
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
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
          <img src={image} alt="Scan thumbnail" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">
            {scanId} <span className="mx-1">•</span> {date}
          </p>
          <h4 className="text-gray-900 font-bold text-sm mb-1 group-hover:text-blue-600 transition-colors">{title}</h4>
          <div className="flex items-center">
            {isVerified ? (
              <span className="flex items-center text-green-600 text-xs font-medium">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                {status}
              </span>
            ) : (
              <span className="flex items-center text-orange-500 text-xs font-medium">
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {status}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isVerified ? 'VERIFIED' : 'PENDING'}
        </span>
        
        <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-600 group-hover:bg-[#EBF3FF] group-hover:text-[#0A58CA] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>
    </div>
  );
};

export default RecentScanCard;
