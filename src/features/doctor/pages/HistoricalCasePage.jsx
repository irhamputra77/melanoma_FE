import { useEffect, useState } from "react";
import CaseHistoryTable from "../components/historical/CaseHistoryTable";
import HistoricalCaseControls from "../components/historical/HistoricalCaseControls";
import PatientDetailPanel from "../components/historical/PatientDetailPanel";
import { getCaseHistory, getPatientEvolution } from "../services/doctorService";

const initialFilters = {
    search: "",
    diagnosis: "",
    status: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
};

export default function HistoricalCasePage() {
    const [filters, setFilters] = useState(initialFilters);
    const [cases, setCases] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
    const [selectedCase, setSelectedCase] = useState(null);
    const [evolutionData, setEvolutionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [evolutionLoading, setEvolutionLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        getCaseHistory(filters)
            .then((response) => {
                if (!isMounted) return;

                const nextCases = Array.isArray(response.data) ? response.data : [];
                const nextMeta = response.meta || {
                    page: Number(filters.page || 1),
                    limit: Number(filters.limit || 10),
                    total: 0,
                };

                setError("");
                setCases(nextCases);
                setMeta(nextMeta);
                setSelectedCase(nextCases[0] || null);
                if (nextCases.length === 0) {
                    setEvolutionData(null);
                    setEvolutionLoading(false);
                } else {
                    setEvolutionLoading(Boolean(nextCases[0]?.patient?.id));
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
            setEvolutionData(null);
            setEvolutionLoading(false);
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
        setEvolutionLoading(Boolean(caseItem?.patient?.id));
    };

    return (
        <>
            {error && (
                <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-12 gap-10">
                <div className="col-span-12 2xl:col-span-9">
                    <HistoricalCaseControls
                        filters={filters}
                        onFilterChange={updateFilters}
                    />
                    <CaseHistoryTable
                        cases={cases}
                        loading={loading}
                        selectedCaseId={selectedCase?.caseId}
                        onSelectCase={handleSelectCase}
                    />
                    <p className="mt-4 text-sm text-slate-500">
                        Showing {cases.length} of {meta.total} cases
                    </p>
                </div>

                <div className="col-span-12 2xl:col-span-3">
                    <PatientDetailPanel
                        evolutionData={evolutionData}
                        loading={evolutionLoading}
                    />
                </div>
            </div>
        </>
    );
}
