import React from 'react';

const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// Helper untuk memastikan URL gambar dapat diakses
const resolveFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3300/api';
    const baseUrl = apiUrl.split('/api')[0];
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Helper untuk mendeteksi apakah lampiran berupa gambar
const isImage = (url) => {
    if (!url) return false;
    return url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) != null;
};

// Helper pintar untuk mengekstrak URL dari struktur BE
const getFileUrl = (msg) => {
    // Jika BE menggunakan array 'attachments'
    if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
        const att = msg.attachments[0]; // Ambil file pertama
        // Tergantung BE, kadang array of string, kadang array of object
        return typeof att === 'string' ? att : (att.url || att.fileUrl || att.path); 
    }
    // Fallback jika menggunakan field lain
    return msg.fileUrl || msg.attachmentUrl || msg.attachment;
};

const ChatBubble = ({ message, isPatient }) => {
    
    // Ekstrak URL file
    const fileUrl = getFileUrl(message); 
    const resolvedFileUrl = resolveFileUrl(fileUrl);
    const isFileImage = isImage(fileUrl);

    // Fungsi untuk me-render UI Lampiran
    const renderAttachment = () => {
        if (!resolvedFileUrl) return null;
        
        if (isFileImage) {
            return (
                <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                    <img 
                        src={resolvedFileUrl} 
                        alt="Attachment" 
                        className="max-w-full h-auto max-h-64 object-contain bg-black/5 cursor-pointer hover:opacity-90 transition" 
                        onClick={() => window.open(resolvedFileUrl, '_blank')}
                    />
                </div>
            );
        }

        // Jika bukan gambar (misal PDF/Doc), tampilkan sebagai link download
        const fileName = fileUrl.split('/').pop() || 'Download File';
        return (
            <a 
                href={resolvedFileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`flex items-center p-3 mb-2 rounded-xl transition ${isPatient ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-gray-50 border border-gray-200 text-blue-600 hover:bg-gray-100'}`}
            >
                <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                <span className="text-sm font-medium truncate max-w-[150px]">{fileName}</span>
            </a>
        );
    };

    if (isPatient) {
        return (
            <div className="mb-6 flex flex-col items-end w-full">
                <div className="flex items-center space-x-2 mb-1.5">
                    <span className="text-[11px] text-gray-500 font-medium">
                        {formatTime(message.createdAt)}
                    </span>
                    <span className="bg-gray-200 text-gray-700 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider">
                        YOU
                    </span>
                </div>
                <div className="bg-[#0A58CA] text-white text-sm rounded-2xl rounded-tr-none p-4 max-w-[80%] shadow-sm leading-relaxed">
                    {renderAttachment()}
                    {message.message && <div>{message.message}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6 flex flex-col items-start w-full">
            <div className="flex items-center space-x-2 mb-1.5">
                <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider">
                    DOCTOR
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                    {formatTime(message.createdAt)}
                </span>
            </div>
            <div className="bg-white border border-gray-100 text-gray-800 text-sm rounded-2xl rounded-tl-none p-4 max-w-[80%] shadow-sm leading-relaxed">
                {renderAttachment()}
                {message.message && <div>{message.message}</div>}
            </div>
        </div>
    );
};

export default ChatBubble;