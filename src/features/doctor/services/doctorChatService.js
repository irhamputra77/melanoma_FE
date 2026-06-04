import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";

const apiBaseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3300/api";
const doctorBaseURL = import.meta.env.VITE_DOCTOR_API_BASE_URL || `${apiBaseURL.replace(/\/$/, "")}/v1/doctor`;
const doctorChatRequest = (config) => api.request({ baseURL: doctorBaseURL, ...config });
const unwrap = (response) => response.data?.data ?? response.data;

export const getDoctorConsultations = async (params = {}) => {
    const response = await doctorChatRequest({
        method: "get",
        url: ENDPOINTS.DOCTOR.CONSULTATIONS,
        params: normalizePaginationParams(params),
    });

    return normalizePaginatedResponse(response.data, params);
};

export const getDoctorConsultationDetail = async (consultationId) => {
    assertConsultationId(consultationId);

    const response = await doctorChatRequest({
        method: "get",
        url: ENDPOINTS.DOCTOR.CONSULTATION_DETAIL(consultationId),
    });

    return unwrap(response);
};

export const getDoctorConsultationMessages = async (consultationId, params = {}) => {
    assertConsultationId(consultationId);

    const response = await doctorChatRequest({
        method: "get",
        url: ENDPOINTS.DOCTOR.CONSULTATION_MESSAGES(consultationId),
        params: normalizePaginationParams({ page: 1, limit: 20, ...params }),
    });

    return normalizePaginatedResponse(response.data, params);
};

export const sendDoctorConsultationMessage = async (consultationId, payload = {}) => {
    assertConsultationId(consultationId);
    const formData = toMessageFormData(payload);

    const response = await doctorChatRequest({
        method: "post",
        url: ENDPOINTS.DOCTOR.CONSULTATION_MESSAGES(consultationId),
        data: formData,
    });

    return unwrap(response);
};

export const closeDoctorConsultation = async (consultationId, payload) => {
    assertConsultationId(consultationId);

    const response = await doctorChatRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.CONSULTATION_CLOSE(consultationId),
        data: payload,
    });

    return unwrap(response);
};

export const deleteDoctorConsultation = async (consultationId) => {
    assertConsultationId(consultationId);

    const response = await doctorChatRequest({
        method: "delete",
        url: ENDPOINTS.DOCTOR.CONSULTATION_DETAIL(consultationId),
    });

    return unwrap(response);
};

export const markDoctorConsultationMessagesAsRead = async (consultationId, messageIds = []) => {
    assertConsultationId(consultationId);

    const response = await doctorChatRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.CONSULTATION_READ(consultationId),
        data: { messageIds },
    });

    return unwrap(response);
};

export const markAllDoctorConsultationMessagesAsRead = async (consultationId) => {
    assertConsultationId(consultationId);

    const response = await doctorChatRequest({
        method: "patch",
        url: ENDPOINTS.DOCTOR.CONSULTATION_READ_ALL(consultationId),
    });

    return unwrap(response);
};

export const sendDoctorTypingStatus = async (consultationId, isTyping) => {
    assertConsultationId(consultationId);

    const response = await doctorChatRequest({
        method: "post",
        url: ENDPOINTS.DOCTOR.CONSULTATION_TYPING(consultationId),
        data: { isTyping },
    });

    return unwrap(response);
};

function normalizePaginationParams(params = {}) {
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 10);

    const queryParams = {
        page: Number.isFinite(page) && page > 0 ? page : 1,
        limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    };

    ["search", "status", "startDate", "endDate"].forEach((key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
            queryParams[key] = params[key];
        }
    });

    return queryParams;
}

function normalizePaginatedResponse(payload, params = {}) {
    if (payload?.status === "error") {
        throw new Error(payload.message || "Failed to fetch consultation data.");
    }

    const normalizedParams = normalizePaginationParams(params);
    const data = Array.isArray(payload?.data?.data)
        ? payload.data.data
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data?.items)
                ? payload.data.items
                : [];
    const meta = payload?.meta || payload?.pagination || payload?.data?.meta || payload?.data?.pagination || {};

    return {
        data,
        meta: {
            page: Number(meta.page || normalizedParams.page),
            limit: Number(meta.limit || normalizedParams.limit),
            total: Number(meta.total || data.length),
            lastPage: Number(meta.lastPage || meta.totalPages || 1),
        },
        raw: payload,
    };
}

function toMessageFormData(payload) {
    const messagePayload = typeof payload === "string" ? { message: payload } : payload || {};
    const formData = new FormData();
    const message = messagePayload.message || "";
    const attachments = Array.isArray(messagePayload.attachments) ? messagePayload.attachments : [];

    if (message.trim()) {
        formData.append("message", message);
    }

    attachments.forEach((file) => {
        formData.append("attachments", file);
    });

    return formData;
}

function assertConsultationId(consultationId) {
    if (!consultationId) {
        throw new Error("consultationId is required.");
    }
}
