import api from "./api";

const supportedRoles = new Set(["doctor", "patient", "admin"]);

export async function getRoleNotifications(role, params = {}) {
    const safeRole = supportedRoles.has(role) ? role : "doctor";
    const response = await api.get(`/v1/${safeRole}/notifications`, {
        params: {
            page: Number(params.page || 1),
            limit: Number(params.limit || 5),
        },
    });

    return normalizeNotificationsResponse(response.data);
}

export async function markRoleNotificationAsRead(role, notificationId) {
    const safeRole = supportedRoles.has(role) ? role : "doctor";
    const response = await api.patch(`/v1/${safeRole}/notifications/${notificationId}/read`);
    return response.data?.data ?? response.data;
}

export async function markAllRoleNotificationsAsRead(role) {
    const safeRole = supportedRoles.has(role) ? role : "doctor";
    const response = await api.patch(`/v1/${safeRole}/notifications/read-all`);
    return response.data?.data ?? response.data;
}

function normalizeNotificationsResponse(payload) {
    if (payload?.status === "error") {
        throw new Error(payload.message || "Failed to fetch notifications.");
    }

    const data = payload?.data;
    const notifications = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
            ? data.data
        : Array.isArray(data?.notifications)
            ? data.notifications
            : Array.isArray(payload?.notifications)
                ? payload.notifications
                : [];

    return {
        status: payload?.status || "success",
        data: notifications,
        meta: payload?.meta || data?.meta || {},
        unreadCount: data?.unreadCount ?? payload?.unreadCount ?? notifications.filter((notification) => !notification.isRead).length,
    };
}
