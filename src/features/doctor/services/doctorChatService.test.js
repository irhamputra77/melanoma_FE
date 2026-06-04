import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../../services/api";
import {
    closeDoctorConsultation,
    deleteDoctorConsultation,
    getDoctorConsultations,
    sendDoctorConsultationMessage,
} from "./doctorChatService";

vi.mock("../../../services/api", () => ({
    default: {
        request: vi.fn(),
    },
}));

describe("doctorChatService", () => {
    beforeEach(() => {
        api.request.mockReset();
    });

    it("maps consultation list data and pagination from backend response", async () => {
        api.request.mockResolvedValue({
            data: {
                status: "success",
                data: [
                    {
                        id: "consultation-1",
                        status: "OPEN",
                    },
                ],
                meta: {
                    page: 1,
                    limit: 8,
                    total: 1,
                    totalPages: 1,
                },
            },
        });

        const result = await getDoctorConsultations({
            page: 1,
            limit: 8,
            status: "OPEN",
            search: "patient",
        });

        expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
            method: "get",
            url: "/consultations",
            params: {
                page: 1,
                limit: 8,
                status: "OPEN",
                search: "patient",
            },
        }));
        expect(result).toMatchObject({
            data: [{ id: "consultation-1", status: "OPEN" }],
            meta: {
                page: 1,
                limit: 8,
                total: 1,
                lastPage: 1,
            },
        });
    });

    it("sends consultation messages as FormData", async () => {
        api.request.mockResolvedValue({
            data: {
                status: "success",
                data: {
                    id: "message-1",
                    message: "Halo pasien",
                },
            },
        });

        const result = await sendDoctorConsultationMessage("consultation-1", "Halo pasien");
        const request = api.request.mock.calls[0][0];

        expect(request).toMatchObject({
            method: "post",
            url: "/consultations/consultation-1/messages",
        });
        expect(request.data).toBeInstanceOf(FormData);
        expect(request.data.get("message")).toBe("Halo pasien");
        expect(result).toEqual({
            id: "message-1",
            message: "Halo pasien",
        });
    });

    it("closes a consultation with clinical disposition payload", async () => {
        const payload = {
            caseDisposition: "case_resolved",
            finalClinicalNotes: "Clinical review completed.",
            emailClinicalSummary: true,
        };

        api.request.mockResolvedValue({
            data: {
                status: "success",
                data: {
                    id: "consultation-1",
                    status: "CLOSED",
                    emailClinicalSummaryQueued: true,
                },
            },
        });

        const result = await closeDoctorConsultation("consultation-1", payload);

        expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
            method: "patch",
            url: "/consultations/consultation-1/close",
            data: payload,
        }));
        expect(result).toMatchObject({
            id: "consultation-1",
            status: "CLOSED",
            emailClinicalSummaryQueued: true,
        });
    });

    it("deletes a closed consultation chat", async () => {
        api.request.mockResolvedValue({
            data: {
                status: "success",
                message: "Consultation deleted successfully",
            },
        });

        const result = await deleteDoctorConsultation("consultation-1");

        expect(api.request).toHaveBeenCalledWith(expect.objectContaining({
            method: "delete",
            url: "/consultations/consultation-1",
        }));
        expect(result).toEqual({
            status: "success",
            message: "Consultation deleted successfully",
        });
    });
});
