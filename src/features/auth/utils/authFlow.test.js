import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDoctorVerificationStatus, normalizeVerificationStatus } from "./authFlow";
import { getDoctorProfile } from "../../doctor/services/doctorService";

vi.mock("../../doctor/services/doctorService", () => ({
    getDoctorProfile: vi.fn(),
}));

describe("authFlow doctor verification", () => {
    beforeEach(() => {
        getDoctorProfile.mockReset();
    });

    it("treats approved and active doctor statuses as verified", () => {
        expect(normalizeVerificationStatus("approved")).toBe("verified");
        expect(normalizeVerificationStatus("active")).toBe("verified");
        expect(normalizeVerificationStatus("approved-by-admin")).toBe("verified");
        expect(normalizeVerificationStatus(true)).toBe("verified");
    });

    it("reads nested approved status from login response", async () => {
        const status = await getDoctorVerificationStatus({
            data: {
                user: {
                    doctorProfile: {
                        practitionerStatus: {
                            status: "approved",
                        },
                    },
                },
            },
        });

        expect(status).toBe("verified");
        expect(getDoctorProfile).not.toHaveBeenCalled();
    });

    it("falls back to doctor profile status when login response omits verification status", async () => {
        getDoctorProfile.mockResolvedValue({
            doctorProfile: {
                isVerified: true,
            },
        });

        await expect(getDoctorVerificationStatus({ role: "doctor" })).resolves.toBe("verified");
    });
});
