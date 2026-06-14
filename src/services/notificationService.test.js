import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import {
    getRoleNotifications,
    markAllRoleNotificationsAsRead,
    markRoleNotificationAsRead,
} from "./notificationService";

vi.mock("./api", () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

describe("notificationService", () => {
    beforeEach(() => {
        api.get.mockReset();
        api.patch.mockReset();
    });

    it("normalizes admin notification responses with nested data.data", async () => {
        api.get.mockResolvedValue({
            data: {
                status: "success",
                data: {
                    unreadCount: 1,
                    data: [
                        {
                            notificationId: "notif-1",
                            title: "New doctor approval request",
                            message: "Irham Kurnia Putra is waiting for approval",
                            type: "doctor_approval",
                            isRead: false,
                        },
                    ],
                },
            },
        });

        const result = await getRoleNotifications("admin");

        expect(api.get).toHaveBeenCalledWith("/v1/admin/notifications", {
            params: { page: 1, limit: 5 },
        });
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatchObject({
            notificationId: "notif-1",
            type: "doctor_approval",
        });
        expect(result.unreadCount).toBe(1);
    });

    it("fetches doctor notifications and uses the backend unreadCount field", async () => {
        api.get.mockResolvedValue({
            data: {
                status: "success",
                unreadCount: 2,
                data: [
                    {
                        notificationId: "chat-1",
                        title: "Pesan Baru dari Sarah Johnson",
                        type: "system_message",
                        isRead: false,
                    },
                    {
                        notificationId: "verification-1",
                        title: "New Verification Request",
                        type: "verification_alert",
                        isRead: false,
                    },
                ],
            },
        });

        const result = await getRoleNotifications("doctor");

        expect(api.get).toHaveBeenCalledWith("/v1/doctor/notifications", {
            params: { page: 1, limit: 5 },
        });
        expect(result.unreadCount).toBe(2);
        expect(result.data.map((notification) => notification.notificationId)).toEqual([
            "chat-1",
            "verification-1",
        ]);
    });

    it("marks doctor notifications as read", async () => {
        api.patch.mockResolvedValue({
            data: {
                status: "success",
                message: "Notification marked as read",
            },
        });

        await markRoleNotificationAsRead("doctor", "notif-1");

        expect(api.patch).toHaveBeenCalledWith("/v1/doctor/notifications/notif-1/read");
    });

    it("marks all doctor notifications as read", async () => {
        api.patch.mockResolvedValue({
            data: {
                status: "success",
                message: "All notifications marked as read",
            },
        });

        await markAllRoleNotificationsAsRead("doctor");

        expect(api.patch).toHaveBeenCalledWith("/v1/doctor/notifications/read-all");
    });
});
