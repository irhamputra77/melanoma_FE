import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import GoogleAuthCallbackPage from "./GoogleAuthCallbackPage";
import { getDoctorProfile } from "../../doctor/services/doctorService";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");

    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

vi.mock("../../doctor/services/doctorService", () => ({
    getDoctorProfile: vi.fn(),
}));

describe("GoogleAuthCallbackPage", () => {
    beforeEach(() => {
        navigateMock.mockClear();
        getDoctorProfile.mockReset();
    });

    it("stores a Google session and redirects a patient", async () => {
        render(
            <MemoryRouter initialEntries={["/auth/google/callback?token=token-123&role=patient"]}>
                <GoogleAuthCallbackPage />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(sessionStorage.getItem("token")).toBe("token-123");
            expect(sessionStorage.getItem("role")).toBe("patient");
            expect(navigateMock).toHaveBeenCalledWith("/patient/dashboard", { replace: true });
        });
    });

    it("keeps an unverified doctor out after Google login", async () => {
        getDoctorProfile.mockResolvedValue({
            practitionerStatus: { status: "pending" },
        });

        render(
            <MemoryRouter initialEntries={["/auth/google/callback?token=token-123&role=doctor"]}>
                <GoogleAuthCallbackPage />
            </MemoryRouter>,
        );

        expect(await screen.findByText("Akun dokter Anda masih menunggu verifikasi admin.")).toBeInTheDocument();
        expect(sessionStorage.getItem("token")).toBeNull();
        expect(sessionStorage.getItem("role")).toBeNull();
        expect(navigateMock).not.toHaveBeenCalled();
    });
});
