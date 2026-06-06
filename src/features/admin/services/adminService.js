import api from "../../../services/api";

const adminBaseURL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:3300/api/v1/admin";
const unwrap = (response) => response.data?.data ?? response.data;
const unwrapList = (response) => {
    const payload = response.data;
    const nestedPayload = payload?.data && !Array.isArray(payload.data) ? payload.data : null;
    const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(nestedPayload?.data)
                ? nestedPayload.data
                : [];
    const meta = payload?.meta || nestedPayload?.meta || {
        page: 1,
        limit: data.length,
        total: data.length,
    };

    return { data, meta, status: payload?.status };
};
const adminRequest = (config) => api.request({ baseURL: adminBaseURL, ...config });

const optionalNumber = (value) => (
    value === undefined || value === null || value === "" ? undefined : Number(value)
);
const optionalFilter = (value) => (
    value === undefined || value === null || value === "" || value === "all" ? undefined : value
);

const unwrapAdminLogList = (response) => {
    const envelope = response.data;
    const payload = envelope?.data || {};
    const data = Array.isArray(payload.data) ? payload.data : [];
    const meta = payload.meta || {
        page: 1,
        limit: data.length,
        total: data.length,
        totalPages: 1,
    };

    return {
        data,
        meta,
        status: envelope?.status,
    };
};

export const getAdminDashboardSummary = async () => {
    const response = await adminRequest({ method: "get", url: "/dashboard/summary" });
    return unwrap(response);
};

export const getAdminUserGrowth = async (range = "30d") => {
    const response = await adminRequest({
        method: "get",
        url: "/dashboard/user-growth",
        params: { range },
    });
    return unwrap(response);
};

export const getAdminRoleDistribution = async () => {
    const response = await adminRequest({ method: "get", url: "/dashboard/role-distribution" });
    return unwrap(response);
};

export const generateReport = async (payload) => {
    const response = await adminRequest({
        method: "post",
        url: "/dashboard/report/generate",
        data: payload,
    });
    return unwrap(response);
};

export const exportReport = async (params = {}) => {
    const response = await adminRequest({
        method: "get",
        url: "/dashboard/report/export",
        params: {
            startDate: params.startDate || undefined,
            endDate: params.endDate || undefined,
            reportType: params.reportType || undefined,
            format: params.format || undefined,
        },
    });
    return normalizeReportExportResponse(unwrap(response));
};

export const downloadReport = (downloadUrl) => {
    if (!downloadUrl) return;
    window.open(resolveDownloadUrl(downloadUrl), "_blank", "noopener,noreferrer");
};

export const getAdminSystemLogs = async (params = {}) => {
    const response = await adminRequest({
        method: "get",
        url: "/system/logs",
        params: {
            type: params.type || undefined,
            severity: params.severity || undefined,
            page: Number(params.page || 1),
            limit: optionalNumber(params.limit),
        },
    });
    return unwrapAdminLogList(response);
};

export const getAdminAuditLogs = async (params = {}) => {
    const response = await adminRequest({
        method: "get",
        url: "/audit-logs",
        params: {
            adminId: params.adminId || undefined,
            action: params.action || undefined,
            startDate: params.startDate || undefined,
            endDate: params.endDate || undefined,
            page: Number(params.page || 1),
            limit: optionalNumber(params.limit),
        },
    });
    return unwrapAdminLogList(response);
};

export const cleanupAdminSystemLogs = async (retentionDays) => {
    const response = await adminRequest({
        method: "post",
        url: "/system/logs/cleanup",
        data: retentionDays ? { retentionDays: Number(retentionDays) } : undefined,
    });
    return unwrap(response);
};

export const getAdminUsers = async (params = {}) => {
    const response = await adminRequest({
        method: "get",
        url: "/users",
        params: {
            search: params.search || undefined,
            role: optionalFilter(params.role),
            status: optionalFilter(params.status),
            page: Number(params.page || 1),
            limit: optionalNumber(params.limit),
            sortBy: params.sortBy || "createdAt",
            sortOrder: params.sortOrder || "desc",
        },
    });
    return unwrapList(response);
};

export const createAdminUser = async (payload) => {
    const response = await adminRequest({ method: "post", url: "/users", data: payload });
    return unwrap(response);
};

export const updateAdminUser = async (userId, payload) => {
    const response = await adminRequest({ method: "patch", url: `/users/${userId}`, data: payload });
    return unwrap(response);
};

export const updateAdminUserStatus = async (userId, status) => {
    const response = await adminRequest({ method: "patch", url: `/users/${userId}/status`, data: { status } });
    return unwrap(response);
};

export const resetAdminUserPassword = async (userId, newPassword) => {
    const response = await adminRequest({
        method: "patch",
        url: `/users/${userId}/reset-password`,
        data: { newPassword },
    });
    return unwrap(response);
};

export const deleteAdminUser = async (userId) => {
    const response = await adminRequest({ method: "delete", url: `/users/${userId}` });
    return unwrap(response);
};

export const getAdminDoctorsSummary = async () => {
    const response = await adminRequest({ method: "get", url: "/doctors/summary" });
    return unwrap(response);
};

export const getAdminDoctors = async (params = {}) => {
    const response = await adminRequest({
        method: "get",
        url: "/doctors",
        params: {
            search: params.search || undefined,
            status: optionalFilter(params.status),
            clinicId: optionalFilter(params.clinicId),
            page: Number(params.page || 1),
            limit: optionalNumber(params.limit),
        },
    });
    return unwrapList(response);
};

export const getAdminDoctorVerificationRequests = async (doctorId) => {
    const response = await adminRequest({
        method: "get",
        url: `/doctors/${doctorId}/verification-requests`,
    });
    return unwrap(response);
};

export const approveAdminDoctor = async (doctorId, payload) => {
    const response = await adminRequest({ method: "patch", url: `/doctors/${doctorId}/approve`, data: payload });
    return unwrap(response);
};

export const rejectAdminDoctor = async (doctorId, payload) => {
    const response = await adminRequest({ method: "patch", url: `/doctors/${doctorId}/reject`, data: payload });
    return unwrap(response);
};

export const updateAdminDoctorLicense = async (doctorId, medicalLicense) => {
    const payload = new FormData();
    payload.append("medicalLicense", medicalLicense);
    const response = await adminRequest({
        method: "patch",
        url: `/doctors/${doctorId}/license`,
        data: payload,
    });
    return unwrap(response);
};

export const getAdminSettings = async () => {
    const response = await adminRequest({ method: "get", url: "/settings" });
    return unwrap(response);
};

export const getAdminOperationsSettings = async () => {
    const response = await adminRequest({ method: "get", url: "/settings/operations" });
    return unwrap(response);
};

export const cleanupAdminAuditLogs = async () => {
    const response = await adminRequest({ method: "post", url: "/settings/operations/audit-log-cleanup" });
    return unwrap(response);
};

export const getAdminProfile = async () => {
    const response = await adminRequest({ method: "get", url: "/profile" });
    return unwrap(response);
};

export const updateAdminProfilePhoto = async (photo) => {
    const formData = new FormData();
    formData.append("photo", photo);

    const response = await adminRequest({
        method: "patch",
        url: "/profile/photo",
        data: formData,
    });
    return unwrap(response);
};

export const updateAdminAccountSettings = async (payload) => {
    const response = await adminRequest({ method: "patch", url: "/settings/account", data: payload });
    return unwrap(response);
};

export const updateAdminTwoFactor = async (enabled) => {
    const response = await adminRequest({ method: "patch", url: "/settings/2fa", data: { enabled } });
    return unwrap(response);
};

export const updateAdminNotificationSettings = async (payload) => {
    const response = await adminRequest({ method: "patch", url: "/settings/notifications", data: payload });
    return unwrap(response);
};

export const updateAdminPrivacySettings = async (payload) => {
    const response = await adminRequest({ method: "patch", url: "/settings/privacy", data: payload });
    return unwrap(response);
};

export const updateAdminOperationsSettings = async (payload) => {
    const response = await adminRequest({ method: "patch", url: "/settings/operations", data: payload });
    return unwrap(response);
};

export const updateAdminPreferences = async (payload) => {
    const response = await adminRequest({ method: "patch", url: "/settings/preferences", data: payload });
    return unwrap(response);
};

function normalizeReportExportResponse(payload) {
    return payload?.data ?? payload;
}

function resolveDownloadUrl(path) {
    if (typeof path !== "string") return "";
    if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) {
        return path;
    }

    const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3300/api";
    const baseUrl = apiUrl.split("/api")[0];
    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}
