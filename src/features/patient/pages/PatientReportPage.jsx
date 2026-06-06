import React, { useState, useEffect, useCallback } from 'react';
import LoadingButton from '../../../components/common/LoadingButton';
import { getPatientReports, downloadPatientReport } from '../services/patientService';

const normalizeStatus = (status) => {
  const value = String(status || '').toLowerCase();

  if (['approved', 'verified', 'approve'].includes(value)) return 'approved';
  if (['rejected', 'not_approved', 'not approved', 'declined', 'notapproved'].includes(value)) return 'rejected';
  if (['pending', 'reviewing', 'in_review', 'waiting', 'submitted'].includes(value)) return 'pending';

  return value || 'pending';
};

const getStatusLabel = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === 'approved') return 'Approved';
  if (normalized === 'rejected') return 'Not Approved';
  if (normalized === 'pending') return 'Pending Review';

  return status || 'Pending Review';
};

const getStatusStyle = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === 'approved') return 'bg-green-100 text-green-700';
  if (normalized === 'rejected') return 'bg-red-100 text-red-700';

  return 'bg-orange-100 text-orange-700';
};

const getIconStyle = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === 'rejected') return 'bg-red-50 text-red-600';
  if (normalized === 'approved') return 'bg-green-50 text-green-600';

  return 'bg-blue-50 text-blue-600';
};

const getReportStatus = (report) => {
  return (
    report?.status ||
    report?.verificationStatus ||
    report?.doctorStatus ||
    report?.reviewStatus ||
    report?.caseStatus ||
    report?.scan?.status ||
    report?.verification?.status ||
    report?.case?.status
  );
};

const getReportId = (report) => {
  return report?.reportId || report?.id || report?.scanId || report?.caseId;
};

const reportMatchesSearch = (report, searchTerm) => {
  if (!searchTerm.trim()) return true;

  const term = searchTerm.toLowerCase();
  const status = getReportStatus(report);
  const statusLabel = getStatusLabel(status);
  const reportId = getReportId(report);

  return (
    String(reportId || '').toLowerCase().includes(term) ||
    String(report?.scanId || '').toLowerCase().includes(term) ||
    String(report?.caseId || '').toLowerCase().includes(term) ||
    String(report?.finding || '').toLowerCase().includes(term) ||
    String(report?.diagnosis || '').toLowerCase().includes(term) ||
    String(report?.summary || '').toLowerCase().includes(term) ||
    String(report?.classification || '').toLowerCase().includes(term) ||
    String(report?.aiPrediction || '').toLowerCase().includes(term) ||
    statusLabel.toLowerCase().includes(term)
  );
};

const PatientReportPage = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await getPatientReports(params);

      const reportList =
        response?.data ||
        response?.reports ||
        response?.items ||
        response ||
        [];

      const meta = response?.meta || response?.pagination || {};

      const normalizedReports = Array.isArray(reportList) ? reportList : [];

      const localFilteredReports = normalizedReports.filter((report) => {
        const status = normalizeStatus(getReportStatus(report));
        const isStatusMatched = statusFilter ? status === statusFilter : true;
        const isSearchMatched = reportMatchesSearch(report, searchTerm);

        return isStatusMatched && isSearchMatched;
      });

      setReports(localFilteredReports);
      setTotalPages(meta?.lastPage || meta?.totalPages || 1);
    } catch (error) {
      console.error('Gagal memuat laporan:', error);
      setReports([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchReports();
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [fetchReports]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDownload = async (reportId) => {
    setDownloadingId(reportId);

    try {
      // 1. Ambil data JSON dari backend
      const response = await downloadPatientReport(reportId);

      // 2. Ekstraksi secara aman (mengantisipasi berbagai bentuk JSON dari BE)
      const pdfPath = response?.pdfUrl || response?.data?.pdfUrl;

      if (!pdfPath) {
        console.error("Respons dari server:", response);
        throw new Error("URL PDF tidak ditemukan dari balasan server.");
      }

      // 3. Susun URL penuh secara dinamis
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3300/api/v1';
      const baseUrl = apiUrl.split('/api')[0];
      const fullPdfUrl = `${baseUrl}${pdfPath.startsWith('/') ? '' : '/'}${pdfPath}`;

      // 4. Unduh/Buka file menggunakan elemen <a> agar lolos dari Popup Blocker
      const link = document.createElement('a');
      link.href = fullPdfUrl;
      link.target = '_blank';
      link.download = `Clinical_Report_${reportId}.pdf`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Detail Error Download:", error);
      alert(`Gagal mengunduh: ${error.message || 'Laporan belum selesai diproses.'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
          Patient Reports
        </h1>
        <p className="text-gray-600">
          Verified clinical documentation and diagnostic summaries generated by the Melanoma AI Unit and confirmed by attending dermatologists.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>

          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by Report ID, Diagnosis, Finding, or Status..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="appearance-none px-6 py-3 pl-10 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-10 w-full md:w-auto"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Not Approved</option>
          </select>

          <svg className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>

          <svg className="w-4 h-4 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="space-y-4 mb-12">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Memuat laporan...</div>
        ) : reports.length > 0 ? (
          reports.map((report) => {
            const status = getReportStatus(report);
            const reportId = getReportId(report);
            const createdAt = report.createdAt || report.created_at || report.updatedAt;

            return (
              <div
                key={reportId}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between hover:shadow-md transition"
              >
                <div className="flex items-center w-full md:w-1/3 mb-4 md:mb-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${getIconStyle(status)}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-lg">Report</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusStyle(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 font-medium flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      ID: {String(reportId || '-').substring(0, 8).toUpperCase()}
                      <span className="mx-2">•</span>
                      {createdAt ? new Date(createdAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-1/3 px-0 md:px-4 mb-4 md:mb-0">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                    Clinical Finding
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {report.finding || report.diagnosis || report.summary || report.classification || 'Detail report tersedia di dalam berkas.'}
                  </p>
                </div>

                <div className="w-full md:w-auto flex items-center justify-end space-x-3">
                  <LoadingButton
                    onClick={() => handleDownload(reportId)}
                    isLoading={downloadingId === reportId}
                    className="px-6 py-2.5 bg-[#0A58CA] text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </LoadingButton>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-white border rounded-xl text-gray-500 shadow-sm">
            Tidak ada laporan yang cocok dengan filter.
          </div>
        )}
      </div>

      {!isLoading && reports.length > 0 && totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4 mb-10">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Prev
          </button>

          <span className="px-4 py-2 text-gray-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <div className="flex items-center mb-4 md:mb-0">
          <svg className="w-6 h-6 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>

          <div>
            <p className="font-bold text-gray-700">HIPAA COMPLIANT SYSTEM</p>
            <p className="text-xs">End-to-end encrypted medical data storage and clinical reporting.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientReportPage;