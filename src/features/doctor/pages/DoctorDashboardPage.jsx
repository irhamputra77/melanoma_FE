import { useEffect, useRef, useState } from "react";
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
    const loadedDetailCaseIdRef = useRef("");
    const detailRequestRef = useRef(0);
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
                const firstCaseId = casesData?.[0]?.caseId || casesData?.[0]?.id || casesData?.[0]?.requestId || "";
                const sharedCase = casesData?.find((item) => (
                    item.caseId === sharedCaseId || item.scanId === sharedCaseId || item.requestId === sharedCaseId
                ));
                setSummary(summaryData);
                setAssignedCases(casesData || []);
                setSelectedCaseId(sharedCase?.caseId || firstCaseId);
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
        let isMounted = true;

        const refreshAssignedCases = () => {
            getAssignedCases()
                .then((casesData) => {
                    if (!isMounted) return;

                    setAssignedCases(casesData || []);
                    setSelectedCaseId((currentCaseId) => {
                        const matchedCase = casesData?.find((item) => (
                            item.caseId === currentCaseId || item.scanId === currentCaseId || item.requestId === currentCaseId
                        ));

                        return matchedCase?.caseId || casesData?.[0]?.caseId || casesData?.[0]?.id || casesData?.[0]?.requestId || "";
                    });
                })
                .catch((error) => {
                    if (isMounted) {
                        setError(error.response?.data?.message || "Failed to refresh assigned cases.");
                    }
                });
        };

        const intervalId = window.setInterval(refreshAssignedCases, 12_000);
        window.addEventListener("focus", refreshAssignedCases);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
            window.removeEventListener("focus", refreshAssignedCases);
        };
    }, []);

    useEffect(() => {
        if (!selectedCaseId) {
            loadedDetailCaseIdRef.current = "";
            setCaseDetails(null);
            return;
        }

        const selectedAssignedCase = assignedCases.find((item) => (
            item.caseId === selectedCaseId || item.scanId === selectedCaseId || item.requestId === selectedCaseId
        ));
        const detailCaseId = selectedAssignedCase?.detailCaseId || selectedAssignedCase?.caseId || selectedCaseId;

        if (!detailCaseId) {
            setCaseDetails(null);
            setObservation("");
            setCaseLoading(false);
            setError("Assigned case is missing an identifier from the backend response. Cannot load case detail yet.");
            return;
        }

        if (loadedDetailCaseIdRef.current === detailCaseId) {
            return;
        }

        let isMounted = true;
        const requestId = detailRequestRef.current + 1;
        detailRequestRef.current = requestId;
        setCaseLoading(true);
        setError("");

        getCaseDetails(detailCaseId)
            .then((data) => {
                if (!isMounted || detailRequestRef.current !== requestId) return;

                loadedDetailCaseIdRef.current = detailCaseId;
                setCaseDetails(data);
                setObservation(data?.physicianObservation || "");
                setError("");
            })
            .catch((error) => {
                if (isMounted && detailRequestRef.current === requestId) {
                    setError(error.response?.data?.message || "Failed to fetch case details.");
                }
            })
            .finally(() => {
                if (isMounted && detailRequestRef.current === requestId) {
                    setCaseLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [selectedCaseId, assignedCases]);

    const handleSaveObservation = async () => {
        if (!caseDetails?.caseId) return;

        setActionLoading("save");

        try {
            await runCaseActionWithFallback(
                savePhysicianObservation,
                getActionCaseIds(caseDetails, findAssignedCase(assignedCases, selectedCaseId)),
                observation,
            );
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
            const result = await runCaseActionWithFallback(
                uploadCaseAnnotation,
                getActionCaseIds(caseDetails, findAssignedCase(assignedCases, selectedCaseId)),
                file,
            );
            const annotatedImageUrl = result?.annotatedImageUrl;

            if (annotatedImageUrl) {
                setCaseDetails((current) => ({
                    ...current,
                    clinicalImage: {
                        ...(current?.clinicalImage || {}),
                        annotatedImageUrl,
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
        const selectedAssignedCase = findAssignedCase(assignedCases, selectedCaseId);
        setActionLoading("approve");

        try {
            await runCaseActionWithFallback(
                approveCase,
                getActionCaseIds(caseDetails, selectedAssignedCase),
                {
                    physicianObservation: observation,
                    finalDiagnosis,
                },
            );
            const removeIds = getActionCaseIds(caseDetails, selectedAssignedCase);
            const nextCases = assignedCases.filter((item) => !removeIds.includes(item.caseId));
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
        const selectedAssignedCase = findAssignedCase(assignedCases, selectedCaseId);
        setActionLoading("reject");

        try {
            await runCaseActionWithFallback(
                rejectCase,
                getActionCaseIds(caseDetails, selectedAssignedCase),
                {
                    reason: "False positive prediction",
                    physicianObservation: observation,
                    finalDiagnosis,
                },
            );
            const removeIds = getActionCaseIds(caseDetails, selectedAssignedCase);
            const nextCases = assignedCases.filter((item) => !removeIds.includes(item.caseId));
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

function findAssignedCase(assignedCases, selectedCaseId) {
    return assignedCases.find((item) => (
        item.caseId === selectedCaseId || item.scanId === selectedCaseId || item.requestId === selectedCaseId
    ));
}

function getActionCaseIds(caseDetails, assignedCase) {
    return uniqueValues([
        assignedCase?.actionCaseId,
        caseDetails?.actionCaseId,
        caseDetails?.caseId,
        caseDetails?.scanId,
        assignedCase?.detailCaseId,
        assignedCase?.caseId,
        assignedCase?.scanId,
        caseDetails?.requestId,
        caseDetails?.verificationRequestId,
        assignedCase?.requestId,
        assignedCase?.verificationRequestId,
        assignedCase?.id,
    ]);
}

async function runCaseActionWithFallback(action, caseIds, payload) {
    let lastError;

    for (const caseId of caseIds) {
        try {
            return await action(caseId, payload);
        } catch (error) {
            lastError = error;
            const status = error?.response?.status;

            if (![400, 404].includes(status)) {
                throw error;
            }
        }
    }

    throw lastError || new Error("Failed to run case action.");
}

function uniqueValues(values) {
    return [...new Set(values.filter((value) => value !== undefined && value !== null && value !== ""))];
}
