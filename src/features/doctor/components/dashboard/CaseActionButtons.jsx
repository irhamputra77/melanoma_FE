export default function CaseActionButtons({ onApprove, onReject, loading = "" }) {
    return (
        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:gap-4">
            <button
                type="button"
                onClick={onApprove}
                disabled={Boolean(loading)}
                className="h-14 w-full rounded-xl bg-[#005AB6] px-5 font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:bg-blue-300 sm:w-auto sm:px-8"
            >
                {loading === "approve" ? "Approving..." : "Approve Diagnosis"}
            </button>

            <button
                type="button"
                onClick={onReject}
                disabled={Boolean(loading)}
                className="h-14 w-full rounded-xl bg-[#BA1A1A] px-5 font-extrabold text-white shadow-md transition hover:bg-red-700 disabled:bg-red-300 sm:w-auto sm:px-8"
            >
                {loading === "reject" ? "Rejecting..." : "Reject / False Positive"}
            </button>
        </div>
    );
}
