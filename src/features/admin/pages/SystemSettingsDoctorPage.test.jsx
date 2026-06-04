import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SystemSettingsDoctorPage from "./SystemSettingsDoctorPage";
import {
    cleanupAdminAuditLogs,
    cleanupAdminSystemLogs,
    getAdminSettings,
    updateAdminAccountSettings,
    updateAdminNotificationSettings,
    updateAdminOperationsSettings,
    updateAdminPreferences,
} from "../services/adminService";

vi.mock("../services/adminService", () => ({
    cleanupAdminAuditLogs: vi.fn(),
    cleanupAdminSystemLogs: vi.fn(),
    getAdminSettings: vi.fn(),
    updateAdminAccountSettings: vi.fn(),
    updateAdminNotificationSettings: vi.fn(),
    updateAdminOperationsSettings: vi.fn(),
    updateAdminPreferences: vi.fn(),
    updateAdminPrivacySettings: vi.fn(),
    updateAdminTwoFactor: vi.fn(),
}));

describe("SystemSettingsDoctorPage", () => {
    beforeEach(() => {
        getAdminSettings.mockReset();
        updateAdminAccountSettings.mockReset();
        updateAdminNotificationSettings.mockReset();
        updateAdminOperationsSettings.mockReset();
        updateAdminPreferences.mockReset();
        cleanupAdminAuditLogs.mockReset();
        cleanupAdminSystemLogs.mockReset();
        sessionStorage.clear();
        getAdminSettings.mockResolvedValue({
            account: {
                email: "admin@example.com",
            },
            notifications: {
                doctorApprovalAlerts: false,
                clinicRequestAlerts: true,
                systemAlerts: true,
            },
            operations: {
                defaultPageSize: 8,
                auditLogRetentionDays: 180,
                maintenanceMode: false,
                deleteConfirmationRequired: true,
            },
            preferences: {
                language: "English (US)",
                timezone: "Asia/Jakarta",
            },
        });
    });

    it("submits a password update from the account settings form", async () => {
        const user = userEvent.setup();
        updateAdminAccountSettings.mockResolvedValue({});

        render(<SystemSettingsDoctorPage />);

        expect(await screen.findByDisplayValue("admin@example.com")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Change" }));
        await user.type(screen.getByLabelText("Current Password"), "oldpass123");
        await user.type(screen.getByLabelText("New Password"), "newpass123");
        await user.type(screen.getByLabelText("Confirm New Password"), "newpass123");
        await user.click(screen.getByRole("button", { name: "Update Password" }));

        await waitFor(() => {
            expect(updateAdminAccountSettings).toHaveBeenCalledWith({
                currentPassword: "oldpass123",
                newPassword: "newpass123",
            });
        });
        expect(await screen.findByText("Password updated.")).toBeInTheDocument();
    });

    it("blocks a password update when confirmation does not match", async () => {
        const user = userEvent.setup();

        render(<SystemSettingsDoctorPage />);

        expect(await screen.findByDisplayValue("admin@example.com")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Change" }));
        await user.type(screen.getByLabelText("Current Password"), "oldpass123");
        await user.type(screen.getByLabelText("New Password"), "newpass123");
        await user.type(screen.getByLabelText("Confirm New Password"), "different123");
        await user.click(screen.getByRole("button", { name: "Update Password" }));

        expect(await screen.findByText("New password confirmation does not match.")).toBeInTheDocument();
        expect(updateAdminAccountSettings).not.toHaveBeenCalled();
    });

    it("saves admin notifications, operations, preferences, and maintenance mode", async () => {
        const user = userEvent.setup();
        updateAdminAccountSettings.mockResolvedValue({});
        updateAdminNotificationSettings.mockResolvedValue({});
        updateAdminOperationsSettings.mockResolvedValue({});
        updateAdminPreferences.mockResolvedValue({});

        render(<SystemSettingsDoctorPage />);

        expect(await screen.findByDisplayValue("admin@example.com")).toBeInTheDocument();
        expect(screen.queryByText("Two-Factor Authentication")).not.toBeInTheDocument();
        expect(screen.queryByText("Privacy Settings")).not.toBeInTheDocument();
        expect(screen.queryByText("Email Notifications")).not.toBeInTheDocument();
        expect(screen.queryByText("Weekly Admin Digest")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Doctor Approval Queue" }));
        await user.selectOptions(screen.getByLabelText("Default Table Page Size"), "16");
        await user.selectOptions(screen.getByLabelText("Audit Log Retention"), "365");
        await user.click(screen.getByRole("button", { name: "Maintenance Mode" }));
        await user.click(screen.getByRole("button", { name: "Require Delete Confirmation" }));
        await user.selectOptions(screen.getByLabelText("Language"), "Bahasa Indonesia");
        await user.selectOptions(screen.getByLabelText("Timezone"), "UTC");
        await user.click(screen.getByRole("button", { name: "Save Admin Settings" }));

        await waitFor(() => {
            expect(updateAdminNotificationSettings).toHaveBeenCalledWith({
                doctorApprovalAlerts: true,
                clinicRequestAlerts: true,
                systemAlerts: true,
            });
            expect(updateAdminOperationsSettings).toHaveBeenCalledWith({
                defaultPageSize: 16,
                auditLogRetentionDays: 365,
                maintenanceMode: true,
                deleteConfirmationRequired: false,
            });
            expect(updateAdminPreferences).toHaveBeenCalledWith({
                language: "Bahasa Indonesia",
                timezone: "UTC",
            });
        });
        expect(updateAdminAccountSettings).not.toHaveBeenCalled();
        expect(sessionStorage.getItem("maintenanceMode")).toBe("true");
        expect(JSON.parse(sessionStorage.getItem("adminOperationsSettings"))).toMatchObject({
            defaultPageSize: 16,
            auditLogRetentionDays: 365,
            maintenanceMode: true,
            deleteConfirmationRequired: false,
        });
        expect(JSON.parse(sessionStorage.getItem("adminPreferences"))).toMatchObject({
            language: "Bahasa Indonesia",
            timezone: "UTC",
        });
        expect(sessionStorage.getItem("appLanguage")).toBe("Bahasa Indonesia");
        expect(await screen.findByText("Admin settings saved.")).toBeInTheDocument();
    });

    it("can trigger audit log cleanup from operational defaults", async () => {
        const user = userEvent.setup();
        cleanupAdminAuditLogs.mockResolvedValue({ deletedCount: 7 });

        render(<SystemSettingsDoctorPage />);

        expect(await screen.findByDisplayValue("admin@example.com")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Run Audit Cleanup" }));

        await waitFor(() => {
            expect(cleanupAdminAuditLogs).toHaveBeenCalled();
        });
        expect(await screen.findByText("Audit log cleanup selesai. 7 record dihapus.")).toBeInTheDocument();
    });

    it("can trigger system log cleanup from operational defaults", async () => {
        const user = userEvent.setup();
        cleanupAdminSystemLogs.mockResolvedValue({ deletedCount: 3 });

        render(<SystemSettingsDoctorPage />);

        expect(await screen.findByDisplayValue("admin@example.com")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Run System Cleanup" }));

        await waitFor(() => {
            expect(cleanupAdminSystemLogs).toHaveBeenCalledWith(180);
        });
        expect(await screen.findByText("System log cleanup selesai. 3 record dihapus.")).toBeInTheDocument();
    });

    it("only submits preferences when only language or timezone changes", async () => {
        const user = userEvent.setup();
        updateAdminPreferences.mockResolvedValue({});

        render(<SystemSettingsDoctorPage />);

        expect(await screen.findByDisplayValue("admin@example.com")).toBeInTheDocument();

        await user.selectOptions(screen.getByLabelText("Language"), "Bahasa Indonesia");
        await user.click(screen.getByRole("button", { name: "Save Admin Settings" }));

        await waitFor(() => {
            expect(updateAdminPreferences).toHaveBeenCalledWith({
                language: "Bahasa Indonesia",
                timezone: "Asia/Jakarta",
            });
        });
        expect(updateAdminAccountSettings).not.toHaveBeenCalled();
        expect(updateAdminNotificationSettings).not.toHaveBeenCalled();
        expect(updateAdminOperationsSettings).not.toHaveBeenCalled();
        expect(await screen.findByText("Admin settings saved.")).toBeInTheDocument();
    });

    it("toggles every admin notification setting and submits the updated notification payload", async () => {
        const user = userEvent.setup();
        updateAdminAccountSettings.mockResolvedValue({});
        updateAdminNotificationSettings.mockResolvedValue({});
        updateAdminOperationsSettings.mockResolvedValue({});
        updateAdminPreferences.mockResolvedValue({});

        render(<SystemSettingsDoctorPage />);

        expect(await screen.findByDisplayValue("admin@example.com")).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Doctor Approval Queue" })).toHaveAttribute("aria-pressed", "false");
        expect(screen.getByRole("button", { name: "Clinic Request Queue" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", { name: "Critical System Alerts" })).toHaveAttribute("aria-pressed", "true");

        await user.click(screen.getByRole("button", { name: "Doctor Approval Queue" }));
        await user.click(screen.getByRole("button", { name: "Clinic Request Queue" }));
        await user.click(screen.getByRole("button", { name: "Critical System Alerts" }));
        await user.click(screen.getByRole("button", { name: "Save Admin Settings" }));

        await waitFor(() => {
            expect(updateAdminNotificationSettings).toHaveBeenCalledWith({
                doctorApprovalAlerts: true,
                clinicRequestAlerts: false,
                systemAlerts: false,
            });
        });
    });
});
