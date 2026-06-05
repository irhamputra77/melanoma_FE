import React from 'react';

const resolveImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
        if (path.includes('dicebear')) return path;
        return `${path}${path.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
    }
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3300/api';
    const baseUrl = apiUrl.split('/api')[0];
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}?t=${new Date().getTime()}`;
};

const ClinicalSummaryPanel = ({ consultation }) => {
    if (!consultation) return null;

    const doctor = consultation.doctor || {};
    const scan = consultation.scan || {};
    
    const docAvatar = resolveImageUrl(doctor.avatarUrl) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.name || 'Doc'}`;
    const scanImage = resolveImageUrl(scan.imageUrl);
    
    let confValue = Number(scan?.aiConfidence || 0);
    const displayConf = confValue > 1 ? confValue.toFixed(0) : (confValue * 100).toFixed(0);

    return (
        <div className="w-full space-y-6">
            
            <div>
                <h4 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3">Verification Status</h4>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3 mb-5">
                        <img src={docAvatar} alt={doctor.name} className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 object-cover" />
                        <div>
                            <p className="text-sm font-bold text-gray-900">{doctor.name || 'Doctor'}</p>
                            <p className="text-[10px] text-gray-500 leading-tight">{doctor.specialty || 'Skin Cancer Specialist'}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Identity Verified</span>
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Medical License</span>
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Last Active</span>
                            <span className="text-xs font-bold text-gray-900">Now</span>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3">Clinical Summary</h4>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    
                    <div className="mb-6">
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">Current Chief Complaint</p>
                        <p className="text-sm font-bold text-gray-900 leading-snug">
                            {scan.complaint || 'No complaint provided.'}
                        </p>
                    </div>

                    <div className="mb-6">
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-3">AI Diagnostic Indicators</p>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold mb-1">
                                    <span className="text-gray-900">AI Confidence</span>
                                    <span className="text-gray-900">{displayConf}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className="bg-[#0A58CA] h-1.5 rounded-full" style={{ width: `${displayConf}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] font-bold mb-1">
                                    <span className="text-gray-900">System Risk Flag</span>
                                    <span className="text-gray-900">{scan.riskLevel === 'HIGH' ? 'High' : 'Eval'}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${scan.riskLevel === 'HIGH' ? 'bg-red-500 w-[90%]' : 'bg-orange-500 w-[40%]'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">Associated Files</p>
                        <div className="flex gap-2">
                            {scanImage ? (
                                <img src={scanImage} alt="Scan" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                                    <span className="text-[9px] text-gray-400">No Image</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start space-x-3">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold font-serif">i</span>
                </div>
                <p className="text-[11px] text-red-800 leading-relaxed font-medium">
                    If you experience difficulty breathing or facial swelling, please end this chat and call emergency services immediately.
                </p>
            </div>

        </div>
    );
};

export default ClinicalSummaryPanel;