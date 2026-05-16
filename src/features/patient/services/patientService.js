import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";

const patientBaseURL = import.meta.env.VITE_PATIENT_API_BASE_URL || "http://localhost:3000/api/v1/patient";
const unwrap = (response) => response.data?.data ?? response.data;
const patientRequest = (config) => api.request({ baseURL: patientBaseURL, ...config });


// UTILS
function normalizePaginationParams(params = {}) {
    const queryParams = {};
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 10);

    queryParams.page = Number.isFinite(page) && page > 0 ? page : 1;
    queryParams.limit = Number.isFinite(limit) && limit > 0 ? limit : 10;
    
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

export const analyzePatientScan = async (scanId) => {
    const response = await patientRequest({ method: "post", url: ENDPOINTS.PATIENT.SCAN_ANALYZE(scanId) });
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
    return response.data;
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
        params: normalizePaginationParams(params)
    });
    return response.data;
};

export const getPatientReportDetail = async (reportId) => {
    const response = await patientRequest({ method: "get", url: ENDPOINTS.PATIENT.REPORT_DETAIL(reportId) });
    return unwrap(response);
};

export const downloadPatientReport = async (reportId) => {
    const response = await patientRequest({ 
        method: "get", 
        url: ENDPOINTS.PATIENT.REPORT_DOWNLOAD(reportId),
        responseType: "blob"
    });
    return response.data; 
};

export const previewPatientReport = async (reportId) => {
    const response = await patientRequest({ method: "get", url: ENDPOINTS.PATIENT.REPORT_PREVIEW(reportId) });
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
    const response = await patientRequest({ method: "get", url: ENDPOINTS.PATIENT.SETTINGS });
    return unwrap(response);
};

export const updatePatientAccountSettings = async (payload) => {
    const response = await patientRequest({ method: "patch", url: ENDPOINTS.PATIENT.SETTINGS_ACCOUNT, data: payload });
    return unwrap(response);
};

export const updatePatientTwoFactor = async (enabled) => {
    const response = await patientRequest({ method: "patch", url: ENDPOINTS.PATIENT.SETTINGS_2FA, data: { enabled } });
    return unwrap(response);
};

export const updatePatientNotificationSettings = async (payload) => {
    const response = await patientRequest({ method: "patch", url: ENDPOINTS.PATIENT.SETTINGS_NOTIFICATIONS, data: payload });
    return unwrap(response);
};

export const updatePatientPrivacySettings = async (payload) => {
    const response = await patientRequest({ method: "patch", url: ENDPOINTS.PATIENT.SETTINGS_PRIVACY, data: payload });
    return unwrap(response);
};

export const updatePatientPreferences = async (payload) => {
    const response = await patientRequest({ method: "patch", url: ENDPOINTS.PATIENT.SETTINGS_PREFERENCES, data: payload });
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