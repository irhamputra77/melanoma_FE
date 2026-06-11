import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../../services/api";
import { analyzePatientScan, uploadPatientScan } from "./patientService";

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
