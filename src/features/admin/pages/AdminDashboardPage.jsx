import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    BarChart3,
    Bot,
    Database,
    MoreVertical,
    RefreshCw,
    Server,
    UsersRound,
    Wifi,
} from "lucide-react";
import {
    getAdminDashboardSummary,
    getAdminRoleDistribution,
    getAdminSystemLogs,
    getAdminUserGrowth,
} from "../services/adminService";

const defaultSummary = {
    totalUsers: 0,
    totalUsersChange: 0,
    activeSessions: 0,
    storageUsagePercent: 0,
    storageUsed: "0 TB",
    storageTotal: "0 TB",
    averageDetectionAccuracy: 0,
    accuracyChange: 0,
};

export default function AdminDashboardPage() {
    const [summary, setSummary] = useState(defaultSummary);
    const [growth, setGrowth] = useState([]);
    const [roles, setRoles] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchDashboard = async () => {
        setError("");
        setRefreshing(true);

        const [summaryResult, growthResult, rolesResult, logsResult] = await Promise.allSettled([
            getAdminDashboardSummary(),
            getAdminUserGrowth("30d"),
            getAdminRoleDistribution(),
            getAdminSystemLogs({ type: "system", severity: "info", page: 1, limit: 3 }),
        ]);

        if (summaryResult.status === "fulfilled") {
            setSummary(normalizeSummary(summaryResult.value));
        }

        if (growthResult.status === "fulfilled") {
            setGrowth(normalizeGrowth(growthResult.value));
        }

        if (rolesResult.status === "fulfilled") {
            setRoles(normalizeRoles(rolesResult.value));
        }

        if (logsResult.status === "fulfilled") {
            setLogs(normalizeLogs(logsResult.value));
        }

        const failed = [summaryResult, growthResult, rolesResult, logsResult].find((result) => result.status === "rejected");
        if (failed) {
            setError(failed.reason?.response?.data?.message || "Some dashboard data failed to load.");
        }

        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const roleDistribution = roles.length > 0 ? roles : [
        { role: "Patients", percentage: 0, color: "bg-blue-600" },
        { role: "Doctors", percentage: 0, color: "bg-emerald-600" },
        { role: "Admins", percentage: 0, color: "bg-amber-700" },
    ];

    return (
        <div className="mx-auto max-w-7xl pb-10">
            <div className="mb-9 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-[40px] font-extrabold leading-tight text-slate-950">
                        System Overview
                    </h1>
                    <p className="mt-2 text-base text-slate-600">
                        Monitoring platform health and clinical metrics.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className="h-11 rounded-xl bg-slate-200 px-5 text-sm font-extrabold text-slate-900"
                    >
                        Generate Report
                    </button>
                    <button
                        type="button"
                        onClick={fetchDashboard}
                        disabled={refreshing}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm disabled:bg-blue-300"
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

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Total Users"
                    value={formatNumber(summary.totalUsers)}
                    detail={`${formatSignedPercent(summary.totalUsersChange)} vs last month`}
                    icon={<UsersRound size={18} />}
                    tone="blue"
                    loading={loading}
                />
                <MetricCard
                    title="Active Sessions"
                    value={formatNumber(summary.activeSessions)}
                    detail="Real-time concurrency"
                    icon={<Wifi size={18} />}
                    tone="emerald"
                    loading={loading}
                    dot
                />
                <MetricCard
                    title="Storage Usage"
                    value={`${summary.storageUsagePercent}%`}
                    detail={`${summary.storageUsed} / ${summary.storageTotal} Total`}
                    icon={<Database size={18} />}
                    tone="amber"
                    progress={summary.storageUsagePercent}
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

            <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_0.95fr]">
                <section className="rounded-2xl bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-950">User Growth</h2>
                            <p className="mt-1 text-sm text-slate-500">Last 30 Days trend analysis</p>
                        </div>
                        <button type="button" className="text-slate-500">
                            <MoreVertical size={21} />
                        </button>
                    </div>
                    <UserGrowthChart data={growth} loading={loading} />
                </section>

                <section className="rounded-2xl bg-white p-8 shadow-sm">
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

            <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-8 py-7">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-950">System Logs & Activity</h2>
                        <p className="mt-1 text-sm text-slate-500">Recent critical events and system updates</p>
                    </div>
                    <button type="button" className="text-sm font-extrabold text-blue-600">
                        View All
                    </button>
                </div>

                {loading && (
                    <div className="px-8 py-10 text-center text-sm font-semibold text-slate-500">
                        Loading system activity...
                    </div>
                )}

                {!loading && logs.length === 0 && (
                    <div className="px-8 py-10 text-center text-sm font-semibold text-slate-500">
                        No recent system activity.
                    </div>
                )}

                {!loading && logs.map((log) => (
                    <LogRow key={log.id} log={log} />
                ))}
            </section>
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
        <section className="rounded-2xl bg-white p-6 shadow-sm">
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

function UserGrowthChart({ data, loading }) {
    const points = useMemo(() => {
        const source = data.length > 0 ? data : [
            { label: "Week 1", value: 0 },
            { label: "Week 2", value: 0 },
            { label: "Week 3", value: 0 },
            { label: "Week 4", value: 0 },
        ];
        const max = Math.max(...source.map((item) => item.value), 1);

        return source.map((item, index) => ({
            ...item,
            x: (index / Math.max(source.length - 1, 1)) * 100,
            y: 100 - (item.value / max) * 82,
        }));
    }, [data]);
    const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const areaPath = `${path} L 100 100 L 0 100 Z`;

    return (
        <div className="relative h-64">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 text-sm font-semibold text-slate-500">
                    Loading chart...
                </div>
            )}
            <div className="absolute inset-x-0 top-0 grid h-52 grid-rows-4 text-xs text-slate-400">
                {["15k", "10k", "5k", "0"].map((label) => (
                    <div key={label} className="flex items-start gap-5 border-b border-dashed border-slate-200">
                        <span className="w-8 -translate-y-1">{label}</span>
                    </div>
                ))}
            </div>
            <svg className="absolute bottom-7 left-12 right-0 top-0 h-52 w-[calc(100%-3rem)]" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d={areaPath} fill="#eff6ff" />
                <path d={path} fill="none" stroke="#dbeafe" strokeWidth="1.2" />
            </svg>
            <div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-slate-500">
                {points.map((point) => (
                    <span key={point.label}>{point.label}</span>
                ))}
            </div>
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
        <article className="flex gap-5 border-b border-slate-100 px-8 py-6 last:border-b-0">
            <span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${severityStyle.bubble}`}>
                {severityStyle.icon}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-5">
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
        totalUsersChange: Number(data?.totalUsersChange ?? data?.users?.change ?? defaultSummary.totalUsersChange),
        activeSessions: Number(data?.activeSessions ?? data?.sessions?.active ?? defaultSummary.activeSessions),
        storageUsagePercent: Number(data?.storageUsagePercent ?? data?.storage?.usagePercent ?? defaultSummary.storageUsagePercent),
        storageUsed: data?.storageUsed || data?.storage?.used || defaultSummary.storageUsed,
        storageTotal: data?.storageTotal || data?.storage?.total || defaultSummary.storageTotal,
        averageDetectionAccuracy: Number(data?.averageDetectionAccuracy ?? data?.accuracy?.average ?? defaultSummary.averageDetectionAccuracy),
        accuracyChange: Number(data?.accuracyChange ?? data?.accuracy?.change ?? defaultSummary.accuracyChange),
    };
}

function normalizeGrowth(data) {
    const source = Array.isArray(data) ? data : data?.items || data?.growth || data?.data || [];
    return source.map((item, index) => ({
        label: item.label || item.week || item.period || `Week ${index + 1}`,
        value: Number(item.value ?? item.count ?? item.users ?? 0),
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

function normalizeLogs(payload) {
    const source = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return source.map((item, index) => ({
        id: item.id || item.logId || `${item.action || "log"}-${index}`,
        title: item.title || item.action || "System Activity",
        message: item.message || item.description || "System event recorded.",
        severity: normalizeSeverity(item.severity || item.level || item.type),
        category: item.category || item.module || item.type,
        timeAgo: formatTimeAgo(item.createdAt || item.created_at || item.timestamp),
    }));
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

function titleCase(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
