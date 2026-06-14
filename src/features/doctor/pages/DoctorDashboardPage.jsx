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
                    setError(getDoctorDashboardErrorMessage(error, "Failed to fetch doctor dashboard."));
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
                        setError(getDoctorDashboardErrorMessage(error, "Failed to refresh assigned cases."));
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
            setError("We could not open this case because its case ID is missing. Please refresh the dashboard and try again.");
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

                const normalizedData = mergeAssignedCaseFallback(data, selectedAssignedCase);
                loadedDetailCaseIdRef.current = detailCaseId;
                setCaseDetails(normalizedData);
                setObservation(normalizedData?.physicianObservation || "");
                setError("");
            })
            .catch((error) => {
                if (isMounted && detailRequestRef.current === requestId) {
                    setError(getDoctorDashboardErrorMessage(error, "Failed to fetch case details."));
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
            setError(getDoctorDashboardErrorMessage(error, "Failed to save annotation."));
            throw error;
        } finally {
            setActionLoading("");
        }
    };

    const handleApprove = async () => {
        if (!caseDetails?.caseId) return;

        const currentObservation = observation.trim();
        if (!currentObservation) {
            setError("Please add your physician observation before approving this case.");
            return;
        }

        const finalDiagnosis = caseDetails.aiPrediction?.predictions?.[0]?.label || "Approved";
        const selectedAssignedCase = findAssignedCase(assignedCases, selectedCaseId);
        const actionCaseIds = getActionCaseIds(caseDetails, selectedAssignedCase);
        setActionLoading("approve");

        try {
            await runCaseActionWithFallback(
                approveCase,
                actionCaseIds,
                {
                    physicianObservation: currentObservation,
                    finalDiagnosis,
                },
            );
            const removeIds = actionCaseIds;
            const nextCases = assignedCases.filter((item) => !caseMatchesAnyId(item, removeIds));
            setAssignedCases(nextCases);
            setSelectedCaseId(nextCases[0]?.caseId || "");
        } catch (error) {
            setError(getDoctorDashboardErrorMessage(error, "Failed to approve case."));
        } finally {
            setActionLoading("");
        }
    };

    const handleReject = async () => {
        if (!caseDetails?.caseId) return;

        const currentObservation = observation.trim();
        if (!currentObservation) {
            setError("Please add your physician observation before rejecting this case.");
            return;
        }

        const finalDiagnosis = caseDetails.aiPrediction?.predictions?.[1]?.label || "Rejected";
        const selectedAssignedCase = findAssignedCase(assignedCases, selectedCaseId);
        const actionCaseIds = getActionCaseIds(caseDetails, selectedAssignedCase);
        setActionLoading("reject");

        try {
            await runCaseActionWithFallback(
                rejectCase,
                actionCaseIds,
                {
                    reason: "False positive prediction",
                    physicianObservation: currentObservation,
                    finalDiagnosis,
                },
            );
            const removeIds = actionCaseIds;
            const nextCases = assignedCases.filter((item) => !caseMatchesAnyId(item, removeIds));
            setAssignedCases(nextCases);
            setSelectedCaseId(nextCases[0]?.caseId || "");
        } catch (error) {
            setError(getDoctorDashboardErrorMessage(error, "Failed to reject case."));
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
            {error && !caseDetails && (
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
                        observationError={caseDetails ? error : ""}
                        onObservationChange={(value) => {
                            setObservation(value);
                            setError("");
                        }}
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

function caseMatchesAnyId(caseItem, ids) {
    const itemIds = uniqueValues([
        caseItem?.actionCaseId,
        caseItem?.detailCaseId,
        caseItem?.caseId,
        caseItem?.scanId,
        caseItem?.patientScanId,
        caseItem?.requestId,
        caseItem?.verificationRequestId,
        caseItem?.id,
    ]);

    return itemIds.some((id) => ids.includes(id));
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

function mergeAssignedCaseFallback(caseDetails = {}, assignedCase = {}) {
    if (!assignedCase) return caseDetails;

    const imageUrl = firstDefined(
        caseDetails?.clinicalImage?.imageUrl,
        assignedCase.clinicalImageUrl,
        assignedCase.scanImageUrl,
        assignedCase.imageUrl,
    );
    const gradcamUrl = firstDefined(
        caseDetails?.aiPrediction?.gradcamUrl,
        assignedCase.gradcamUrl,
        assignedCase.gradcamImageUrl,
    );
    const annotatedImageUrl = firstDefined(
        caseDetails?.clinicalImage?.annotatedImageUrl,
        assignedCase.annotatedImageUrl,
        assignedCase.annotationImageUrl,
        assignedCase.editedGradcamImageUrl,
    );

    return {
        ...assignedCase,
        ...caseDetails,
        patientScanId: firstDefined(caseDetails.patientScanId, assignedCase.patientScanId),
        scanId: firstDefined(caseDetails.scanId, assignedCase.scanId),
        requestId: firstDefined(caseDetails.requestId, assignedCase.requestId),
        receivedAt: firstDefined(caseDetails.receivedAt, assignedCase.receivedAt),
        patient: {
            ...(assignedCase.patient || {}),
            ...(caseDetails.patient || {}),
            name: firstDefined(caseDetails.patient?.name, assignedCase.patientName),
        },
        clinicalImage: {
            ...(caseDetails.clinicalImage || {}),
            ...(imageUrl ? { imageUrl } : {}),
            ...(annotatedImageUrl ? { annotatedImageUrl } : {}),
            bodySite: firstDefined(caseDetails.clinicalImage?.bodySite, assignedCase.bodySite),
            complaint: firstDefined(caseDetails.clinicalImage?.complaint, assignedCase.complaint),
        },
        aiPrediction: {
            ...(caseDetails.aiPrediction || {}),
            ...(gradcamUrl ? { gradcamUrl } : {}),
        },
        patientNotes: firstDefined(caseDetails.patientNotes, assignedCase.complaint),
    };
}

function firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== "");
}

function getDoctorDashboardErrorMessage(error, fallback) {
    const payload = error?.response?.data;
    const rawMessage = [
        payload?.message,
        payload?.error,
        error?.message,
    ].filter(Boolean).join(" ");
    const normalizedMessage = rawMessage.toLowerCase();

    if (
        normalizedMessage.includes("physicianobservation") ||
        normalizedMessage.includes("physician observation") ||
        normalizedMessage.includes("observation is required") ||
        normalizedMessage.includes("observation required")
    ) {
        return "Please add your physician observation before saving or completing this case.";
    }

    if (normalizedMessage.includes("network")) {
        return "We could not connect to the server. Please check your connection and try again.";
    }

    if (fallback === "Failed to fetch doctor dashboard.") {
        return "We could not load your dashboard right now. Please refresh the page and try again.";
    }

    if (fallback === "Failed to refresh assigned cases.") {
        return "We could not refresh your assigned cases. The current list may be slightly out of date.";
    }

    if (fallback === "Failed to fetch case details.") {
        return "We could not load this case detail. Please select the case again or refresh the page.";
    }

    if (fallback === "Failed to save observation.") {
        return "We could not save your observation. Please try again.";
    }

    if (fallback === "Failed to save annotation.") {
        return "We could not save the annotation image. Please try again.";
    }

    if (fallback === "Failed to approve case.") {
        return "Please add your physician observation before approving this case.";
    }

    if (fallback === "Failed to reject case.") {
        return "Please add your physician observation before rejecting this case.";
    }

    return rawMessage || fallback || "Something went wrong. Please try again.";
}
