import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingButton from '../../../components/common/LoadingButton';
import {
    getPatientScanDetail,
    getAvailableDoctors,
    initiateConsultation,
    getActiveConsultation
} from '../services/patientService';
import { getAssetUrlCandidates } from '../../../utils/assets';

const AssetImage = ({ src, fallbackSrc = '', alt, ...props }) => {
    const [fallback, setFallback] = useState({ source: src, index: 0 });
    const candidates = getAssetUrlCandidates(src);
    const index = fallback.source === src ? fallback.index : 0;
    const resolvedSrc = candidates[index] || fallbackSrc;

    return (
        <img
            src={resolvedSrc}
            alt={alt}
            onError={() => {
                setFallback((current) => {
                    if (current.source !== src) return { source: src, index: 0 };
                    const nextIndex = current.index + 1;
                    if (nextIndex < candidates.length) {
                        return { source: src, index: nextIndex };
                    }
                    return current;
                });
            }}
            {...props}
        />
    );
};

const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getDocId = (doc) => doc.doctorProfile?.id || doc.id;

const HistoricalDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [scanDetail, setScanDetail] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [activeConsultation, setActiveConsultation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitiating, setIsInitiating] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [scanData, doctorsData, activeConsultationData] = await Promise.all([
                    getPatientScanDetail(id),
                    getAvailableDoctors(),
                    getActiveConsultation()
                ]);
                setScanDetail(scanData);
                setActiveConsultation(activeConsultationData);
                
                const docs = doctorsData?.data || doctorsData || [];
                setDoctors(docs);
                if (docs.length > 0) {
                    setSelectedDoctorId(getDocId(docs[0]));
                }
            } catch (error) {
                console.error("Gagal memuat detail atau konsultasi aktif:", error);
                setErrorMessage('Gagal memuat data detail rekam medis.');
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    const handleInitiateConsultation = async () => {
        if (!selectedDoctorId) return;
        if (activeConsultation) {
            setErrorMessage('Anda masih memiliki konsultasi aktif. Selesaikan case tersebut dengan dokter sebelum memulai konsultasi baru.');
            return;
        }
        setIsInitiating(true);
        setErrorMessage('');
        try {
            const payload = {
                doctorId: selectedDoctorId,
                scanId: scanDetail?.scanId || scanDetail?.id,
                initialMessage: "Halo dokter, saya ingin berkonsultasi mengenai hasil deteksi AI ini."
            };
            const result = await initiateConsultation(payload);
            getActiveConsultation().then(setActiveConsultation).catch(() => {});
            const newConsultationId = result?.id || result?.consultationId;
            if (newConsultationId) {
                navigate(`/patient/messages/${newConsultationId}`);
            } else {
                window.location.reload();
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Gagal memulai konsultasi baru.');
        } finally {
            setIsInitiating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="text-gray-500 font-medium">Memuat detail...</p>
            </div>
        );
    }

    if (!scanDetail) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900">Data tidak ditemukan</h2>
                <button onClick={() => navigate('/patient/history')} className="mt-4 text-blue-600 font-medium hover:underline">Kembali ke Riwayat</button>
            </div>
        );
    }

    const displayConf = scanDetail.aiConfidence ? (scanDetail.aiConfidence > 1 ? scanDetail.aiConfidence.toFixed(1) : (scanDetail.aiConfidence * 100).toFixed(1)) : '--';
    const safeClass = scanDetail.aiPrediction || scanDetail.classification || 'Unknown';
    const isMalignant = safeClass.toLowerCase().includes('malignant');
    const safeRisk = scanDetail.riskLevel || (isMalignant ? 'HIGH RISK' : 'EVALUATED');
    const consultation = scanDetail.consultation;
    const activeConsultationId = activeConsultation?.id || activeConsultation?.consultationId;
    const activeDoctorName = activeConsultation?.doctor?.name || activeConsultation?.doctorName || 'dokter Anda';
    const blocksNewConsultation = Boolean(activeConsultation) && !consultation;

    return (
        <div className="w-full max-w-6xl mx-auto pb-10">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Case Detail</h1>
                    <p className="text-gray-600">Review your AI analysis results and consultation status.</p>
                </div>
                <button onClick={() => navigate('/patient/history')} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition shadow-sm">
                    Back to History
                </button>
            </div>

            {errorMessage && (
                <div className="p-4 mb-6 rounded-xl font-medium text-sm bg-red-50 text-red-700 border border-red-100">
                    {errorMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-[400px] flex items-center justify-center mb-6">
                            <AssetImage src={scanDetail.imageUrl} alt="Scan Detail" className="w-full h-full object-contain" />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm">
                                <span className="text-xs font-bold text-gray-900">ID: #{scanDetail.scanId || scanDetail.id?.substring(0, 6).toUpperCase()}</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Date</p>
                                <p className="font-bold text-gray-900 text-sm">{formatDate(scanDetail.createdAt)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Body Site</p>
                                <p className="font-bold text-gray-900 text-sm">{scanDetail.bodySite || '-'}</p>
                            </div>
                            <div className="col-span-2 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Complaint</p>
                                <p className="font-bold text-gray-900 text-sm truncate">{scanDetail.complaint || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Analysis Result</h3>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full tracking-wider ${safeRisk === 'HIGH RISK' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {safeRisk}
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-8">
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Classification</p>
                                <h2 className="text-3xl font-extrabold text-gray-900">{safeClass}</h2>
                            </div>
                            <div className="w-px h-12 bg-gray-200"></div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Confidence</p>
                                <div className="flex items-baseline space-x-1">
                                    <span className="text-3xl font-extrabold text-[#0A58CA]">{displayConf}%</span>
                                </div>
                            </div>
                        </div>
                        
                        {scanDetail.message && (
                            <p className="mt-6 text-gray-600 text-sm leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-50">
                                {scanDetail.message}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                            Consultation Status
                        </h3>

                        {consultation ? (
                            <div className="space-y-5">
                                <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <AssetImage src={consultation.doctor?.avatarUrl} fallbackSrc={`https://api.dicebear.com/7.x/avataaars/svg?seed=${consultation.doctor?.name || 'Doc'}`} alt="Doctor" className="w-12 h-12 rounded-full bg-white border border-gray-200 mr-3" />
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{consultation.doctor?.name || 'Assigned Doctor'}</p>
                                        <p className="text-xs text-gray-500">{consultation.doctor?.specialty || 'Dermatologist'}</p>
                                    </div>
                                </div>

                                {consultation.status === 'CLOSED' ? (
                                    <>
                                        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl text-center">
                                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 mb-0.5"></span>
                                            <span className="text-sm font-bold text-green-700">Case Closed</span>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/patient/messages/${consultation.id}`)}
                                            className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition text-sm shadow-sm"
                                        >
                                            View Chat Record
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-center animate-pulse">
                                            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-2 mb-0.5"></span>
                                            <span className="text-sm font-bold text-blue-700">Active Consultation</span>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/patient/messages/${consultation.id}`)}
                                            className="w-full py-3.5 bg-[#0A58CA] text-white font-bold rounded-xl hover:bg-blue-700 transition text-sm shadow-sm flex items-center justify-center"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                            Continue Chat
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {blocksNewConsultation ? (
                                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                                        <p className="text-xs font-semibold leading-relaxed text-amber-700">
                                            Anda masih memiliki konsultasi aktif dengan {activeDoctorName}. Anda baru bisa request dokter lain setelah dokter menutup case tersebut.
                                        </p>
                                        {activeConsultationId && (
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/patient/messages/${activeConsultationId}`)}
                                                className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-700"
                                            >
                                                Buka Konsultasi Aktif
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        No active consultation for this case. Select a specialist below to initiate a secure chat regarding this analysis.
                                    </p>
                                )}
                                
                                <div>
                                    <label className="block text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-2">Select Dermatologist</label>
                                    {doctors.length > 0 ? (
                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                            {doctors.map(doc => {
                                                const docId = getDocId(doc);
                                                return (
                                                    <label key={docId} className={`flex items-center p-3 border rounded-xl transition ${blocksNewConsultation ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${selectedDoctorId === docId ? 'border-blue-600 border-2 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                                                        <AssetImage src={doc.avatarUrl} fallbackSrc={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.name}`} className="w-10 h-10 rounded-full bg-gray-100 mr-3" alt={doc.name} />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold text-gray-900">{doc.name}</p>
                                                            <p className="text-[10px] text-gray-500 mt-0.5">{doc.specialty || 'Dermatologist'}</p>
                                                        </div>
                                                        <input type="radio" name="doctor" value={docId} checked={selectedDoctorId === docId} onChange={(e) => setSelectedDoctorId(e.target.value)} className="hidden" disabled={blocksNewConsultation} />
                                                        <div className={`w-4 h-4 rounded-full border-4 flex-shrink-0 ${selectedDoctorId === docId ? 'border-blue-600 bg-white' : 'border-gray-300'}`}></div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                                            <p className="text-xs text-gray-500">Loading available doctors...</p>
                                        </div>
                                    )}
                                </div>
                                
                                <LoadingButton 
                                    onClick={handleInitiateConsultation} 
                                    isLoading={isInitiating} 
                                    disabled={!selectedDoctorId || isInitiating || blocksNewConsultation}
                                    className="w-full py-3.5 bg-[#0A58CA] text-white font-bold rounded-xl text-sm"
                                >
                                    Start Consultation
                                </LoadingButton>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoricalDetailPage;
