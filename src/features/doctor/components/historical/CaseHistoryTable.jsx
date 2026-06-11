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
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full table-fixed text-left">
                <thead className="bg-slate-100 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-700">
                    <tr>
                        <th className="w-[13%] px-8 py-4">Date</th>
                        <th className="w-[20%] px-4 py-4">Patient</th>
                        <th className="w-[31%] px-4 py-4">Images</th>
                        <th className="w-[21%] px-4 py-4">AI Diagnosis</th>
                        <th className="w-[15%] px-4 py-4">Verification</th>
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
                                className={`${selectedCaseId === item.caseId ? "bg-slate-50" : "bg-white"} cursor-pointer`}
                            >
                                <td className="px-8 py-4 align-middle">
                                    <p className="text-sm font-medium leading-tight text-slate-900">
                                        {dateLines.map((line) => (
                                            <span key={line} className="block">
                                                {line}
                                            </span>
                                        ))}
                                    </p>
                                </td>

                                <td className="px-4 py-4 align-middle">
                                    <p className="text-sm font-extrabold leading-tight text-slate-900">
                                        {(item.patient?.name || "-").split(" ").map((part) => (
                                            <span key={part} className="block">
                                                {part}
                                            </span>
                                        ))}
                                    </p>
                                    <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">
                                        ID: {item.patient?.id || item.caseId}
                                    </p>
                                </td>

                                <td className="px-4 py-4 align-middle">
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

                                <td className="px-4 py-4 align-middle">
                                    <p className="text-sm font-extrabold leading-tight text-slate-900">
                                        {aiDiagnosis.split(" ").map((part, index) => (
                                            <span key={`${part}-${index}`} className="block">
                                                {part}
                                            </span>
                                        ))}
                                    </p>
                                </td>

                                <td className="px-4 py-4 align-middle">
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
    if (!value) return ["-", "", ""];

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return [value, "", ""];
    }

    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.toLocaleDateString("en-US", { day: "2-digit" });
    const year = date.toLocaleDateString("en-US", { year: "numeric" });

    return [month, `${day},`, year];
}
