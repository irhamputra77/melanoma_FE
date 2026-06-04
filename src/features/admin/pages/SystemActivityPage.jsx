import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    ClipboardList,
    Database,
    RefreshCw,
    Search,
    ShieldCheck,
} from "lucide-react";
import { getAdminAuditLogs, getAdminSystemLogs } from "../services/adminService";

const DEFAULT_LIMIT = 8;

const systemTypeOptions = [
    ["all", "All types"],
    ["infrastructure", "Infrastructure"],
    ["ai_engine", "AI Engine"],
    ["user_management", "User Management"],
    ["security", "Security"],
    ["system", "System"],
];

const severityOptions = [
    ["all", "All severity"],
    ["critical", "Critical"],
    ["warning", "Warning"],
    ["info", "Info"],
];

const auditActionOptions = [
    ["all", "All actions"],
    ["CREATE_USER", "Create User"],
    ["UPDATE_USER", "Update User"],
    ["DELETE_USER", "Delete User"],
    ["CHANGE_USER_ROLE", "Change User Role"],
    ["CHANGE_USER_STATUS", "Change User Status"],
    ["RESET_PASSWORD", "Reset Password"],
    ["APPROVE_DOCTOR", "Approve Doctor"],
    ["REJECT_DOCTOR", "Reject Doctor"],
    ["CREATE_CLINIC", "Create Clinic"],
    ["UPDATE_CLINIC", "Update Clinic"],
    ["DELETE_CLINIC", "Delete Clinic"],
    ["CREATE_CLINIC_REQUEST", "Create Clinic Request"],
    ["APPROVE_CLINIC_REQUEST", "Approve Clinic Request"],
    ["REJECT_CLINIC_REQUEST", "Reject Clinic Request"],
    ["UPDATE_SYSTEM_SETTINGS", "Update System Settings"],
    ["GENERATE_REPORT", "Generate Report"],
];

export default function SystemActivityPage() {
    const [activeTab, setActiveTab] = useState("system");
    const [systemLogs, setSystemLogs] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [systemMeta, setSystemMeta] = useState(createMeta());
    const [auditMeta, setAuditMeta] = useState(createMeta());
    const [systemFilters, setSystemFilters] = useState({ type: "all", severity: "all" });
    const [auditFilters, setAuditFilters] = useState({ action: "all", adminId: "", startDate: "", endDate: "" });
    const [systemPage, setSystemPage] = useState(1);
    const [auditPage, setAuditPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const activeMeta = activeTab === "system" ? systemMeta : auditMeta;
    const activePage = activeTab === "system" ? systemPage : auditPage;
    const activeTotalPages = getTotalPages(activeMeta);

    const summary = useMemo(() => ({
        systemTotal: Number(systemMeta.total || 0),
        auditTotal: Number(auditMeta.total || 0),
        criticalShown: systemLogs.filter((item) => item.severity === "critical").length,
    }), [auditMeta.total, systemLogs, systemMeta.total]);

    const fetchLogs = useCallback(async ({ silent = false } = {}) => {
        setError("");
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [systemResult, auditResult] = await Promise.all([
                getAdminSystemLogs({
                    type: systemFilters.type === "all" ? undefined : systemFilters.type,
                    severity: systemFilters.severity === "all" ? undefined : systemFilters.severity,
                    page: systemPage,
                }),
                getAdminAuditLogs({
                    adminId: auditFilters.adminId.trim() || undefined,
                    action: auditFilters.action === "all" ? undefined : auditFilters.action,
                    startDate: auditFilters.startDate || undefined,
                    endDate: auditFilters.endDate || undefined,
                    page: auditPage,
                }),
            ]);

            setSystemLogs(normalizeSystemLogs(systemResult));
            setSystemMeta(normalizeMeta(systemResult, DEFAULT_LIMIT));
            setAuditLogs(normalizeAuditLogs(auditResult));
            setAuditMeta(normalizeMeta(auditResult, DEFAULT_LIMIT));
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [auditFilters, auditPage, systemFilters, systemPage]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const updateSystemFilter = (field, value) => {
        setSystemPage(1);
        setSystemFilters((current) => ({ ...current, [field]: value }));
    };

    const updateAuditFilter = (field, value) => {
        setAuditPage(1);
        setAuditFilters((current) => ({ ...current, [field]: value }));
    };

    const goToPage = (nextPage) => {
        if (activeTab === "system") {
            setSystemPage(nextPage);
        } else {
            setAuditPage(nextPage);
        }
    };

    return (
        <div className="mx-auto max-w-7xl pb-10">
            <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-[40px] font-extrabold leading-tight text-slate-950">
                        System Logs & Activity
                    </h1>
                    <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">
                        Review system events and admin audit trails from the backend logs endpoints.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchLogs({ silent: true })}
                    disabled={refreshing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm disabled:bg-blue-300"
                >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            <div className="grid gap-5 md:grid-cols-3">
                <SummaryCard title="System Logs" value={summary.systemTotal} detail="Matching system filters" icon={<Database size={18} />} tone="blue" />
                <SummaryCard title="Audit Logs" value={summary.auditTotal} detail="Matching audit filters" icon={<ShieldCheck size={18} />} tone="emerald" />
                <SummaryCard title="Critical Shown" value={summary.criticalShown} detail="Critical records on page" icon={<AlertTriangle size={18} />} tone="red" />
            </div>

            <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 pt-6">
                    <div className="flex flex-wrap gap-2">
                        <TabButton active={activeTab === "system"} onClick={() => setActiveTab("system")}>
                            System Logs
                        </TabButton>
                        <TabButton active={activeTab === "audit"} onClick={() => setActiveTab("audit")}>
                            Audit Logs
                        </TabButton>
                    </div>

                    <div className="mt-6 pb-6">
                        {activeTab === "system" ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                <SelectFilter label="Type" value={systemFilters.type} options={systemTypeOptions} onChange={(value) => updateSystemFilter("type", value)} />
                                <SelectFilter label="Severity" value={systemFilters.severity} options={severityOptions} onChange={(value) => updateSystemFilter("severity", value)} />
                            </div>
                        ) : (
                            <div className="grid gap-4 xl:grid-cols-4">
                                <SelectFilter label="Action" value={auditFilters.action} options={auditActionOptions} onChange={(value) => updateAuditFilter("action", value)} />
                                <TextFilter label="Admin ID" value={auditFilters.adminId} placeholder="Filter by admin ID" onChange={(value) => updateAuditFilter("adminId", value)} />
                                <TextFilter label="Start Date" type="date" value={auditFilters.startDate} onChange={(value) => updateAuditFilter("startDate", value)} />
                                <TextFilter label="End Date" type="date" value={auditFilters.endDate} onChange={(value) => updateAuditFilter("endDate", value)} />
                            </div>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="px-8 py-14 text-center text-sm font-semibold text-slate-500">
                        Loading logs...
                    </div>
                )}

                {!loading && activeTab === "system" && (
                    <SystemLogTable rows={systemLogs} />
                )}

                {!loading && activeTab === "audit" && (
                    <AuditLogTable rows={auditLogs} />
                )}

                <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm font-semibold text-slate-500">
                        Showing page <span className="font-extrabold text-slate-900">{activePage}</span> of{" "}
                        <span className="font-extrabold text-slate-900">{activeTotalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <PageButton disabled={activePage <= 1} onClick={() => goToPage(Math.max(1, activePage - 1))}>
                            Previous
                        </PageButton>
                        <PageButton disabled={activePage >= activeTotalPages} onClick={() => goToPage(activePage + 1)}>
                            Next
                        </PageButton>
                    </div>
                </div>
            </section>
        </div>
    );
}

function SummaryCard({ title, value, detail, icon, tone }) {
    const toneClass = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        red: "bg-red-50 text-red-600",
    }[tone];

    return (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
                    {icon}
                </span>
            </div>
            <p className="text-[34px] font-extrabold leading-none text-slate-950">{formatNumber(value)}</p>
            <p className="mt-3 text-xs font-medium text-slate-500">{detail}</p>
        </section>
    );
}

function TabButton({ active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl px-5 py-3 text-sm font-extrabold transition ${
                active ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
        >
            {children}
        </button>
    );
}

function SelectFilter({ label, value, options, onChange }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-11 w-full rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-900 outline-none"
            >
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>{optionLabel}</option>
                ))}
            </select>
        </label>
    );
}

function TextFilter({ label, value, onChange, placeholder = "", type = "text" }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{label}</span>
            <span className="flex h-11 items-center gap-3 rounded-xl bg-slate-100 px-4">
                {type === "text" && <Search size={17} className="text-slate-400" />}
                <input
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
            </span>
        </label>
    );
}

function SystemLogTable({ rows }) {
    if (rows.length === 0) {
        return <EmptyState text="No system logs found." />;
    }

    return (
        <DataTable
            headers={["Event", "Type", "Severity", "Created At"]}
            rows={rows.map((log) => [
                <EventCell key="event" icon={log.icon} iconClass={log.iconClass} title={log.title} message={log.description} />,
                <Tag key="type">{log.category}</Tag>,
                <span key="severity" className={`rounded-md px-3 py-1 text-xs font-extrabold uppercase ${severityBadgeClass(log.severity)}`}>{log.severity}</span>,
                <span key="time" className="text-sm font-semibold text-slate-500">{log.createdAtLabel}</span>,
            ])}
        />
    );
}

function AuditLogTable({ rows }) {
    if (rows.length === 0) {
        return <EmptyState text="No audit logs found." />;
    }

    return (
        <DataTable
            headers={["Action", "Admin", "IP Address", "Created At"]}
            rows={rows.map((log) => [
                <EventCell key="event" icon={<ClipboardList size={17} />} iconClass="bg-emerald-50 text-emerald-600" title={formatActionLabel(log.action)} message={log.description} />,
                <span key="admin" className="text-sm font-semibold text-slate-700">{log.adminName || log.adminId || "-"}</span>,
                <span key="ip" className="text-sm font-semibold text-slate-700">{log.ipAddress || "-"}</span>,
                <span key="time" className="text-sm font-semibold text-slate-500">{log.formattedCreatedAt || formatDateTime(log.createdAt)}</span>,
            ])}
        />
    );
}

function DataTable({ headers, rows }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="px-6 py-4 font-extrabold">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((cells, rowIndex) => (
                        <tr key={rowIndex} className="align-top">
                            {cells.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-6 py-5">{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EventCell({ icon, iconClass, title, message }) {
    return (
        <div className="flex max-w-xl gap-4">
            <span className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
                {icon}
            </span>
            <div>
                <p className="text-sm font-extrabold text-slate-950">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{message}</p>
            </div>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="px-8 py-14 text-center text-sm font-semibold text-slate-500">
            {text}
        </div>
    );
}

function Tag({ children }) {
    return (
        <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-extrabold uppercase text-slate-600">
            {children || "-"}
        </span>
    );
}

function PageButton({ children, disabled, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {children}
        </button>
    );
}

function normalizeSystemLogs(payload) {
    return getListData(payload).map((item, index) => {
        const severity = item.severity || "info";
        return {
            id: item.id || item.logId || `system-${index}`,
            logId: item.logId,
            title: item.title || "System Event",
            description: item.description || "System event recorded.",
            severity,
            category: item.category || "system",
            metadata: item.metadata,
            createdAt: item.createdAt,
            createdAtLabel: formatDateTime(item.createdAt),
            icon: severity === "critical" || severity === "warning" ? <AlertTriangle size={17} /> : <Database size={17} />,
            iconClass: severity === "critical"
                ? "bg-red-50 text-red-600"
                : severity === "warning"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-600",
        };
    });
}

function normalizeAuditLogs(payload) {
    return getListData(payload).map((item, index) => ({
        id: item.auditId || `audit-${index}`,
        auditId: item.auditId,
        adminId: item.adminId,
        adminName: item.adminName,
        action: item.action,
        description: item.description || "Admin activity recorded.",
        ipAddress: item.ipAddress,
        createdAt: item.createdAt,
        formattedCreatedAt: item.formattedCreatedAt,
    }));
}

function getListData(payload) {
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload)) return payload;
    return [];
}

function normalizeMeta(payload, fallbackLimit) {
    const meta = payload?.meta || payload?.data?.meta || {};
    const dataLength = getListData(payload).length;
    return {
        page: Number(meta.page || 1),
        limit: Number(meta.limit || fallbackLimit),
        total: Number(meta.total ?? dataLength),
        totalPages: Number(meta.totalPages || Math.max(1, Math.ceil(Number(meta.total ?? dataLength) / Number(meta.limit || fallbackLimit)))),
    };
}

function createMeta() {
    return { page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 1 };
}

function getTotalPages(meta) {
    return Math.max(1, Number(meta.totalPages || Math.ceil(Number(meta.total || 0) / Number(meta.limit || DEFAULT_LIMIT))));
}

function severityBadgeClass(severity) {
    const classes = {
        critical: "bg-red-100 text-red-600",
        warning: "bg-amber-100 text-amber-700",
        info: "bg-blue-100 text-blue-600",
    };
    return classes[severity] || "bg-slate-100 text-slate-600";
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatActionLabel(value) {
    return String(value || "Audit Activity")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function formatErrorMessage(err) {
    const errors = err.response?.data?.errors;
    if (errors && typeof errors === "object") {
        return Object.values(errors).join(" ");
    }

    return err.response?.data?.message || "Failed to load logs activity.";
}
