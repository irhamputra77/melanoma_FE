import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";

const apiBaseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3300/api";
const doctorBaseURL = import.meta.env.VITE_DOCTOR_API_BASE_URL || `${apiBaseURL.replace(/\/$/, "")}/v1/doctor`;
const unwrap = (response) => response.data?.data ?? response.data;
const doctorRequest = (config) => api.request({ baseURL: doctorBaseURL, ...config });

export const getDoctorDashboardSummary = async () => {
    const response = await doctorRequest({ method: "get", url: ENDPOINTS.DOCTOR.DASHBOARD_SUMMARY });
    return unwrap(response);
};

export const getAssignedCases = async () => {
    const response = await doctorRequest({ method: "get", url: ENDPOINTS.DOCTOR.ASSIGNED_CASES });
    return unwrap(response);
};

export const getCaseDetails = async (caseId) => {
    const response = await doctorRequest({ method: "get", url: ENDPOINTS.DOCTOR.CASE_DETAIL(caseId) });
    return unwrap(response);
};

export const savePhysicianObservation = async (caseId, physicianObservation) => {
    const response = await doctorRequest({
        method: "post",
        url: ENDPOINTS.DOCTOR.CASE_OBSERVATION(caseId),
        data: { physicianObservation },
    });
    return unwrap(response);
};

export const approveCase = async (caseId, payload) => {
    const response = await doctorRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.CASE_APPROVE(caseId),
        data: payload,
    });
    return unwrap(response);
};

export const rejectCase = async (caseId, payload) => {
    const response = await doctorRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.CASE_REJECT(caseId),
        data: payload,
    });
    return unwrap(response);
};

export const getCaseHistory = async (params) => {
    const queryParams = normalizeCaseHistoryParams(params);
    const response = await doctorRequest({
        method: "get",
        url: ENDPOINTS.DOCTOR.CASE_HISTORY,
        params: queryParams,
    });
    return normalizeCaseHistoryResponse(response.data, queryParams);
};

export const downloadCaseHistoryPdf = async (params = {}) => {
    const queryParams = normalizeCaseHistoryParams({
        ...params,
        page: undefined,
        limit: undefined,
    });
    delete queryParams.page;
    delete queryParams.limit;

    const response = await doctorRequest({
        method: "get",
        url: ENDPOINTS.DOCTOR.CASE_HISTORY_DOWNLOAD,
        params: queryParams,
        responseType: "blob",
    });

    downloadBlobResponse(response, "MySkin_Doctor_Case_History.pdf");
    return response;
};

export const generateCaseReportPdf = async (caseId) => {
    if (!caseId) throw new Error("caseId is required.");

    const response = await doctorRequest({
        method: "post",
        url: ENDPOINTS.DOCTOR.CASE_REPORT_GENERATE(caseId),
        responseType: "blob",
    });

    downloadBlobResponse(response, `MySkin_Doctor_Case_Report_${caseId}.pdf`);
    return response;
};

function normalizeCaseHistoryParams(params = {}) {
    const queryParams = {};
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 10);

    queryParams.page = Number.isFinite(page) && page > 0 ? page : 1;
    queryParams.limit = Number.isFinite(limit) && limit > 0 ? limit : 10;

    ["search", "diagnosis", "status", "startDate", "endDate"].forEach((key) => {
        const value = params[key];
        if (value === undefined || value === null || value === "") return;

        queryParams[key] = key === "status" && value === "verified" ? "approved" : value;
    });

    return queryParams;
}

function normalizeCaseHistoryResponse(payload, queryParams) {
    if (payload?.status === "error") {
        throw new Error(payload.message || "Failed to fetch case history.");
    }

    const data = Array.isArray(payload?.data) ? payload.data : [];
    const meta = payload?.meta || {};

    return {
        status: payload?.status || "success",
        data,
        meta: {
            page: Number(meta.page || queryParams.page),
            limit: Number(meta.limit || queryParams.limit),
            total: Number(meta.total || 0),
        },
    };
}

function downloadBlobResponse(response, fallbackFileName) {
    const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: response.headers?.["content-type"] || "application/pdf" });
    const fileName = getFileNameFromDisposition(response.headers?.["content-disposition"]) || fallbackFileName;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function getFileNameFromDisposition(disposition = "") {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
    return match ? decodeURIComponent(match[1]) : "";
}

export const getPatientEvolution = async (patientId) => {
    const response = await doctorRequest({
        method: "get",
        url: ENDPOINTS.DOCTOR.PATIENT_EVOLUTION(patientId),
    });
    return unwrap(response);
};

export const getDoctorProfile = async () => {
    const response = await doctorRequest({ method: "get", url: ENDPOINTS.DOCTOR.PROFILE });
    return unwrap(response);
};

export const updateDoctorProfile = async (payload) => {
    const response = await doctorRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.PROFILE,
        data: payload,
    });
    return unwrap(response);
};

export const updateDoctorProfilePhoto = async (photo) => {
    const payload = new FormData();
    payload.append("photo", photo);

    const response = await doctorRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.PROFILE_PHOTO,
        data: payload,
    });

    return unwrap(response);
};

export const getDoctorSettings = async () => {
    const response = await doctorRequest({ method: "get", url: ENDPOINTS.DOCTOR.SETTINGS });
    return unwrap(response);
};

export const updateDoctorAccountSettings = async (payload) => {
    const response = await doctorRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.SETTINGS_ACCOUNT,
        data: payload,
    });
    return unwrap(response);
};

export const updateDoctorNotificationSettings = async (payload) => {
    const response = await doctorRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.SETTINGS_NOTIFICATIONS,
        data: payload,
    });
    return unwrap(response);
};

export const updateDoctorPreferences = async (payload) => {
    const response = await doctorRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.SETTINGS_PREFERENCES,
        data: payload,
    });
    return unwrap(response);
};

export const getDoctorNotifications = async () => {
    const response = await doctorRequest({ method: "get", url: ENDPOINTS.DOCTOR.NOTIFICATIONS });
    return response.data;
};

export const markDoctorNotificationAsRead = async (notificationId) => {
    const response = await doctorRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.NOTIFICATION_READ(notificationId),
    });
    return unwrap(response);
};

export const markAllDoctorNotificationsAsRead = async () => {
    const response = await doctorRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.NOTIFICATIONS_READ_ALL,
    });
    return unwrap(response);
};
