import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";

const apiBaseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3300/api";
const patientBaseURL = import.meta.env.VITE_PATIENT_API_BASE_URL || `${apiBaseURL.replace(/\/$/, "")}/v1/patient`;
const unwrap = (response) => response.data?.data ?? response.data;
const patientRequest = (config) => api.request({ baseURL: patientBaseURL, ...config });

// UTILS
function normalizePaginationParams(params = {}) {
    const queryParams = { ...params };

    const page = Number(params.page || 1);
    const limit = Number(params.limit || 10);

    queryParams.page = Number.isFinite(page) && page > 0 ? page : 1;
    queryParams.limit = Number.isFinite(limit) && limit > 0 ? limit : 10;

    Object.keys(queryParams).forEach((key) => {
        if (
            queryParams[key] === "" ||
            queryParams[key] === null ||
            queryParams[key] === undefined
        ) {
            delete queryParams[key];
        }
    });

    return queryParams;
}

// DASHBOARD
export const getPatientDashboard = async () => {
    const response = await patientRequest({ method: "get", url: ENDPOINTS.PATIENT.DASHBOARD });
    return unwrap(response);
};

// SCANS
export const uploadPatientScan = async (file, complaint, bodySite) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("complaint", complaint);
    formData.append("bodySite", bodySite);

    const response = await patientRequest({
        method: "post",
        url: ENDPOINTS.PATIENT.SCAN_UPLOAD,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(response);
};

export const analyzePatientScan = async (scanId, config = {}) => {
    if (!scanId) throw new Error("Upload response does not contain scan id.");

    const response = await patientRequest({
        method: "post",
        url: ENDPOINTS.PATIENT.SCAN_ANALYZE(scanId),
        ...config,
    });
    return unwrap(response);
};

export const getScanAnalysis = async (scanId) => {
    const response = await patientRequest({ method: "get", url: ENDPOINTS.PATIENT.SCAN_ANALYSIS(scanId) });
    return unwrap(response);
};

export const getRecentScans = async (params = { page: 1, limit: 5 }) => {
    const response = await patientRequest({ 
        method: "get", 
        url: ENDPOINTS.PATIENT.RECENT_SCANS,
        params: normalizePaginationParams(params)
    });
    return unwrap(response);
};

export const getScanHistory = async (params) => {
    const response = await patientRequest({ 
        method: "get", 
        url: ENDPOINTS.PATIENT.SCAN_HISTORY,
        params: normalizePaginationParams(params)
    });
    return unwrapListResponse(response.data);
};

export const getPatientScanDetail = async (scanId) => {
    const response = await patientRequest({ method: "get", url: ENDPOINTS.PATIENT.SCAN_DETAIL(scanId) });
    return unwrap(response);
};

export const exportScanPdf = async (scanId) => {
    const response = await patientRequest({ 
        method: "get", 
        url: ENDPOINTS.PATIENT.SCAN_EXPORT_PDF(scanId),
        responseType: "blob"
    });
    return response.data;
};

export const sharePatientScan = async (scanId, payload) => {
    const response = await patientRequest({
        method: "post",
        url: ENDPOINTS.PATIENT.SCAN_SHARE(scanId),
        data: payload,
    });
    return unwrap(response);
};


// REPORTS
export const getPatientReports = async (params) => {
    const response = await patientRequest({
        method: "get",
        url: ENDPOINTS.PATIENT.REPORTS,
        params: normalizePaginationParams(params),
    });

    return response.data;
};

export const getPatientReportDetail = async (reportId) => {
    const response = await patientRequest({
        method: "get",
        url: ENDPOINTS.PATIENT.REPORT_DETAIL(reportId),
    });

    return unwrap(response);
};

/**
 * Dipakai untuk mengambil data report yang kemungkinan berisi pdfUrl.
 * Catatan:
 * - Kalau BE endpoint /reports/:id/download masih return JSON { pdfUrl }, function ini aman.
 * - Kalau endpoint download return error "PDF belum digenerate", page akan fallback ke detail report.
 */
export const downloadPatientReport = async (reportId) => {
    const response = await patientRequest({
        method: "get",
        url: ENDPOINTS.PATIENT.REPORT_DOWNLOAD(reportId),
        responseType: "blob",
    });

    return unwrapDownloadResponse(response);
};

export const previewPatientReport = async (reportId) => {
    const response = await patientRequest({
        method: "get",
        url: ENDPOINTS.PATIENT.REPORT_PREVIEW(reportId),
    });

    return unwrap(response);
};

// PROFILE
export const getPatientProfile = async () => {
    const response = await patientRequest({ method: "get", url: ENDPOINTS.PATIENT.PROFILE });
    return unwrap(response);
};

export const updatePatientProfile = async (payload) => {
    const response = await patientRequest({
        method: "patch",
        url: ENDPOINTS.PATIENT.PROFILE,
        data: payload,
    });
    return unwrap(response);
};

export const updatePatientProfilePhoto = async (photo) => {
    const payload = new FormData();
    payload.append("photo", photo);

    const response = await patientRequest({
        method: "patch",
        url: ENDPOINTS.PATIENT.PROFILE_PHOTO,
        data: payload,
        headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(response);
};

// SETTINGS
export const getPatientSettings = async () => {
    const response = await patientRequest({
        method: "get",
        url: ENDPOINTS.PATIENT.SETTINGS,
    });

    return unwrap(response);
};

export const updatePatientAccountSettings = async (payload) => {
    const response = await patientRequest({
        method: "patch",
        url: ENDPOINTS.PATIENT.SETTINGS_ACCOUNT,
        data: payload,
    });

    return unwrap(response);
};

export const updatePatientNotificationSettings = async (payload) => {
    const response = await patientRequest({
        method: "patch",
        url: ENDPOINTS.PATIENT.SETTINGS_NOTIFICATIONS,
        data: payload,
    });

    return unwrap(response);
};

export const updatePatientPreferences = async (payload) => {
    const response = await patientRequest({
        method: "patch",
        url: ENDPOINTS.PATIENT.SETTINGS_PREFERENCES,
        data: payload,
    });

    return unwrap(response);
};

// NOTIFICATIONS
export const getPatientNotifications = async (params) => {
    const response = await patientRequest({ 
        method: "get", 
        url: ENDPOINTS.PATIENT.NOTIFICATIONS,
        params: normalizePaginationParams(params)
    });
    return response.data;
};

export const markPatientNotificationAsRead = async (notificationId) => {
    const response = await patientRequest({ method: "patch", url: ENDPOINTS.PATIENT.NOTIFICATION_READ(notificationId) });
    return unwrap(response);
};

export const markAllPatientNotificationsAsRead = async () => {
    const response = await patientRequest({ method: "patch", url: ENDPOINTS.PATIENT.NOTIFICATIONS_READ_ALL });
    return unwrap(response);
};

// DOCTORS & VERIFICATION
export const getAvailableDoctors = async () => {
    const response = await patientRequest({ method: "get", url: ENDPOINTS.PATIENT.AVAILABLE_DOCTORS });
    return unwrap(response);
};

export const submitVerificationRequest = async (payload) => {
    const response = await patientRequest({
        method: "post",
        url: ENDPOINTS.PATIENT.VERIFICATION_REQUESTS,
        data: payload,
    });
    return unwrap(response);
};

// CONSULTATIONS & CHAT

export const initiateConsultation = async (payload) => {
    const response = await patientRequest({ 
        method: "post", 
        url: ENDPOINTS.PATIENT.CONSULTATION_INITIATE, 
        data: payload 
    });
    return unwrap(response);
};

export const getConsultations = async (params) => {
    const response = await patientRequest({ 
        method: "get", 
        url: ENDPOINTS.PATIENT.CONSULTATIONS,
        params: normalizePaginationParams(params)
    });
    return response.data;
};

const closedConsultationStatuses = new Set(["closed", "case_resolved", "resolved", "completed"]);

export function isActiveConsultation(consultation = {}) {
    const status = String(consultation.status || consultation.caseStatus || "").toLowerCase();
    return Boolean(consultation.id || consultation.consultationId) && !closedConsultationStatuses.has(status);
}

export const getActiveConsultation = async () => {
    const response = await getConsultations({ page: 1, limit: 50 });
    const consultations = extractConsultationList(response);
    return consultations.find(isActiveConsultation) || null;
};

export const getConsultationDetail = async (consultationId) => {
    const response = await patientRequest({ 
        method: "get", 
        url: ENDPOINTS.PATIENT.CONSULTATION_DETAIL(consultationId) 
    });
    return unwrap(response);
};

export const getConsultationMessages = async (consultationId, params) => {
    const response = await patientRequest({ 
        method: "get", 
        url: ENDPOINTS.PATIENT.CONSULTATION_MESSAGES(consultationId),
        params: normalizePaginationParams(params)
    });
    return response.data;
};

export const sendConsultationMessage = async (consultationId, message, file = null) => {
    if (file) {
        const formData = new FormData();
        formData.append('message', message || '');
        formData.append('attachments', file); 
        
        const response = await patientRequest({ 
            method: "post", 
            url: ENDPOINTS.PATIENT.CONSULTATION_MESSAGES(consultationId), 
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return unwrap(response);
    }
    
    const response = await patientRequest({ 
        method: "post", 
        url: ENDPOINTS.PATIENT.CONSULTATION_MESSAGES(consultationId), 
        data: { message } 
    });
    return unwrap(response);
};

export const getConsultationSSEUrl = (consultationId) => {
    return `${patientBaseURL}${ENDPOINTS.PATIENT.CONSULTATION_EVENTS(consultationId)}`;
};

export const markConsultationMessagesAsRead = async (consultationId, messageIds) => {
    const response = await patientRequest({ 
        method: "patch", 
        url: ENDPOINTS.PATIENT.CONSULTATION_READ(consultationId), 
        data: { messageIds } 
    });
    return unwrap(response);
};

export const markAllConsultationMessagesAsRead = async (consultationId) => {
    const response = await patientRequest({ 
        method: "patch", 
        url: ENDPOINTS.PATIENT.CONSULTATION_READ_ALL(consultationId) 
    });
    return unwrap(response);
};

export const sendTypingStatus = async (consultationId, isTyping) => {
    const response = await patientRequest({
        method: "post",
        url: ENDPOINTS.PATIENT.CONSULTATION_TYPING(consultationId),
        data: { isTyping }
    });
    return unwrap(response);
};

export const getConsultationAiAnalysis = async (consultationId) => {
    const response = await patientRequest({ 
        method: "get", 
        url: ENDPOINTS.PATIENT.CONSULTATION_AI_ANALYSIS(consultationId) 
    });
    return unwrap(response);
};

function unwrapListResponse(payload) {
    const nestedPayload = payload?.data && !Array.isArray(payload.data) ? payload.data : null;
    const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(nestedPayload?.data)
                ? nestedPayload.data
                : Array.isArray(payload?.reports)
                    ? payload.reports
                    : Array.isArray(nestedPayload?.reports)
                        ? nestedPayload.reports
                        : [];

    const meta = payload?.meta || payload?.pagination || nestedPayload?.meta || nestedPayload?.pagination || {
        page: 1,
        limit: data.length,
        total: data.length,
        totalPages: 1,
    };

    return {
        data,
        meta,
        status: payload?.status,
    };
}

function extractConsultationList(payload) {
    const nestedPayload = payload?.data && !Array.isArray(payload.data) ? payload.data : null;

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(nestedPayload?.data)) return nestedPayload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(nestedPayload?.items)) return nestedPayload.items;

    return [];
}

async function unwrapDownloadResponse(response) {
    const contentType = response.headers?.["content-type"] || response.data?.type || "";

    if (response.data instanceof Blob && contentType.includes("application/json")) {
        const text = await response.data.text();
        const payload = text ? JSON.parse(text) : {};
        return payload?.data ?? payload;
    }

    if (response.data instanceof Blob) {
        return {
            blob: response.data,
            fileName: getFileNameFromDisposition(response.headers?.["content-disposition"]),
            contentType,
        };
    }

    return unwrap(response);
}

function getFileNameFromDisposition(disposition = "") {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
    return match ? decodeURIComponent(match[1]) : "";
}

// ==================== AI CHATBOT ====================

// Tambahkan/Ubah di bagian paling bawah patientService.js
export const getAiChatHistory = async (consultationId) => {
    try {
        const response = await patientRequest({ 
            method: "get", 
            url: `/ai-consultations/${consultationId}/messages` 
        });
        return response.data?.data || response.data || response;
    } catch (error) {
        // TANGKAP ERROR 404: Sesi AI belum dibuat di database
        if (error.response && error.response.status === 404) {
            return []; // Kembalikan array kosong agar UI tampil bersih
        }
        throw error;
    }
};

export const sendAiChatMessage = async (consultationId, message) => {
    const response = await patientRequest({ 
        method: "post", 
        url: `/ai-consultations/${consultationId}/messages`, 
        data: { message } 
    });
    return response.data?.data || response.data || response;
};
