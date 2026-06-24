import CaseImageThumbnail from "./CaseImageThumbnail";

const statusClass = {
    approved: "bg-emerald-200 text-emerald-700",
    verified: "bg-emerald-200 text-emerald-700",
    pending_review: "bg-orange-200 text-orange-700",
    under_review: "bg-orange-200 text-orange-700",
    rejected: "bg-red-100 text-red-600",
};

const statusLabel = {
    approved: "Approved",
    verified: "Approved",
    pending_review: "Awaiting Review",
    under_review: "Under Review",
    rejected: "Rejected",
};

export default function CaseHistoryTable({
    cases = [],
    loading = false,
    selectedCaseId = "",
    onSelectCase,
}) {
    return (
        <div className="dashboard-table-scroll mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-[980px] table-fixed text-left">
                <thead className="bg-slate-100 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-700">
                    <tr>
                        <th className="w-[14%] px-6 py-4">Date</th>
                        <th className="w-[22%] px-5 py-4">Patient</th>
                        <th className="w-[30%] px-5 py-4">Images</th>
                        <th className="w-[20%] px-5 py-4">AI Diagnosis</th>
                        <th className="w-[14%] px-5 py-4">Verification</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                    {loading && (
                        <tr>
                            <td colSpan={5} className="px-10 py-10 text-center text-sm font-semibold text-slate-500">
                                Loading case history...
                            </td>
                        </tr>
                    )}

                    {!loading && cases.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-10 py-10 text-center text-sm font-semibold text-slate-500">
                                No case history found.
                            </td>
                        </tr>
                    )}

                    {!loading && cases.map((item, index) => {
                        const status = normalizeStatus(item.verificationStatus);
                        const dateLines = formatDateLines(item.date);
                        const aiDiagnosis = item.aiPrediction || item.aiDiagnosis || "-";

                        return (
                            <tr
                                key={item.caseId || `${item.patient?.id || "case"}-${index}`}
                                onClick={() => onSelectCase?.(item)}
                                className={`${selectedCaseId === item.caseId ? "bg-blue-50/60 shadow-[inset_4px_0_0_#2563eb]" : "bg-white hover:bg-slate-50"} cursor-pointer transition-colors`}
                            >
                                <td className="px-6 py-5 align-middle">
                                    <p className="whitespace-nowrap text-sm font-semibold text-slate-700">
                                        {dateLines}
                                    </p>
                                </td>

                                <td className="px-5 py-5 align-middle">
                                    <p className="truncate text-sm font-extrabold leading-tight text-slate-900">
                                        {item.patient?.name || "-"}
                                    </p>
                                    <p className="mt-1 truncate text-xs font-medium text-slate-500">
                                        ID: {item.patient?.id || item.caseId}
                                    </p>
                                </td>

                                <td className="px-5 py-5 align-middle">
                                    <div className="flex items-start gap-3">
                                        <CaseImageThumbnail
                                            imageUrl={item.clinicalImageUrl}
                                            label="Clinical"
                                            alt={`Clinical image for case ${item.caseId}`}
                                        />
                                        <CaseImageThumbnail
                                            imageUrl={item.gradcamUrl}
                                            label="Grad-CAM"
                                            alt={`Grad-CAM image for case ${item.caseId}`}
                                        />
                                        <CaseImageThumbnail
                                            imageUrl={item.annotatedImageUrl}
                                            label="Edited"
                                            alt={`Edited annotation for case ${item.caseId}`}
                                        />
                                    </div>
                                </td>

                                <td className="px-5 py-5 align-middle">
                                    <p className="line-clamp-2 text-sm font-extrabold leading-relaxed text-slate-900">
                                        {aiDiagnosis}
                                    </p>
                                </td>

                                <td className="px-5 py-5 align-middle">
                                    <span
                                        className={`inline-flex min-w-20 justify-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase ${statusClass[status] || statusClass.pending_review}`}
                                    >
                                        {statusLabel[status] || status}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function normalizeStatus(value) {
    return value === "verified" ? "approved" : value || "pending_review";
}

function formatDateLines(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}
