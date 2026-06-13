import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAiChatHistory, sendAiChatMessage } from '../services/patientService';
import ChatBubble from '../components/chat/ChatBubble';

const PatientChatBotPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const initChatbot = async () => {
            setIsLoading(true);
            try {
                // Ambil riwayat chat AI (jika error 404, fungsi service akan return [])
                const history = await getAiChatHistory(id);
                setMessages(Array.isArray(history) ? history : (history?.messages || []));
                
                setTimeout(scrollToBottom, 100);
            } catch (error) {
                console.error("Gagal memuat AI Chat:", error);
                setErrorMessage('Gagal terhubung ke Asisten AI. Pastikan layanan AI sedang aktif.');
            } finally {
                setIsLoading(false);
            }
        };

        initChatbot();
    }, [id]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        const textToSend = newMessage.trim();
        setNewMessage('');
        setIsSending(true);

        // Optimistic UI: Tampilkan pesan user secara instan
        const tempPatientMessage = {
            id: `temp-${Date.now()}`,
            message: textToSend,
            senderRole: 'patient',
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempPatientMessage]);
        setTimeout(scrollToBottom, 50);

        try {
            await sendAiChatMessage(id, textToSend);
            
            // Ambil ulang pesan untuk mendapatkan respons AI
            const history = await getAiChatHistory(id);
            setMessages(Array.isArray(history) ? history : (history?.messages || []));
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error("Gagal mengirim pesan AI:", error);
            setNewMessage(textToSend); // Kembalikan teks ke input box jika gagal
            setMessages(prev => prev.filter(msg => msg.id !== tempPatientMessage.id)); // Hapus pesan temp
            alert('Gagal mengirim pesan ke AI. Silakan coba lagi.');
        } finally {
            setIsSending(false);
        }
    };

    const isPatientMessage = (msg) => {
        const role = String(msg.senderRole || msg.role || msg.senderType || '').toLowerCase();
        return role === 'patient' || role === 'user';
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="text-gray-500 font-medium">Connecting to AI Assistant...</p>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] px-4 text-center">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Connection Failed</h1>
                <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
                <button onClick={() => navigate('/patient/dashboard')} className="px-6 py-3 bg-[#0A58CA] text-white font-bold rounded-xl hover:bg-blue-700 transition">Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto h-[calc(100vh-80px)] flex flex-col pb-4">
            {/* JUDUL DAN TOMBOL BACK */}
            <div className="mb-4 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">AI Clinical Assistant</h1>
                    <p className="text-gray-500 text-sm mt-1">Diskusikan hasil analisis gambar Anda dengan asisten cerdas kami.</p>
                </div>
                <button onClick={() => navigate('/patient/dashboard')} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition shadow-sm text-sm">
                    Back to Dashboard
                </button>
            </div>

            {/* AREA CHAT FULL WIDTH */}
            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* HEADER CHAT */}
                <div className="flex items-center space-x-4 p-4 md:p-6 border-b border-gray-100 shrink-0 bg-gradient-to-r from-blue-50/50 to-white">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm border border-blue-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg md:text-xl font-extrabold text-gray-900 truncate">MySkin AI Bot</h2>
                        <div className="flex items-center mt-1">
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
                            <span className="text-xs text-gray-500 font-medium">Online & Ready</span>
                        </div>
                    </div>
                </div>

                {/* HISTORI PESAN */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-gray-50/30">
                    <div className="flex justify-center mb-6">
                        <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase shadow-sm border border-gray-300">
                            SCAN ID: #{String(id).substring(0, 8).toUpperCase()}
                        </span>
                    </div>

                    {messages.length > 0 ? (
                        messages.map((msg) => (
                            <ChatBubble 
                                key={msg.id || Math.random()} 
                                message={msg} 
                                isPatient={isPatientMessage(msg)} 
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <p className="text-gray-700 font-bold text-base">Mulai Percakapan</p>
                            <p className="text-gray-500 text-sm mt-1 max-w-sm">Kirimkan pertanyaan terkait hasil deteksi. AI kami siap memberikan informasi medis awal.</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" /> 
                </div>

                {/* AREA INPUT CHAT */}
                <div className="shrink-0 bg-white">
                    {isSending && (
                        <div className="px-6 py-2 text-xs text-gray-500 italic flex items-center bg-gray-50/50 border-t border-gray-100">
                            <span className="mr-2 text-blue-600 font-bold">AI is thinking</span>
                            <span className="flex space-x-1">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </span>
                        </div>
                    )}

                    <form onSubmit={handleSend} className="p-3 md:p-6 border-t border-gray-100 flex flex-col space-y-3">
                        <div className="flex items-center w-full">
                            <div className="flex-1 flex items-center bg-[#F8F9FA] rounded-2xl border border-gray-200 px-5 py-3 min-w-0 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                                <input 
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Ketik pertanyaan Anda ke AI..."
                                    disabled={isSending}
                                    className="flex-1 bg-transparent text-sm text-gray-900 outline-none w-full py-1 min-w-0 disabled:opacity-50"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSending || !newMessage.trim()} 
                                className="p-4 bg-[#0A58CA] text-white rounded-2xl hover:bg-blue-700 transition disabled:opacity-50 shadow-sm flex items-center justify-center ml-4 shrink-0"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E5E7EB; border-radius: 20px; }
            `}} />
        </div>
    );
};

export default PatientChatBotPage;