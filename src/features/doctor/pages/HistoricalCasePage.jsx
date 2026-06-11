import { useEffect, useState } from "react";
import CaseHistoryTable from "../components/historical/CaseHistoryTable";
import HistoricalCaseControls from "../components/historical/HistoricalCaseControls";
import PatientDetailPanel from "../components/historical/PatientDetailPanel";
import {
    downloadCaseHistoryPdf,
    generateCaseReportPdf,
    getCaseHistory,
    getPatientEvolution,
} from "../services/doctorService";

const initialFilters = {
    search: "",
    diagnosis: "",
    status: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 5,
};

export default function HistoricalCasePage() {
    const [filters, setFilters] = useState(initialFilters);
    const [cases, setCases] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 5, total: 0 });
    const [selectedCase, setSelectedCase] = useState(null);
    const [evolutionData, setEvolutionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [evolutionLoading, setEvolutionLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const totalPages = Math.max(1, Math.ceil(Number(meta.total || 0) / Number(meta.limit || filters.limit || 5)));
    const currentPage = Number(meta.page || filters.page || 1);

    useEffect(() => {
        let isMounted = true;

        getCaseHistory(filters)
            .then((response) => {
                if (!isMounted) return;

                const nextCases = Array.isArray(response.data) ? response.data : [];
                const nextMeta = response.meta || {
                    page: Number(filters.page || 1),
                    limit: Number(filters.limit || 5),
                    total: 0,
                };

                setError("");
                setSuccess("");
                setCases(nextCases);
                setMeta(nextMeta);
                setSelectedCase(nextCases[0] || null);
                if (nextCases.length === 0) {
                    setEvolutionData(null);
                    setEvolutionLoading(false);
                } else {
                    const hasPatientId = Boolean(nextCases[0]?.patient?.id);
                    setEvolutionLoading(hasPatientId);
                    if (!hasPatientId) {
                        setEvolutionData(null);
                    }
                }
            })
            .catch((error) => {
                if (isMounted) {
                    setError(error.response?.data?.message || "Failed to fetch case history.");
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
    }, [filters]);

    useEffect(() => {
        const patientId = selectedCase?.patient?.id;

        if (!patientId) {
            return;
        }

        let isMounted = true;

        getPatientEvolution(patientId)
            .then((data) => {
                if (isMounted) {
                    setEvolutionData(data);
                }
            })
            .catch((error) => {
                if (isMounted) {
                    setError(error.response?.data?.message || "Failed to fetch patient evolution.");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setEvolutionLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [selectedCase]);

    const updateFilters = (nextFilters) => {
        setLoading(true);
        setFilters((current) => ({
            ...current,
            ...nextFilters,
            page: Number(nextFilters.page ?? current.page),
            limit: Number(nextFilters.limit ?? current.limit),
        }));
    };

    const handleSelectCase = (caseItem) => {
        setSelectedCase(caseItem);
        const hasPatientId = Boolean(caseItem?.patient?.id);
        setEvolutionLoading(hasPatientId);
        if (!hasPatientId) {
            setEvolutionData(null);
        }
    };

    const handleDownloadHistory = async () => {
        setActionLoading("download");
        setError("");

        try {
            await downloadCaseHistoryPdf(filters);
            setSuccess("Case history PDF downloaded.");
        } catch (error) {
            setError(error.response?.data?.message || error.message || "Failed to download case history PDF.");
        } finally {
            setActionLoading("");
        }
    };

    const handleGenerateReport = async () => {
        if (!selectedCase?.caseId) {
            setError("Select a case before generating a report.");
            return;
        }

        setActionLoading("report");
        setError("");

        try {
            await generateCaseReportPdf(selectedCase.caseId);
            setSuccess(`Case report PDF generated for ${selectedCase.caseId}.`);
        } catch (error) {
            setError(error.response?.data?.message || error.message || "Failed to generate case report PDF.");
        } finally {
            setActionLoading("");
        }
    };

    return (
        <>
            {error && (
                <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-6 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                    {success}
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <HistoricalCaseControls
                        filters={filters}
                        onFilterChange={updateFilters}
                        onDownloadHistory={handleDownloadHistory}
                        onGenerateReport={handleGenerateReport}
                        actionLoading={actionLoading}
                    />
                    <CaseHistoryTable
                        cases={cases}
                        loading={loading}
                        selectedCaseId={selectedCase?.caseId}
                        onSelectCase={handleSelectCase}
                    />
                    <p className="mt-3 text-xs text-slate-500">
                        Showing {cases.length} of {meta.total} cases
                    </p>
                    <div className="mt-3 flex flex-col gap-3 rounded-xl bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-600">Rows</span>
                            <select
                                value={filters.limit}
                                onChange={(event) => updateFilters({ limit: Number(event.target.value), page: 1 })}
                                className="h-9 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-800 outline-none"
                            >
                                {[5, 10, 20, 50].map((limit) => (
                                    <option key={limit} value={limit}>{limit}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => updateFilters({ page: Math.max(1, currentPage - 1) })}
                                disabled={loading || currentPage <= 1}
                                className="h-9 rounded-lg bg-slate-100 px-3 text-xs font-extrabold text-slate-600 disabled:text-slate-300"
                            >
                                Previous
                            </button>
                            <span className="text-xs font-extrabold text-slate-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => updateFilters({ page: Math.min(totalPages, currentPage + 1) })}
                                disabled={loading || currentPage >= totalPages}
                                className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-extrabold text-white disabled:bg-blue-200"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <PatientDetailPanel
                        evolutionData={evolutionData}
                        loading={evolutionLoading}
                    />
                </div>
            </div>
        </>
    );
}
