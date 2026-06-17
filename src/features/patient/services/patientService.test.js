import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../../services/api";
import { analyzePatientScan, getActiveConsultation, isActiveConsultation, uploadPatientScan } from "./patientService";

vi.mock("../../../services/api", () => ({
    default: {
        request: vi.fn(),
    },
}));

describe("patientService scan analysis", () => {
    beforeEach(() => {
        api.request.mockReset();
    });

    it("unwraps patient scan upload data so callers can use id before scanId", async () => {
        const file = new File(["scan"], "scan.jpg", { type: "image/jpeg" });

        api.request.mockResolvedValue({
            data: {
                status: "success",
                data: {
                    scanId: "SCN-1780802995348",
                    id: "e6aec3b8-0021-41c5-bd2a-733545e22b08",
                    imageUrl: "/uploads/scan.jpg",
                },
            },
        });

        const result = await uploadPatientScan(file, "gatal kulit", "arm");
        const request = api.request.mock.calls[0][0];

        expect(request).toEqual(expect.objectContaining({
            method: "post",
            url: "/scans/upload",
        }));
        expect(request.data).toBeInstanceOf(FormData);
        expect(request.data.get("image")).toBe(file);
        expect(result).toEqual({
            scanId: "SCN-1780802995348",
            id: "e6aec3b8-0021-41c5-bd2a-733545e22b08",
            imageUrl: "/uploads/scan.jpg",
        });
    });

    it("posts analysis to the patient scan analyze endpoint with the selected identifier", async () => {
        api.request.mockResolvedValue({
            data: {
                status: "success",
                data: {
                    aiPrediction: "Benign",
                    aiConfidence: 0.91,
                },
            },
        });

        const result = await analyzePatientScan("e6aec3b8-0021-41c5-bd2a-733545e22b08");

        expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
            method: "post",
            url: "/scans/e6aec3b8-0021-41c5-bd2a-733545e22b08/analyze",
        }));
        expect(result).toEqual({
            aiPrediction: "Benign",
            aiConfidence: 0.91,
        });
    });

    it("passes request config when analyzing a patient scan", async () => {
        api.request.mockResolvedValue({
            data: {
                status: "success",
                data: {
                    aiPrediction: "Malignant",
                },
            },
        });

        await analyzePatientScan("scan-1", { timeout: 25000 });

        expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
            method: "post",
            url: "/scans/scan-1/analyze",
            timeout: 25000,
        }));
    });

    it("stops analysis before creating an undefined scan URL", async () => {
        await expect(analyzePatientScan()).rejects.toThrow("Upload response does not contain scan id.");
        expect(api.request).not.toHaveBeenCalled();
    });
});

describe("patientService active consultation guard", () => {
    beforeEach(() => {
        api.request.mockReset();
    });

    it("treats open consultation statuses as active and closed statuses as inactive", () => {
        expect(isActiveConsultation({ id: "consult-1", status: "OPEN" })).toBe(true);
        expect(isActiveConsultation({ id: "consult-2", status: "case_resolved" })).toBe(false);
        expect(isActiveConsultation({ id: "consult-3", status: "CLOSED" })).toBe(false);
        expect(isActiveConsultation({ status: "OPEN" })).toBe(false);
    });

    it("returns the first active consultation from the patient consultation list", async () => {
        api.request.mockResolvedValue({
            data: {
                status: "success",
                data: [
                    { id: "closed-consult", status: "CLOSED" },
                    { id: "active-consult", status: "OPEN" },
                ],
            },
        });

        const result = await getActiveConsultation();

        expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
            method: "get",
            url: "/consultations",
            params: expect.objectContaining({ page: 1, limit: 50 }),
        }));
        expect(result).toEqual({ id: "active-consult", status: "OPEN" });
    });
});
