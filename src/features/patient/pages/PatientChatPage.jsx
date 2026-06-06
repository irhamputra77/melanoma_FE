import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getConsultationDetail,
    getConsultationMessages,
    sendConsultationMessage,
    markAllConsultationMessagesAsRead,
    getConsultationSSEUrl,
    sendTypingStatus
} from '../services/patientService';
import ChatBubble from '../components/chat/ChatBubble';
import ClinicalSummaryPanel from '../components/chat/ClinicalSummaryPanel';

const PatientChatPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [consultation, setConsultation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isDoctorTyping, setIsDoctorTyping] = useState(false);
    
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const doctorTypingTimeoutRef = useRef(null);
    
    // Dua interval terpisah agar server tidak jebol
    const refreshIntervalRef = useRef(null);
    const detailIntervalRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        try {
            const res = await getConsultationMessages(id, { page: 1, limit: 100 });
            setMessages(res.data || res || []);
        } catch (err) {
            throw err; // Lempar error agar bisa ditangkap oleh polling jika 404
        }
    };

    useEffect(() => {
        let isMounted = true;
        const ctrl = new AbortController(); 
        
        const initData = async () => {
            try {
                const detail = await getConsultationDetail(id);
                if (isMounted) setConsultation(detail);
                
                await fetchMessages();
                await markAllConsultationMessagesAsRead(id);
                setTimeout(scrollToBottom, 200);

                const token =
                    sessionStorage.getItem('token') ||
                    sessionStorage.getItem('accessToken') ||
                    localStorage.getItem('token') ||
                    localStorage.getItem('accessToken');
                const sseUrl = getConsultationSSEUrl(id);

                connectConsultationEvents({
                    url: sseUrl,
                    token,
                    signal: ctrl.signal,
                    onEvent: (parsedData) => {
                        if (!isMounted) return;

                        switch (parsedData.type) {
                            case 'connection:ready':
                                break;
                            case 'message:new':
                            case 'NEW_MESSAGE':
                                fetchMessages().catch(() => {});
                                if (parsedData.payload?.senderRole !== 'patient') {
                                    markAllConsultationMessagesAsRead(id).catch(() => {});
                                }
                                setTimeout(scrollToBottom, 100);
                                break;
                            case 'message:read':
                            case 'MESSAGES_READ':
                                fetchMessages().catch(() => {});
                                break;
                            case 'typing':
                            case 'USER_TYPING':
                                if (parsedData.payload?.role !== 'patient' && parsedData.payload?.isTyping) {
                                    setIsDoctorTyping(true);
                                    clearTimeout(doctorTypingTimeoutRef.current);
                                    doctorTypingTimeoutRef.current = setTimeout(() => {
                                        setIsDoctorTyping(false);
                                    }, 3000);
                                } else {
                                    setIsDoctorTyping(false);
                                }
                                break;
                            // Jika suatu saat Backend mengirim sinyal SSE Close, tangkap di sini
                            case 'consultation:closed':
                            case 'CONSULTATION_CLOSED':
                            case 'case_resolved':
                            case 'CASE_RESOLVED':
                            case 'CLOSED':
                                setConsultation(prev => prev ? { ...prev, status: 'CLOSED' } : prev);
                                break;
                            default:
                                break;
                        }
                    },
                }).catch(() => {});

                // =======================================================
                // POLLING 1: AMBIL PESAN (TIAP 3 DETIK) - ANTI TENDANG
                // =======================================================
                refreshIntervalRef.current = setInterval(async () => {
                    if (!isMounted) return;
                    try {
                        await fetchMessages();
                        markAllConsultationMessagesAsRead(id).catch(() => {});
                    } catch (err) {
                        // HANYA tendang keluar jika data di database benar-benar dihapus (Error 404)
                        if (err.response && err.response.status === 404) {
                            clearInterval(refreshIntervalRef.current);
                            clearInterval(detailIntervalRef.current);
                            alert('Riwayat konsultasi ini telah dihapus oleh klinik.');
                            if (isMounted) navigate('/patient/messages', { replace: true });
                        }
                        // Jika karena internet putus, abaikan saja (tidak ada aksi)
                    }
                }, 3000);

                // =======================================================
                // POLLING 2: CEK STATUS KASUS (TIAP 10 DETIK)
                // =======================================================
                detailIntervalRef.current = setInterval(async () => {
                    if (!isMounted) return;
                    try {
                        const currentDetail = await getConsultationDetail(id);
                        if (isMounted) setConsultation(currentDetail);
                        
                        // Jika sudah closed, kita bisa matikan interval pengecekan status ini
                        if (currentDetail && (currentDetail.status === 'CLOSED' || currentDetail.status === 'case_resolved')) {
                            clearInterval(detailIntervalRef.current);
                        }
                    } catch (err) {
                        // Abaikan jika error karena internet jelek
                    }
                }, 10000);

            } catch (err) {
                if (isMounted) navigate('/patient/messages', { replace: true });
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initData();

        return () => {
            isMounted = false;
            ctrl.abort(); 
            clearTimeout(typingTimeoutRef.current);
            clearTimeout(doctorTypingTimeoutRef.current);
            clearInterval(refreshIntervalRef.current);
            clearInterval(detailIntervalRef.current); // Bersihkan interval kedua
        };
    }, [id, navigate]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const removeAttachment = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleMessageChange = (e) => {
        setNewMessage(e.target.value);
        
        sendTypingStatus(id, true).catch(() => {});
        
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(id, false).catch(() => {});
        }, 1500);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || isSending) return;

        const textToSend = newMessage;
        const fileToSend = selectedFile;
        
        setNewMessage('');
        setSelectedFile(null);
        setIsSending(true);
        setIsDoctorTyping(false);
        
        clearTimeout(typingTimeoutRef.current);
        sendTypingStatus(id, false).catch(() => {});
        
        setTimeout(scrollToBottom, 50);

        try {
            await sendConsultationMessage(id, textToSend, fileToSend);
            await fetchMessages();
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            setNewMessage(textToSend);
            setSelectedFile(fileToSend);
        } finally {
            setIsSending(false);
        }
    };

    const isPatientMessage = (msg) => {
        if (msg.senderRole) return msg.senderRole.toLowerCase() === 'patient';
        if (msg.senderType) return msg.senderType.toLowerCase() === 'patient';
        return msg.senderId === consultation?.patientId;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="text-gray-500 font-medium">Connecting to secure chat...</p>
            </div>
        );
    }

    const docName = consultation?.doctor?.name || 'Physician';
    // Mengecek apakah status konsultasi sudah selesai
    const isConsultationClosed = consultation?.status === 'CLOSED' || consultation?.status === 'case_resolved';

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-4">
            
            <div className="mb-6 shrink-0">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Chat with a Physician</h1>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 min-h-0">
                
                <div className="xl:col-span-2 flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    
                    <div className="flex items-center space-x-4 p-6 border-b border-gray-100 shrink-0">
                        <div className="w-12 h-12 bg-[#EBF3FF] rounded-xl flex items-center justify-center text-[#0A58CA]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-gray-900">Secure Chat with {docName}</h2>
                            <div className="flex items-center mt-1">
                                {isConsultationClosed ? (
                                    <>
                                        <span className="w-2.5 h-2.5 bg-gray-400 rounded-full mr-2"></span>
                                        <span className="text-xs text-gray-500 font-medium">Sesi Berakhir</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></span>
                                        <span className="text-xs text-gray-500 font-medium">Verified Physician Active</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/30 flex flex-col relative">
                        <div className="flex justify-center mb-8 shrink-0">
                            <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
                                Handing over to {docName} • Secure Connection
                            </span>
                        </div>

                        {messages.map((msg) => (
                            <ChatBubble 
                                key={msg.id} 
                                message={msg} 
                                isPatient={isPatientMessage(msg)} 
                            />
                        ))}
                        
                        <div ref={messagesEndRef} className="h-4" /> 
                    </div>

                    <div className="bg-white shrink-0">
                        {isDoctorTyping && !isConsultationClosed && (
                            <div className="px-8 py-2 text-xs text-gray-500 italic flex items-center bg-gray-50/50 border-t border-gray-100">
                                <span className="mr-2">Doctor is typing</span>
                                <span className="flex space-x-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                </span>
                            </div>
                        )}

                        {/* UI EKSKLUSIF KETIKA CHAT DITUTUP */}
                        {isConsultationClosed ? (
                            <div className="p-6 text-center border-t border-gray-100 bg-gray-50 flex flex-col items-center justify-center">
                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 shadow-sm border border-green-200">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h4 className="text-gray-900 font-bold mb-1">Konsultasi Telah Diselesaikan</h4>
                                <p className="text-sm text-gray-500">Sesi konsultasi ini telah ditutup oleh dokter. Ringkasan klinis Anda tersedia di panel sebelah kanan.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex flex-col space-y-3">
                                {selectedFile && (
                                    <div className="flex items-center bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100 self-start">
                                        <svg className="w-4 h-4 text-blue-600 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        <span className="text-sm text-blue-800 font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                                        <button type="button" onClick={removeAttachment} className="ml-3 text-blue-400 hover:text-red-500 transition">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center w-full">
                                    <div className="flex-1 flex items-center bg-[#F8F9FA] rounded-2xl border border-gray-200 px-4 py-2">
                                        <input 
                                            type="text"
                                            value={newMessage}
                                            onChange={handleMessageChange}
                                            placeholder="Type a message to your doctor..."
                                            className="flex-1 bg-transparent text-sm text-gray-900 outline-none w-full py-2"
                                        />
                                        
                                        <input 
                                            type="file" 
                                            id="chat-file-upload"
                                            ref={fileInputRef} 
                                            onChange={handleFileChange} 
                                            className="hidden" 
                                            accept="image/*,.pdf,.doc,.docx"
                                        />
                                        <label 
                                            htmlFor="chat-file-upload"
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition ml-2 cursor-pointer flex items-center justify-center" 
                                            title="Attach file"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        </label>
                                    </div>
                                    <button type="submit" disabled={isSending || (!newMessage.trim() && !selectedFile)} className="p-4 bg-[#0A58CA] text-white rounded-2xl hover:bg-blue-700 transition disabled:opacity-50 shadow-sm flex items-center justify-center ml-3 shrink-0">
                                        {isSending ? (
                                            <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                </div>

                <div className="xl:col-span-1 h-full overflow-y-auto custom-scrollbar pr-2 pb-10">
                    <ClinicalSummaryPanel consultation={consultation} />
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

export default PatientChatPage;

async function connectConsultationEvents({ url, token, signal, onEvent }) {
    if (!url || !token) return;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
        },
        signal,
    });

    if (!response.ok || !response.body) {
        throw new Error('Unable to connect to consultation events.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (!signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split(/\r?\n\r?\n/);
        buffer = chunks.pop() || '';

        chunks.forEach((chunk) => {
            const data = chunk
                .split(/\r?\n/)
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.replace(/^data:\s?/, ''))
                .join('\n');

            if (!data) return;

            try {
                onEvent?.(JSON.parse(data));
            } catch (error) {}
        });
    }
}