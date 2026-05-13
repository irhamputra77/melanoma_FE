import {
    Calendar,
    ChevronDown,
    Download,
    FileText,
    Search,
    ShieldCheck,
    Stethoscope,
} from "lucide-react";

export default function HistoricalCaseControls() {
    return (
        <div>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                Review and verify AI-assisted diagnoses across your patient registry.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl bg-slate-200 px-6 py-3 text-sm font-bold text-slate-900"
                >
                    <Download size={17} />
                    Download Case History
                </button>

                <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm"
                >
                    <FileText size={17} />
                    Generate Report
                </button>
            </div>

            <div className="mt-8 flex h-14 items-center gap-4 rounded-2xl bg-slate-200/50 px-5 text-slate-500">
                <Search size={22} />
                <input
                    className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Search patient name, ID, or diagnosis..."
                />
            </div>

            <div className="mt-4 flex flex-wrap gap-6">
                <FilterButton icon={<Stethoscope size={17} />} label="Diagnosis" />
                <FilterButton icon={<ShieldCheck size={17} />} label="Status" />
                <FilterButton icon={<Calendar size={17} />} label="Date Range" />
            </div>
        </div>
    );
}

function FilterButton({ icon, label }) {
    return (
        <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-slate-900 shadow-sm"
        >
            <span className="text-blue-600">{icon}</span>
            {label}
            <ChevronDown size={16} />
        </button>
    );
}
