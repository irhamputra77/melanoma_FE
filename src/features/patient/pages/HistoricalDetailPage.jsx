import React from 'react';

const HistoricalDetailPage = () => {
  return (
    <div className="max-w-6xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Record #MS-8821</h1>
          <p className="text-gray-600">Scan conducted on October 24, 2023 at 14:32. Location: Lower Back (Region 4-B).</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center shadow-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export PDF
          </button>
          <button className="px-4 py-2 bg-[#0A58CA] text-white font-medium rounded-lg hover:bg-blue-700 flex items-center shadow-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Share with Specialist
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KIRI */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Area */}
          <div className="relative rounded-3xl overflow-hidden shadow-sm h-[450px]">
            <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80" alt="Lesion" className="w-full h-full object-cover" />
            <span className="absolute bottom-6 left-6 bg-white/90 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg tracking-wider">ORIGINAL CAPTURE</span>
            <button className="absolute bottom-6 right-6 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-blue-600 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
            </button>
          </div>

          {/* Breakdown */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">AI Result Breakdown</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-2xl border-b-2 border-blue-600">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Confidence</p>
                <p className="text-2xl font-extrabold text-[#0A58CA]">94.2%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Classification</p>
                <p className="text-2xl font-bold text-gray-900">Benign</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Type</p>
                <p className="text-2xl font-bold text-gray-900">Nevus</p>
              </div>
            </div>
            <div className="bg-[#F8F9FA] p-4 rounded-xl text-sm text-gray-600 leading-relaxed border border-gray-100">
              <span className="text-[#0A58CA] font-bold">Observation:</span> The neural network identified regular borders and uniform pigmentation. Asymmetry score is within the normal range (0.12). No vascular structures typical of malignancy were detected.
            </div>
          </div>
        </div>

        {/* KANAN */}
        <div className="space-y-6">
          {/* Timeline */}
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
                  <p className="text-xs text-gray-500">Oct 24, 2023 · 14:32 PM</p>
                </div>
              </div>
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></div>
                  <div className="w-0.5 h-10 bg-gray-200 my-1"></div>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Analyzed</p>
                  <p className="text-xs text-gray-500">Oct 24, 2023 · 14:33 PM (AI Core v4.2)</p>
                </div>
              </div>
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg></div>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Verified</p>
                  <p className="text-xs text-gray-500">Oct 25, 2023 · 09:15 AM by Dr. Aris</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded tracking-wider">VERIFIED RECORD</span>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Doctor Verification</h3>
            <div className="flex items-center mb-4">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elena" className="w-12 h-12 rounded-full bg-gray-100 mr-3" alt="Dr Elena" />
              <div>
                <p className="font-bold text-gray-900 text-sm">Dr. Elena Aris</p>
                <p className="text-xs text-blue-600">Senior Dermatologist</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl mb-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Physician's Note</p>
              <p className="text-xs text-gray-700 italic leading-relaxed">
                "I have reviewed the AI classification and high-resolution captures. This presents as a stable melanocytic nevus. No immediate intervention is required, but I recommend a follow-up scan in 6 months to monitor for any marginal changes."
              </p>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 flex items-center"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> License: #99283-DX</span>
              <button className="text-blue-600 font-bold hover:underline flex items-center">View Profile <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg></button>
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-[#1A1D20] text-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Patient Parameters</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Fitzpatrick Skin Type</span>
                <span className="font-bold">Type II</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Family History</span>
                <span className="font-bold">Negative</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Sun Exposure Level</span>
                <span className="font-bold">Moderate</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Previous Biopsies</span>
                <span className="font-bold">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalDetailPage;