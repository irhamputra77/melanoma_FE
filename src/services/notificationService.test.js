import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { getRoleNotifications } from "./notificationService";

vi.mock("./api", () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

describe("notificationService", () => {
    beforeEach(() => {
        api.get.mockReset();
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
});
