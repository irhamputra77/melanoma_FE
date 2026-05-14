export default function CaseActionButtons({ onApprove, onReject, loading = "" }) {
    return (
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100">
            <button
                type="button"
                onClick={onApprove}
                disabled={Boolean(loading)}
                className="h-14 px-8 rounded-xl bg-[#005AB6] text-white font-extrabold shadow-md hover:bg-blue-700 transition disabled:bg-blue-300"
            >
                {loading === "approve" ? "Approving..." : "Approve Diagnosis"}
            </button>

            <button
                type="button"
                onClick={onReject}
                disabled={Boolean(loading)}
                className="h-14 px-8 rounded-xl bg-[#BA1A1A] text-white font-extrabold shadow-md hover:bg-red-700 transition disabled:bg-red-300"
            >
                {loading === "reject" ? "Rejecting..." : "Reject / False Positive"}
            </button>
        </div>
    );
}
