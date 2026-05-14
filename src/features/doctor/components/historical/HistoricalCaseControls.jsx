import {
    Calendar,
    ChevronDown,
    Download,
    FileText,
    Search,
    ShieldCheck,
    Stethoscope,
} from "lucide-react";

export default function HistoricalCaseControls({ filters, onFilterChange }) {
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
                    value={filters.search}
                    onChange={(event) => onFilterChange?.({ search: event.target.value, page: 1 })}
                    className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Search patient name, ID, or diagnosis..."
                />
            </div>

            <div className="mt-4 flex flex-wrap gap-6">
                <FilterSelect
                    icon={<Stethoscope size={17} />}
                    label="Diagnosis"
                    value={filters.diagnosis}
                    options={[
                        ["", "All Diagnosis"],
                        ["melanoma", "Melanoma"],
                        ["nevus", "Nevus"],
                        ["keratosis", "Keratosis"],
                    ]}
                    onChange={(value) => onFilterChange?.({ diagnosis: value, page: 1 })}
                />
                <FilterSelect
                    icon={<ShieldCheck size={17} />}
                    label="Status"
                    value={filters.status}
                    options={[
                        ["", "All Status"],
                        ["pending_review", "Pending Review"],
                        ["approved", "Approved"],
                        ["rejected", "Rejected"],
                        ["under_review", "Under Review"],
                    ]}
                    onChange={(value) => onFilterChange?.({ status: value, page: 1 })}
                />
                <FilterButton icon={<Calendar size={17} />} label="Date Range" />
            </div>
        </div>
    );
}

function FilterSelect({ icon, label, value, options, onChange }) {
    return (
        <label className="relative flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-slate-900 shadow-sm">
            <span className="text-blue-600">{icon}</span>
            <span className="sr-only">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="appearance-none bg-transparent pr-6 outline-none"
            >
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-4" />
        </label>
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
