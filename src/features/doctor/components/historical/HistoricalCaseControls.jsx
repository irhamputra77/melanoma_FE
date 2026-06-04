import { useState } from "react";
import {
    Calendar,
    ChevronDown,
    Download,
    FileText,
    Search,
    ShieldCheck,
    Stethoscope,
} from "lucide-react";

export default function HistoricalCaseControls({
    filters,
    onFilterChange,
    onDownloadHistory,
    onGenerateReport,
    actionLoading = "",
}) {
    const [dateOpen, setDateOpen] = useState(false);
    const [draftDates, setDraftDates] = useState({
        startDate: filters.startDate || "",
        endDate: filters.endDate || "",
    });
    const dateActive = Boolean(filters.startDate || filters.endDate);

    const applyDateRange = () => {
        onFilterChange?.({
            startDate: draftDates.startDate,
            endDate: draftDates.endDate,
            page: 1,
        });
        setDateOpen(false);
    };

    const clearDateRange = () => {
        const emptyDates = { startDate: "", endDate: "" };
        setDraftDates(emptyDates);
        onFilterChange?.({ ...emptyDates, page: 1 });
        setDateOpen(false);
    };

    return (
        <div>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                Review and verify AI-assisted diagnoses across your patient registry.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={onDownloadHistory}
                    disabled={actionLoading === "download"}
                    className="flex items-center gap-2 rounded-xl bg-slate-200 px-6 py-3 text-sm font-bold text-slate-900"
                >
                    <Download size={17} />
                    {actionLoading === "download" ? "Preparing..." : "Download Case History"}
                </button>

                <button
                    type="button"
                    onClick={onGenerateReport}
                    disabled={actionLoading === "report"}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm"
                >
                    <FileText size={17} />
                    {actionLoading === "report" ? "Generating..." : "Generate Report"}
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
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setDateOpen((current) => !current)}
                        className={`flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium shadow-sm ${
                            dateActive ? "bg-blue-600 text-white" : "bg-white text-slate-900"
                        }`}
                    >
                        <span className={dateActive ? "text-white" : "text-blue-600"}><Calendar size={17} /></span>
                        {dateActive ? "Date Applied" : "Date Range"}
                        <ChevronDown size={16} />
                    </button>

                    {dateOpen && (
                        <div className="absolute right-0 top-14 z-20 w-80 rounded-2xl bg-white p-4 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100">
                            <div className="grid gap-3">
                                <label className="block">
                                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Start Date</span>
                                    <input
                                        type="date"
                                        value={draftDates.startDate}
                                        onChange={(event) => setDraftDates((current) => ({ ...current, startDate: event.target.value }))}
                                        className="mt-2 h-11 w-full rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">End Date</span>
                                    <input
                                        type="date"
                                        value={draftDates.endDate}
                                        min={draftDates.startDate || undefined}
                                        onChange={(event) => setDraftDates((current) => ({ ...current, endDate: event.target.value }))}
                                        className="mt-2 h-11 w-full rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100"
                                    />
                                </label>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={clearDateRange}
                                    className="h-10 rounded-xl bg-slate-100 px-4 text-xs font-extrabold text-slate-600"
                                >
                                    Clear
                                </button>
                                <button
                                    type="button"
                                    onClick={applyDateRange}
                                    className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-extrabold text-white"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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
