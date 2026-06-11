import AssignedCaseCard from "./AssignedCaseCard";

export default function AssignedCaseList({
    cases = [],
    selectedCaseId = "",
    onSelectCase,
    loading = false,
}) {
    return (
        <div>
            <div className="bg-white rounded-2xl shadow-sm py-3 text-center text-slate-700 font-bold mb-8 border border-slate-100">
                Assigned
            </div>

            <div className="space-y-4">
                {loading && (
                    <div className="rounded-2xl bg-white px-5 py-8 text-center text-sm font-semibold text-slate-500">
                        Loading assigned cases...
                    </div>
                )}

                {!loading && cases.length === 0 && (
                    <div className="rounded-2xl bg-white px-5 py-8 text-center text-sm font-semibold text-slate-500">
                        No assigned cases.
                    </div>
                )}

                {!loading && cases.map((item) => {
                    const mappedCase = mapAssignedCase(item);

                    return (
                        <AssignedCaseCard
                            key={mappedCase.caseId}
                            item={mappedCase}
                            active={mappedCase.caseId === selectedCaseId}
                            onClick={() => onSelectCase?.(mappedCase.caseId)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function mapAssignedCase(item) {
    const caseId = item.caseId || item.id || item.requestId || item.scanId;

    return {
        ...item,
        caseId,
        name: item.patientName || item.name || "Patient",
        id: `#${caseId}`,
        time: formatRelativeTime(item.receivedAt),
        urgent: item.status === "pending_review",
    };
}

function formatRelativeTime(value) {
    if (!value) return "";

    const receivedAt = new Date(value).getTime();
    const diffMs = Date.now() - receivedAt;
    const diffHours = Math.max(0, Math.floor(diffMs / 3_600_000));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    return diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
}
