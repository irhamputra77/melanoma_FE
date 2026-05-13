export default function CaseActionButtons() {
    return (
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100">
            <button className="h-14 px-8 rounded-xl bg-[#005AB6] text-white font-extrabold shadow-md hover:bg-blue-700 transition">
                Approve Diagnosis
            </button>

            <button className="h-14 px-8 rounded-xl bg-[#BA1A1A] text-white font-extrabold shadow-md hover:bg-red-700 transition">
                Reject / False Positive
            </button>
        </div>
    );
}