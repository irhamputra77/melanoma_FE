import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveConsultation } from '../services/patientService';

const PatientMessageRouter = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkActiveConsultation = async () => {
            try {
                const activeChat = await getActiveConsultation();

                if (activeChat) {
                    navigate(`/patient/messages/${activeChat.id || activeChat.consultationId}`, { replace: true });
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Gagal memeriksa konsultasi aktif:", error);
                setIsLoading(false);
            }
        };

        checkActiveConsultation();
    }, [navigate]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 font-medium">Checking active consultations...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-10 pt-10">
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 flex flex-col items-center text-center min-h-[60vh] justify-center">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                
                <h2 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">No Active Chat</h2>
                
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
                    You don't have any ongoing chats with a physician right now. To start a new consultation, please select a case from your historical data.
                </p>
                
                <button 
                    onClick={() => navigate('/patient/history')}
                    className="px-8 py-3.5 bg-[#0A58CA] text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Go to Historical Data
                </button>
            </div>
        </div>
    );
};

export default PatientMessageRouter;
