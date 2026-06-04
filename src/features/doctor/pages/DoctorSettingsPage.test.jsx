import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DoctorSettingsPage from "./DoctorSettingsPage";
import {
    getDoctorSettings,
    updateDoctorAccountSettings,
    updateDoctorNotificationSettings,
} from "../services/doctorService";

vi.mock("../services/doctorService", () => ({
    getDoctorSettings: vi.fn(),
    updateDoctorAccountSettings: vi.fn(),
    updateDoctorNotificationSettings: vi.fn(),
    updateDoctorPreferences: vi.fn(),
}));

describe("DoctorSettingsPage", () => {
    beforeEach(() => {
        getDoctorSettings.mockReset();
        updateDoctorAccountSettings.mockReset();
        updateDoctorNotificationSettings.mockReset();
        getDoctorSettings.mockResolvedValue({
            account: {
                email: "doctor@example.com",
            },
            notifications: {
                emailNotifications: true,
                verificationAlerts: false,
            },
        });
    });

    it("submits a password update from the doctor settings form", async () => {
        const user = userEvent.setup();
        updateDoctorAccountSettings.mockResolvedValue({});

        render(<DoctorSettingsPage />);

        expect(await screen.findByDisplayValue("doctor@example.com")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Change" }));
        await user.type(screen.getByLabelText("Current Password"), "oldpass123");
        await user.type(screen.getByLabelText("New Password"), "newpass123");
        await user.type(screen.getByLabelText("Confirm New Password"), "newpass123");
        await user.click(screen.getByRole("button", { name: "Update Password" }));

        await waitFor(() => {
            expect(updateDoctorAccountSettings).toHaveBeenCalledWith({
                currentPassword: "oldpass123",
                newPassword: "newpass123",
            });
        });
        expect(await screen.findByText("Password updated.")).toBeInTheDocument();
    });

    it("blocks a password update when confirmation does not match", async () => {
        const user = userEvent.setup();

        render(<DoctorSettingsPage />);

        expect(await screen.findByDisplayValue("doctor@example.com")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Change" }));
        await user.type(screen.getByLabelText("Current Password"), "oldpass123");
        await user.type(screen.getByLabelText("New Password"), "newpass123");
        await user.type(screen.getByLabelText("Confirm New Password"), "different123");
        await user.click(screen.getByRole("button", { name: "Update Password" }));

        expect(await screen.findByText("New password confirmation does not match.")).toBeInTheDocument();
        expect(updateDoctorAccountSettings).not.toHaveBeenCalled();
    });

    it("removes privacy and two-factor controls from doctor settings", async () => {
        render(<DoctorSettingsPage />);

        expect(await screen.findByDisplayValue("doctor@example.com")).toBeInTheDocument();
        expect(screen.queryByText("Two-Factor Authentication")).not.toBeInTheDocument();
        expect(screen.queryByText("Privacy Settings")).not.toBeInTheDocument();
        expect(screen.queryByText("Data Visibility")).not.toBeInTheDocument();
    });

    it("sends notification settings when toggled off and on", async () => {
        const user = userEvent.setup();
        updateDoctorNotificationSettings.mockResolvedValue({});

        render(<DoctorSettingsPage />);

        expect(await screen.findByDisplayValue("doctor@example.com")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Email Notifications/i }));

        await waitFor(() => {
            expect(updateDoctorNotificationSettings).toHaveBeenCalledWith({
                emailNotifications: false,
                verificationAlerts: false,
            });
        });

        await user.click(screen.getByRole("button", { name: /Email Notifications/i }));

        await waitFor(() => {
            expect(updateDoctorNotificationSettings).toHaveBeenLastCalledWith({
                emailNotifications: true,
                verificationAlerts: false,
            });
        });
    });
});
