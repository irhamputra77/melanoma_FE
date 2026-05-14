import api from "../../../services/api";

const adminBaseURL = import.meta.env.VITE_ADMIN_API_BASE_URL || "http://localhost:3300/api/v1/admin";
const unwrap = (response) => response.data?.data ?? response.data;
const adminRequest = (config) => api.request({ baseURL: adminBaseURL, ...config });

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

export const getAdminSystemLogs = async (params = {}) => {
    const response = await adminRequest({
        method: "get",
        url: "/system/logs",
        params: {
            type: params.type || "system",
            severity: params.severity || "info",
            page: Number(params.page || 1),
            limit: Number(params.limit || 3),
        },
    });
    return response.data;
};

export const getAdminUsers = async (params = {}) => {
    const response = await adminRequest({
        method: "get",
        url: "/users",
        params: {
            search: params.search || undefined,
            role: params.role || undefined,
            status: params.status || undefined,
            page: Number(params.page || 1),
            limit: Number(params.limit || 8),
            sortBy: params.sortBy || "createdAt",
            sortOrder: params.sortOrder || "desc",
        },
    });
    return response.data;
};

export const createAdminUser = async (payload) => {
    const response = await adminRequest({ method: "post", url: "/users", data: payload });
    return unwrap(response);
};

export const updateAdminUser = async (userId, payload) => {
    const response = await adminRequest({ method: "patch", url: `/users/${userId}`, data: payload });
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
            status: params.status || undefined,
            page: Number(params.page || 1),
            limit: Number(params.limit || 8),
        },
    });
    return response.data;
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

export const getAdminSettings = async () => {
    const response = await adminRequest({ method: "get", url: "/settings" });
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

export const updateAdminPreferences = async (payload) => {
    const response = await adminRequest({ method: "patch", url: "/settings/preferences", data: payload });
    return unwrap(response);
};
