import { useEffect, useState } from "react";
import DoctorStats from "../components/dashboard/DoctorStats";
import AssignedCaseList from "../components/dashboard/AssignedCaseList";
import CaseExaminationPanel from "../components/dashboard/CaseExaminationPanel";
import {
    approveCase,
    getAssignedCases,
    getCaseDetails,
    getDoctorDashboardSummary,
    rejectCase,
    savePhysicianObservation,
    uploadCaseAnnotation,
} from "../services/doctorService";

export default function DoctorDashboardPage() {
    const [summary, setSummary] = useState(null);
    const [assignedCases, setAssignedCases] = useState([]);
    const [selectedCaseId, setSelectedCaseId] = useState("");
    const [caseDetails, setCaseDetails] = useState(null);
    const [observation, setObservation] = useState("");
    const [loading, setLoading] = useState(true);
    const [caseLoading, setCaseLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        Promise.all([getDoctorDashboardSummary(), getAssignedCases()])
            .then(([summaryData, casesData]) => {
                if (!isMounted) return;

                const sharedCaseId = new URLSearchParams(window.location.search).get("caseId");
                setSummary(summaryData);
                setAssignedCases(casesData || []);
                setSelectedCaseId(sharedCaseId || casesData?.[0]?.caseId || "");
            })
            .catch((error) => {
                if (isMounted) {
                    setError(error.response?.data?.message || "Failed to fetch doctor dashboard.");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedCaseId) {
            setCaseDetails(null);
            return;
        }

        let isMounted = true;
        setCaseLoading(true);

        getCaseDetails(selectedCaseId)
            .then((data) => {
                if (!isMounted) return;

                setCaseDetails(data);
                setObservation(data?.physicianObservation || "");
            })
            .catch((error) => {
                if (isMounted) {
                    setError(error.response?.data?.message || "Failed to fetch case details.");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setCaseLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [selectedCaseId]);

    const handleSaveObservation = async () => {
        if (!caseDetails?.caseId) return;

        setActionLoading("save");

        try {
            await savePhysicianObservation(caseDetails.caseId, observation);
            setCaseDetails((current) => ({
                ...current,
                physicianObservation: observation,
            }));
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save observation.");
        } finally {
            setActionLoading("");
        }
    };

    const handleSaveAnnotation = async (file) => {
        if (!caseDetails?.caseId || !file) return;

        setActionLoading("annotation");
        setError("");

        try {
            const result = await uploadCaseAnnotation(caseDetails.caseId, file);

            if (result?.annotatedImageUrl) {
                setCaseDetails((current) => ({
                    ...current,
                    clinicalImage: {
                        ...(current?.clinicalImage || {}),
                        annotatedImageUrl: result.annotatedImageUrl,
                    },
                }));
                return;
            }

            const refreshedCase = await getCaseDetails(caseDetails.caseId);
            setCaseDetails(refreshedCase);
            setObservation(refreshedCase?.physicianObservation || observation);
        } catch (error) {
            setError(error.response?.data?.message || error.message || "Failed to save annotation.");
            throw error;
        } finally {
            setActionLoading("");
        }
    };

    const handleApprove = async () => {
        if (!caseDetails?.caseId) return;

        const finalDiagnosis = caseDetails.aiPrediction?.predictions?.[0]?.label || "Approved";
        setActionLoading("approve");

        try {
            await approveCase(caseDetails.caseId, {
                physicianObservation: observation,
                finalDiagnosis,
            });
            const nextCases = assignedCases.filter((item) => item.caseId !== caseDetails.caseId);
            setAssignedCases(nextCases);
            setSelectedCaseId(nextCases[0]?.caseId || "");
        } catch (error) {
            setError(error.response?.data?.message || "Failed to approve case.");
        } finally {
            setActionLoading("");
        }
    };

    const handleReject = async () => {
        if (!caseDetails?.caseId) return;

        const finalDiagnosis = caseDetails.aiPrediction?.predictions?.[1]?.label || "Rejected";
        setActionLoading("reject");

        try {
            await rejectCase(caseDetails.caseId, {
                reason: "False positive prediction",
                physicianObservation: observation,
                finalDiagnosis,
            });
            const nextCases = assignedCases.filter((item) => item.caseId !== caseDetails.caseId);
            setAssignedCases(nextCases);
            setSelectedCaseId(nextCases[0]?.caseId || "");
        } catch (error) {
            setError(error.response?.data?.message || "Failed to reject case.");
        } finally {
            setActionLoading("");
        }
    };

    const handleSelectCase = (caseId) => {
        setSelectedCaseId(caseId);

        const url = new URL(window.location.href);
        if (caseId) {
            url.searchParams.set("caseId", caseId);
        } else {
            url.searchParams.delete("caseId");
        }
        window.history.replaceState({}, "", url);
    };

    return (
        <div>
            {error && (
                <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            <DoctorStats summary={summary} loading={loading} />

            <div className="grid grid-cols-12 gap-8 mt-10">
                <div className="col-span-4">
                    <AssignedCaseList
                        cases={assignedCases}
                        selectedCaseId={selectedCaseId}
                        onSelectCase={handleSelectCase}
                        loading={loading}
                    />
                </div>

                <div className="col-span-8">
                    <CaseExaminationPanel
                        caseDetails={caseDetails}
                        loading={caseLoading}
                        observation={observation}
                        onObservationChange={setObservation}
                        onSaveObservation={handleSaveObservation}
                        onSaveAnnotation={handleSaveAnnotation}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        actionLoading={actionLoading}
                    />
                </div>
            </div>
        </div>
    );
}
