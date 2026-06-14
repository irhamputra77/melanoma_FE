import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DoctorDashboardPage from "./DoctorDashboardPage";
import {
    approveCase,
    getAssignedCases,
    getCaseDetails,
    getDoctorDashboardSummary,
    rejectCase,
} from "../services/doctorService";

vi.mock("../services/doctorService", () => ({
    approveCase: vi.fn(),
    getAssignedCases: vi.fn(),
    getCaseDetails: vi.fn(),
    getDoctorDashboardSummary: vi.fn(),
    rejectCase: vi.fn(),
    savePhysicianObservation: vi.fn(),
    uploadCaseAnnotation: vi.fn(),
}));

describe("DoctorDashboardPage", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        window.history.replaceState({}, "", "/doctor/dashboard");
        getDoctorDashboardSummary.mockResolvedValue({
            totalRequests: 2,
            pendingReview: 1,
            completedScans: 1,
        });
        getAssignedCases.mockResolvedValue([
            {
                caseId: "SCN-missing",
                detailCaseId: "SCN-missing",
                actionCaseId: "SCN-missing",
                requestId: "VER-missing",
                patientName: "Missing Patient",
                status: "pending_review",
                receivedAt: "2026-06-10T10:00:00.000Z",
            },
            {
                caseId: "SCN-valid",
                requestId: "VER-valid",
                detailCaseId: "SCN-valid",
                actionCaseId: "SCN-valid",
                patientName: "Robert Taylor",
                status: "pending_review",
                receivedAt: "2026-06-10T10:05:00.000Z",
            },
        ]);
    });

    it("clears a stale case-detail error after a later case loads successfully", async () => {
        const user = userEvent.setup();
        getCaseDetails
            .mockRejectedValueOnce({
                response: {
                    data: {
                        message: "Case not found",
                    },
                },
            })
            .mockResolvedValueOnce({
                caseId: "SCN-valid",
                requestId: "VER-valid",
                scanId: "SCN-valid",
                receivedAt: "2026-06-10T10:05:00.000Z",
                patient: {
                    name: "Robert Taylor",
                },
                clinicalImage: {
                    imageUrl: "/uploads/scans/robert.jpg",
                },
                aiPrediction: {
                    prediction: "Malignant",
                    confidence: 0.82,
                    gradcamUrl: "/uploads/gradcam/robert.png",
                },
                patientNotes: "Arm - new suspicious lesion",
                physicianObservation: "",
            });

        render(<DoctorDashboardPage />);

        expect(await screen.findByText(/We could not load this case detail/i)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /Robert Taylor/i }));

        expect(await screen.findByText(/Case #SCN-valid: Robert Taylor/i)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByText("Case not found")).not.toBeInTheDocument();
        });
        expect(getCaseDetails).toHaveBeenLastCalledWith("SCN-valid");
    });

    it("uses the assigned actionCaseId for approve actions", async () => {
        const user = userEvent.setup();
        getCaseDetails.mockResolvedValue({
            caseId: "SCN-missing",
            requestId: "VER-missing",
            scanId: "SCN-missing",
            receivedAt: "2026-06-10T10:00:00.000Z",
            patient: {
                name: "Missing Patient",
            },
            clinicalImage: {
                imageUrl: "/uploads/scans/missing.jpg",
            },
            aiPrediction: {
                prediction: "Malignant",
                confidence: 0.82,
                predictions: [
                    {
                        label: "Malignant",
                        percentage: 82,
                    },
                ],
            },
            patientNotes: "Arm - new suspicious lesion",
            physicianObservation: "Needs follow up",
        });
        approveCase.mockResolvedValueOnce({
            status: "success",
        });

        render(<DoctorDashboardPage />);

        expect(await screen.findByText(/Case #SCN-missing: Missing Patient/i)).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /Approve Diagnosis/i }));

        await waitFor(() => {
            expect(approveCase).toHaveBeenCalledWith("SCN-missing", expect.objectContaining({
                physicianObservation: "Needs follow up",
                finalDiagnosis: "Malignant",
            }));
        });
        expect(approveCase).toHaveBeenCalledTimes(1);
    });

    it("saves typed physician observation before rejecting a case", async () => {
        const user = userEvent.setup();
        getCaseDetails.mockResolvedValue({
            caseId: "SCN-missing",
            requestId: "VER-missing",
            scanId: "SCN-missing",
            receivedAt: "2026-06-10T10:00:00.000Z",
            patient: {
                name: "Missing Patient",
            },
            clinicalImage: {
                imageUrl: "/uploads/scans/missing.jpg",
            },
            aiPrediction: {
                prediction: "Malignant",
                confidence: 0.82,
                predictions: [
                    {
                        label: "Malignant",
                        percentage: 82,
                    },
                    {
                        label: "Benign",
                        percentage: 18,
                    },
                ],
            },
            patientNotes: "Arm - new suspicious lesion",
            physicianObservation: "",
        });
        rejectCase.mockResolvedValueOnce({
            status: "success",
        });

        render(<DoctorDashboardPage />);

        expect(await screen.findByText(/Case #SCN-missing: Missing Patient/i)).toBeInTheDocument();
        await user.type(screen.getByPlaceholderText(/Type your professional assessment here/i), "Likely false positive after clinical review.");
        await user.click(screen.getByRole("button", { name: /Reject \/ False Positive/i }));

        await waitFor(() => {
            expect(rejectCase).toHaveBeenCalledWith("SCN-missing", expect.objectContaining({
                physicianObservation: "Likely false positive after clinical review.",
                finalDiagnosis: "Benign",
            }));
        });
    });
});
