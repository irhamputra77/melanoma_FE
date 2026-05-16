import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LoadingButton from '../../../components/common/LoadingButton';
import { getPatientScanDetail, sharePatientScan, exportScanPdf } from '../services/patientService';

// Helper murni tanpa fallback
const resolveImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3300/api/v1';
  const baseUrl = apiUrl.split('/api')[0]; 
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const HistoricalDetailPage = () => {
  const { id } = useParams();
  const [scanDetail, setScanDetail] = useState(null);
  const [imgSrc, setImgSrc] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await getPatientScanDetail(id);
        setScanDetail(data);
        // Langsung parsing image dari API response
        setImgSrc(resolveImageUrl(data.imageUrl)); 
      } catch (error) {
        setErrorMessage(error.response?.data?.message || 'Gagal memuat detail data historis.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await sharePatientScan(id, { action: 'export_share' });
      alert("Berhasil membagikan data kepada spesialis.");
    } catch (error) {
      alert(error.response?.data?.message || "Terjadi kesalahan saat membagikan data.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const blob = await exportScanPdf(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Scan_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Gagal mengunduh file PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
           <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
           <p className="text-gray-500 font-medium">Memuat data medis...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) return <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-xl">{errorMessage}</div>;
  if (!scanDetail) return <div className="p-8 text-center text-gray-500">Data rekam medis tidak ditemukan.</div>;

  const formattedDate = new Date(scanDetail.createdAt).toLocaleString();
  const isVerified = scanDetail.status === 'verified' || scanDetail.status === 'approved';

  let confValue = Number(scanDetail.aiConfidence || scanDetail.analysis?.confidence || 0);
  let displayConf = confValue > 1 ? confValue.toFixed(1) : (confValue * 100).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Record #{scanDetail.scanId || scanDetail.id?.substring(0,8).toUpperCase()}</h1>
          <p className="text-gray-600">Scan conducted on {formattedDate}. Location: {scanDetail.bodySite || 'Unknown'}.</p>
        </div>
        <div className="flex space-x-3">
          <LoadingButton 
            variant="white"
            onClick={handleExportPdf}
            isLoading={isExporting}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export PDF
          </LoadingButton>
          <LoadingButton 
            onClick={handleShare}
            isLoading={isSharing}
            className="px-4 py-2"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Share with Specialist
          </LoadingButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="relative rounded-3xl overflow-hidden shadow-sm h-[450px] bg-[#0d0d0d] border border-gray-200">
            {/* GAMBAR LANGSUNG DI-LOAD DARI API */}
            {imgSrc ? (
                <img src={imgSrc} alt="Lesion" className="w-full h-full object-contain p-2" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">Image data not available</div>
            )}
            <span className="absolute bottom-6 left-6 bg-white/90 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg tracking-wider">ORIGINAL CAPTURE</span>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">AI Result Breakdown</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-2xl border-b-2 border-blue-600">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Confidence</p>
                <p className="text-2xl font-extrabold text-[#0A58CA]">
                  {displayConf === "0.0" ? '--%' : `${displayConf}%`}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Prediction</p>
                <p className="text-2xl font-bold text-gray-900">{scanDetail.aiPrediction || scanDetail.analysis?.classification || '-'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Type</p>
                <p className="text-2xl font-bold text-gray-900">{scanDetail.analysis?.type || '-'}</p>
              </div>
            </div>
            <div className="bg-[#F8F9FA] p-4 rounded-xl text-sm text-gray-600 leading-relaxed border border-gray-100">
              <span className="text-[#0A58CA] font-bold">Patient Complaint:</span> {scanDetail.complaint || 'No additional observation data.'}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Process Timeline</h3>
            <div className="space-y-6">
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></div>
                  <div className="w-0.5 h-10 bg-gray-200 my-1"></div>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Uploaded</p>
                  <p className="text-xs text-gray-500">{formattedDate}</p>
                </div>
              </div>
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${scanDetail.aiPrediction ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div className="w-0.5 h-10 bg-gray-200 my-1"></div>
                </div>
                <div>
                  <p className={`font-bold text-sm ${scanDetail.aiPrediction ? 'text-gray-900' : 'text-gray-400'}`}>Analyzed</p>
                  <p className="text-xs text-gray-500">{scanDetail.aiPrediction ? 'AI Core Model Executed' : 'Pending'}</p>
                </div>
              </div>
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${isVerified ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  </div>
                </div>
                <div>
                  <p className={`font-bold text-sm ${isVerified ? 'text-gray-900' : 'text-gray-400'}`}>Verified</p>
                  <p className="text-xs text-gray-500">{isVerified && scanDetail.doctor ? `by ${scanDetail.doctor.name}` : 'Awaiting Review'}</p>
                </div>
              </div>
            </div>
          </div>

          {isVerified && scanDetail.doctor && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded tracking-wider">VERIFIED RECORD</span>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Doctor Verification</h3>
              <div className="flex items-center mb-4">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${scanDetail.doctor.name}`} className="w-12 h-12 rounded-full bg-gray-100 mr-3" alt="Doctor" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{scanDetail.doctor.name}</p>
                  <p className="text-xs text-blue-600">{scanDetail.doctor.specialty || 'Dermatologist'}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Physician's Note</p>
                <p className="text-xs text-gray-700 italic leading-relaxed">
                  "{scanDetail.physicianNote || '-'}"
                </p>
              </div>
            </div>
          )}

          <div className="bg-[#1A1D20] text-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Patient Parameters</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Fitzpatrick Skin Type</span>
                <span className="font-bold">{scanDetail.patient?.skinType || 'Type II'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Family History</span>
                <span className="font-bold">{scanDetail.patient?.familyHistory || 'Negative'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Sun Exposure Level</span>
                <span className="font-bold">{scanDetail.patient?.sunExposure || 'Moderate'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Previous Biopsies</span>
                <span className="font-bold">{scanDetail.patient?.previousBiopsies || '0'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalDetailPage;