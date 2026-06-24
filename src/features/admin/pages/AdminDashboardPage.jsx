import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    AlertTriangle,
    Bot,
    Building2,
    Download,
    FileText,
    MoreVertical,
    RefreshCw,
    Server,
    Stethoscope,
    UsersRound,
    X,
} from "lucide-react";
import {
    downloadReport,
    exportReport,
    generateReport,
    getAdminAuditLogs,
    getAdminDashboardSummary,
    getAdminDoctors,
    getAdminRoleDistribution,
    getAdminSystemLogs,
    getAdminUserGrowth,
} from "../services/adminService";
import { getClinicRequests } from "../../../services/clinicRequestService";

const defaultSummary = {
    totalUsers: 0,
    totalUsersChange: 0,
    pendingDoctorApprovals: 0,
    pendingClinicRequests: 0,
    averageDetectionAccuracy: 0,
    accuracyChange: 0,
};

const defaultReportForm = {
    startDate: "",
    endDate: "",
    reportType: "system_overview",
    format: "pdf",
};

export default function AdminDashboardPage() {
    const [summary, setSummary] = useState(defaultSummary);
    const [growth, setGrowth] = useState([]);
    const [roles, setRoles] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportForm, setReportForm] = useState(() => ({
        ...defaultReportForm,
        startDate: getYearStartDate(),
        endDate: getTodayDate(),
    }));
    const [generatedReport, setGeneratedReport] = useState(null);
    const [exportedReport, setExportedReport] = useState(null);
    const [reportError, setReportError] = useState("");
    const [generatingReport, setGeneratingReport] = useState(false);
    const [exportingReport, setExportingReport] = useState(false);

    const fetchDashboardData = () => Promise.allSettled([
        getAdminDashboardSummary(),
        getAdminUserGrowth("30d"),
        getAdminRoleDistribution(),
        getAdminSystemLogs({ page: 1, limit: 3 }),
        getAdminAuditLogs({ page: 1, limit: 3 }),
        getAdminDoctors({ status: "pending", page: 1, limit: 1 }),
        getClinicRequests({ status: "pending", page: 1, limit: 1 }),
    ]);

    const applyDashboardResults = ([summaryResult, growthResult, rolesResult, logsResult, auditResult, pendingDoctorsResult, clinicRequestsResult]) => {
        let nextSummary = { ...defaultSummary };

        if (summaryResult.status === "fulfilled") {
            nextSummary = normalizeSummary(summaryResult.value);
        }

        if (pendingDoctorsResult.status === "fulfilled") {
            nextSummary.pendingDoctorApprovals = getListTotal(pendingDoctorsResult.value);
        }

        if (clinicRequestsResult.status === "fulfilled") {
            nextSummary.pendingClinicRequests = getListTotal(clinicRequestsResult.value);
        }

        setSummary(nextSummary);

        if (growthResult.status === "fulfilled") {
            setGrowth(normalizeGrowth(growthResult.value));
        }

        if (rolesResult.status === "fulfilled") {
            setRoles(normalizeRoles(rolesResult.value));
        }

        if (logsResult.status === "fulfilled") {
            const recentSystemLogs = normalizeLogs(logsResult.value);
            const recentAuditLogs = auditResult.status === "fulfilled" ? normalizeAuditLogs(auditResult.value) : [];
            setLogs([...recentSystemLogs, ...recentAuditLogs]
                .sort((a, b) => b.createdAtMs - a.createdAtMs)
                .slice(0, 5));
        } else if (auditResult.status === "fulfilled") {
            setLogs(normalizeAuditLogs(auditResult.value).slice(0, 5));
        }

        const failed = [summaryResult, growthResult, rolesResult, logsResult, auditResult, pendingDoctorsResult, clinicRequestsResult]
            .find((result) => result.status === "rejected");
        if (failed) {
            setError(failed.reason?.response?.data?.message || "Some dashboard data failed to load.");
        }

        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        let isMounted = true;

        fetchDashboardData().then((results) => {
            if (isMounted) {
                applyDashboardResults(results);
            }
        });

        return () => {
            isMounted = false;
        };
    }, []);

    const refreshDashboard = async () => {
        setError("");
        setRefreshing(true);

        const results = await fetchDashboardData();
        applyDashboardResults(results);
    };

    const updateReportForm = (field, value) => {
        setReportForm((current) => ({ ...current, [field]: value }));
        setGeneratedReport(null);
        setExportedReport(null);
        setReportError("");
    };

    const openReportModal = () => {
        setReportModalOpen(true);
        setReportError("");
    };

    const closeReportModal = () => {
        if (generatingReport || exportingReport) return;
        setReportModalOpen(false);
    };

    const submitGenerateReport = async () => {
        const validationError = validateReportForm(reportForm);
        if (validationError) {
            setReportError(validationError);
            return;
        }

        setGeneratingReport(true);
        setReportError("");
        setExportedReport(null);

        try {
            const result = await generateReport(reportForm);
            setGeneratedReport(result);
        } catch (err) {
            setReportError(formatRequestError(err, "Failed to generate report."));
        } finally {
            setGeneratingReport(false);
        }
    };

    const submitExportReport = async () => {
        const source = generatedReport || reportForm;
        const validationError = validateReportForm(source);
        if (validationError) {
            setReportError(validationError);
            return;
        }

        setExportingReport(true);
        setReportError("");

        try {
            const result = await exportReport({
                startDate: source.startDate,
                endDate: source.endDate,
                reportType: source.reportType,
                format: source.format,
            });
            setExportedReport(result);
            downloadReport(result?.downloadUrl);
        } catch (err) {
            setReportError(formatRequestError(err, "Failed to export report."));
        } finally {
            setExportingReport(false);
        }
    };

    const roleDistribution = roles.length > 0 ? roles : [
        { role: "Patients", percentage: 0, color: "bg-blue-600" },
        { role: "Doctors", percentage: 0, color: "bg-emerald-600" },
        { role: "Admins", percentage: 0, color: "bg-amber-700" },
    ];

    return (
        <div className="mx-auto w-full max-w-7xl pb-8 sm:pb-10">
            <div className="mb-7 flex flex-col gap-5 sm:mb-9 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                    <h1 className="text-3xl font-extrabold leading-tight text-slate-950 sm:text-[40px]">
                        System Overview
                    </h1>
                    <p className="mt-2 text-base text-slate-600">
                        Monitoring platform health and clinical metrics.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:flex sm:items-center sm:gap-4">
                    <button
                        type="button"
                        onClick={openReportModal}
                        className="h-11 w-full rounded-xl bg-slate-200 px-5 text-sm font-extrabold text-slate-900 sm:w-auto"
                    >
                        Generate Report
                    </button>
                    <button
                        type="button"
                        onClick={refreshDashboard}
                        disabled={refreshing}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm disabled:bg-blue-300 sm:w-auto"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                        Refresh Data
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
                    {error}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
                <MetricCard
                    title="Total Users"
                    value={formatNumber(summary.totalUsers)}
                    detail={`${formatSignedPercent(summary.totalUsersChange)} vs last month`}
                    icon={<UsersRound size={18} />}
                    tone="blue"
                    loading={loading}
                />
                <MetricCard
                    title="Doctor Approvals"
                    value={formatNumber(summary.pendingDoctorApprovals)}
                    detail="Pending verification queue"
                    icon={<Stethoscope size={18} />}
                    tone="emerald"
                    loading={loading}
                />
                <MetricCard
                    title="Clinic Requests"
                    value={formatNumber(summary.pendingClinicRequests)}
                    detail="Waiting for admin review"
                    icon={<Building2 size={18} />}
                    tone="amber"
                    loading={loading}
                />
                <MetricCard
                    title="Avg. Detection Acc."
                    value={`${summary.averageDetectionAccuracy}%`}
                    detail={`${formatSignedPercent(summary.accuracyChange)} since last model update`}
                    icon={<Bot size={18} />}
                    tone="blue"
                    loading={loading}
                />
            </div>

            <div className="mt-6 grid gap-6 sm:mt-8 xl:grid-cols-[2fr_0.95fr]">
                <section className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
                    <div className="mb-8 flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-950">User Growth</h2>
                            <p className="mt-1 text-sm text-slate-500">Last 30 Days trend analysis</p>
                        </div>
                        <button type="button" className="text-slate-500">
                            <MoreVertical size={21} />
                        </button>
                    </div>
                    <UserGrowthChart data={growth} totalUsers={summary.totalUsers} loading={loading} />
                </section>

                <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:p-8">
                    <h2 className="mb-7 text-lg font-extrabold text-slate-950">Role Distribution</h2>
                    <div className="space-y-5">
                        {roleDistribution.map((item) => (
                            <div key={item.role} className="flex items-center justify-between gap-6 text-sm">
                                <div className="flex items-center gap-3">
                                    <span className={`h-3 w-3 rounded-full ${item.color}`} />
                                    <span className="font-semibold text-slate-600">{item.role}</span>
                                </div>
                                <span className="font-extrabold text-slate-950">{item.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm sm:mt-8">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
                    <div className="min-w-0">
                        <h2 className="text-lg font-extrabold text-slate-950">System Logs & Activity</h2>
                        <p className="mt-1 text-sm text-slate-500">Recent critical events and system updates</p>
                    </div>
                    <Link to="/admin/activity" className="shrink-0 text-sm font-extrabold text-blue-600">
                        View All
                    </Link>
                </div>

                {loading && (
                    <div className="px-4 py-10 text-center text-sm font-semibold text-slate-500 sm:px-8">
                        Loading system activity...
                    </div>
                )}

                {!loading && logs.length === 0 && (
                    <div className="px-4 py-10 text-center text-sm font-semibold text-slate-500 sm:px-8">
                        No recent system activity.
                    </div>
                )}

                {!loading && logs.map((log) => (
                    <LogRow key={log.id} log={log} />
                ))}
            </section>

            {reportModalOpen && (
                <ReportModal
                    form={reportForm}
                    generatedReport={generatedReport}
                    exportedReport={exportedReport}
                    error={reportError}
                    generating={generatingReport}
                    exporting={exportingReport}
                    onChange={updateReportForm}
                    onGenerate={submitGenerateReport}
                    onExport={submitExportReport}
                    onClose={closeReportModal}
                />
            )}
        </div>
    );
}

function ReportModal({
    form,
    generatedReport,
    exportedReport,
    error,
    generating,
    exporting,
    onChange,
    onGenerate,
    onExport,
    onClose,
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-8">
            <section className="max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-[22px] bg-white p-4 shadow-2xl shadow-slate-950/20 sm:rounded-[28px] sm:p-7">
                <div className="mb-6 flex items-start justify-between gap-3 sm:gap-5">
                    <div className="flex min-w-0 gap-3 sm:gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FileText size={21} />
                        </span>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-950 sm:text-2xl">Generate Admin Report</h2>
                            <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                Generate report metadata, then export the file for download.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={generating || exporting}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50"
                        aria-label="Close report modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {error && (
                    <div className="mb-5 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <ReportField label="Start Date" type="date" value={form.startDate} onChange={(value) => onChange("startDate", value)} />
                    <ReportField label="End Date" type="date" value={form.endDate} onChange={(value) => onChange("endDate", value)} />
                    <ReportSelect
                        label="Report Type"
                        value={form.reportType}
                        options={[
                            ["system_overview", "System Overview"],
                            ["user_stats", "User Statistics"],
                            ["doctor_stats", "Doctor Statistics"],
                        ]}
                        onChange={(value) => onChange("reportType", value)}
                    />
                    <ReportSelect
                        label="Format"
                        value={form.format}
                        options={[
                            ["pdf", "PDF"],
                            ["txt", "TXT"],
                        ]}
                        onChange={(value) => onChange("format", value)}
                    />
                </div>

                {generatedReport && (
                    <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <FileText size={18} />
                            </span>
                            <div>
                                <p className="text-base font-extrabold text-slate-950">{generatedReport.reportId}</p>
                                <p className="text-sm text-slate-500">{generatedReport.message || "Report generated successfully"}</p>
                            </div>
                        </div>
                        <div className="grid gap-3 text-sm md:grid-cols-2">
                            <ReportMeta label="Type" value={formatReportType(generatedReport.reportType)} />
                            <ReportMeta label="Format" value={String(generatedReport.format || "").toUpperCase()} />
                            <ReportMeta label="Period" value={`${generatedReport.startDate} to ${generatedReport.endDate}`} />
                            <ReportMeta label="Generated At" value={formatDateTime(generatedReport.generatedAt)} />
                        </div>
                    </div>
                )}

                {exportedReport?.downloadUrl && (
                    <div className="mt-5 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                        Report exported: {exportedReport.fileName || exportedReport.downloadUrl}
                    </div>
                )}

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={generating || exporting}
                        className="h-12 rounded-xl bg-slate-100 px-6 text-sm font-extrabold text-slate-700 disabled:opacity-50"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={onGenerate}
                        disabled={generating || exporting}
                        className="h-12 rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white shadow-sm shadow-blue-600/20 disabled:bg-blue-300"
                    >
                        {generating ? "Generating..." : "Generate"}
                    </button>
                    <button
                        type="button"
                        onClick={onExport}
                        disabled={!generatedReport || generating || exporting}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-extrabold text-white shadow-sm shadow-slate-900/20 disabled:bg-slate-300"
                    >
                        <Download size={16} />
                        {exporting ? "Exporting..." : "Export & Download"}
                    </button>
                </div>
            </section>
        </div>
    );
}

function ReportField({ label, value, onChange, type = "text" }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 w-full rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-950 outline-none"
            />
        </label>
    );
}

function ReportSelect({ label, value, options, onChange }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 w-full rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-950 outline-none"
            >
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>{optionLabel}</option>
                ))}
            </select>
        </label>
    );
}

function ReportMeta({ label, value }) {
    return (
        <div className="rounded-xl bg-white px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 break-words font-extrabold text-slate-950">{value || "-"}</p>
        </div>
    );
}

function MetricCard({ title, value, detail, icon, tone, progress, loading, dot = false }) {
    const toneClass = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-700",
    }[tone] || "bg-blue-50 text-blue-600";

    return (
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
                    {icon}
                </span>
            </div>
            <p className="text-[34px] font-extrabold leading-none text-slate-950">
                {loading ? "..." : value}
                {dot && <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-600 align-middle" />}
            </p>
            {typeof progress === "number" && (
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-amber-700" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
            )}
            <p className="mt-3 text-xs font-medium text-slate-500">{detail}</p>
        </section>
    );
}

function UserGrowthChart({ data, totalUsers, loading }) {
    const chartData = useMemo(() => {
        const source = data.length > 0 ? data : createGrowthFallback(totalUsers);
        return source.map((item) => ({
            ...item,
            value: Number(item.value || 0),
        }));
    }, [data, totalUsers]);

    return (
        <div className="relative h-56 min-w-0 sm:h-64">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 text-sm font-semibold text-slate-500">
                    Loading chart...
                </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                        <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 12,
                            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                            fontSize: 12,
                        }}
                        formatter={(value) => [formatNumber(value), "Users"]}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={3}
                        fill="url(#userGrowthFill)"
                        activeDot={{ r: 5, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function LogRow({ log }) {
    const severityStyle = {
        critical: {
            icon: <AlertTriangle size={16} />,
            bubble: "bg-red-100 text-red-500",
            badge: "bg-red-100 text-red-600",
        },
        info: {
            icon: <Bot size={16} />,
            bubble: "bg-blue-100 text-blue-600",
            badge: "bg-blue-100 text-blue-600",
        },
        success: {
            icon: <UsersRound size={16} />,
            bubble: "bg-emerald-100 text-emerald-600",
            badge: "bg-emerald-100 text-emerald-600",
        },
    }[log.severity] || {
        icon: <Server size={16} />,
        bubble: "bg-slate-100 text-slate-600",
        badge: "bg-slate-100 text-slate-600",
    };

    return (
        <article className="flex gap-3 border-b border-slate-100 px-4 py-5 last:border-b-0 sm:gap-5 sm:px-6 sm:py-6 lg:px-8">
            <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${severityStyle.bubble}`}>
                {severityStyle.icon}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                    <h3 className="text-sm font-extrabold text-slate-950">{log.title}</h3>
                    <span className="shrink-0 text-xs text-slate-400">{log.timeAgo}</span>
                </div>
                <p className="mt-1 max-w-4xl text-sm leading-relaxed text-slate-600">{log.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-md px-3 py-1 text-[10px] font-extrabold uppercase ${severityStyle.badge}`}>
                        {log.severity}
                    </span>
                    {log.category && (
                        <span className="rounded-md bg-slate-200 px-3 py-1 text-[10px] font-extrabold uppercase text-slate-600">
                            {log.category}
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}

function normalizeSummary(data) {
    return {
        totalUsers: Number(data?.totalUsers ?? data?.users?.total ?? defaultSummary.totalUsers),
        totalUsersChange: Number(data?.totalUsersChange ?? data?.totalUsersGrowth ?? data?.users?.change ?? defaultSummary.totalUsersChange),
        pendingDoctorApprovals: Number(data?.pendingDoctorApprovals ?? data?.pendingApprovals ?? defaultSummary.pendingDoctorApprovals),
        pendingClinicRequests: Number(data?.pendingClinicRequests ?? data?.pendingClinicApprovals ?? defaultSummary.pendingClinicRequests),
        averageDetectionAccuracy: Number(data?.averageDetectionAccuracy ?? data?.accuracy?.average ?? defaultSummary.averageDetectionAccuracy),
        accuracyChange: Number(data?.accuracyChange ?? data?.accuracyGrowth ?? data?.accuracy?.change ?? defaultSummary.accuracyChange),
    };
}

function normalizeGrowth(data) {
    const source = Array.isArray(data) ? data : data?.items || data?.growth || data?.data || [];
    return source.map((item, index) => ({
        label: item.label || item.week || item.period || item.date || `Week ${index + 1}`,
        value: Number(item.value ?? item.count ?? item.users ?? item.totalUsers ?? 0),
    }));
}

function normalizeRoles(data) {
    const source = Array.isArray(data) ? data : data?.roles || data?.distribution || data?.data || [];
    const colorMap = {
        patient: "bg-blue-600",
        patients: "bg-blue-600",
        doctor: "bg-emerald-600",
        doctors: "bg-emerald-600",
        admin: "bg-amber-700",
        admins: "bg-amber-700",
    };

    return source.map((item) => {
        const role = item.role || item.name || "Role";
        return {
            role: titleCase(role),
            percentage: Number(item.percentage ?? item.percent ?? 0),
            color: colorMap[String(role).toLowerCase()] || "bg-slate-500",
        };
    });
}

function getListData(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
}

function getListMeta(payload) {
    return payload?.meta || payload?.data?.meta || {};
}

function getListTotal(payload) {
    const meta = getListMeta(payload);
    return Number(meta.total ?? getListData(payload).length ?? 0);
}

function normalizeLogs(payload, fallbackCategory = "") {
    const source = getListData(payload);
    return source.map((item, index) => ({
        id: item.id || item.logId || item.auditId || `${item.action || "log"}-${index}`,
        title: item.title || formatActionLabel(item.action) || "System Activity",
        message: item.message || item.description || "System event recorded.",
        severity: normalizeSeverity(item.severity || item.level || item.type),
        category: item.category || item.module || item.type || fallbackCategory,
        createdAtMs: getDateMs(item.createdAt || item.created_at || item.timestamp),
        timeAgo: formatTimeAgo(item.createdAt || item.created_at || item.timestamp),
    }));
}

function normalizeAuditLogs(payload) {
    const source = getListData(payload);
    return source.map((item, index) => ({
        id: item.auditId || item.id || `audit-${index}`,
        title: formatActionLabel(item.action) || "Audit Activity",
        message: item.description || "Admin activity recorded.",
        severity: "info",
        category: "audit",
        createdAtMs: getDateMs(item.createdAt),
        timeAgo: item.formattedCreatedAt || formatTimeAgo(item.createdAt),
    }));
}

function createGrowthFallback(totalUsers) {
    const total = Math.max(Number(totalUsers || 0), 24);
    const labels = ["Week 1", "Week 2", "Week 3", "Week 4", "This Week"];
    const ratios = [0.68, 0.74, 0.82, 0.91, 1];

    return labels.map((label, index) => ({
        label,
        value: Math.max(1, Math.round(total * ratios[index])),
    }));
}

function getDateMs(value) {
    const date = value ? new Date(value) : new Date(0);
    const time = date.getTime();
    return Number.isNaN(time) ? 0 : time;
}

function formatActionLabel(value) {
    if (!value) return "";
    return titleCase(value);
}

function normalizeSeverity(value) {
    const severity = String(value || "").toLowerCase();
    if (severity.includes("critical") || severity.includes("error") || severity.includes("warn")) return "critical";
    if (severity.includes("success") || severity.includes("complete")) return "success";
    return "info";
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function formatSignedPercent(value) {
    const number = Number(value || 0);
    const sign = number > 0 ? "+" : "";
    return `${sign}${number}%`;
}

function formatTimeAgo(value) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} mins ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hrs ago`;

    const days = Math.floor(hours / 24);
    return `${days} days ago`;
}

function validateReportForm(form) {
    if (!form.startDate) return "Start date is required.";
    if (!form.endDate) return "End date is required.";
    if (!form.reportType) return "Report type is required.";
    if (new Date(form.endDate) < new Date(form.startDate)) {
        return "End date cannot be earlier than start date.";
    }
    if (!["pdf", "txt"].includes(form.format)) {
        return "Format must be PDF or TXT.";
    }
    return "";
}

function formatRequestError(err, fallback) {
    return err.response?.data?.message || err.response?.data?.error || fallback;
}

function formatReportType(value) {
    const labels = {
        system_overview: "System Overview",
        user_stats: "User Statistics",
        doctor_stats: "Doctor Statistics",
    };
    return labels[value] || titleCase(value);
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

function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

function getYearStartDate() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString().slice(0, 10);
}

function titleCase(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
