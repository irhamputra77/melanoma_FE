import { useEffect, useState } from "react";
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Download,
    ListFilter,
    X,
    XCircle,
} from "lucide-react";
import profileDoctor from "../../../assets/login_doctor_profile.png";
import { toAssetUrl } from "../../../utils/assets";
import {
    approveAdminDoctor,
    getAdminDoctorVerificationRequests,
    getAdminDoctors,
    getAdminDoctorsSummary,
    rejectAdminDoctor,
} from "../services/adminService";

export default function DoctorDetailsPage() {
    const [doctors, setDoctors] = useState([]);
    const [summary, setSummary] = useState({ totalClinicians: 0, pendingApprovals: 0, patientThroughput: 0 });
    const [meta, setMeta] = useState({ page: 1, limit: 8, total: 0 });
    const [page, setPage] = useState(1);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError("");

        Promise.allSettled([
            getAdminDoctorsSummary(),
            getAdminDoctors({ status: "verified", page, limit: 8 }),
        ])
            .then(([summaryResult, doctorsResult]) => {
                if (!isMounted) return;

                if (summaryResult.status === "fulfilled") {
                    setSummary(normalizeSummary(summaryResult.value));
                }

                if (doctorsResult.status === "fulfilled") {
                    const data = Array.isArray(doctorsResult.value.data) ? doctorsResult.value.data : [];
                    setDoctors(data.map(normalizeDoctor));
                    setMeta(doctorsResult.value.meta || { page, limit: 8, total: data.length });
                } else {
                    throw doctorsResult.reason;
                }
            })
            .catch((error) => {
                if (isMounted) {
                    setError(error.response?.data?.message || "Failed to fetch doctors.");
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [page]);

    const openRequests = async (doctor) => {
        setSelectedDoctor(doctor);
        setRequests([]);
        setRequestLoading(true);
        setError("");

        try {
            const data = await getAdminDoctorVerificationRequests(doctor.id);
            setRequests(normalizeRequests(data));
        } catch (error) {
            setError(error.response?.data?.message || "Failed to fetch verification requests.");
        } finally {
            setRequestLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedDoctor?.id) return;
        setActionLoading("approve");

        try {
            await approveAdminDoctor(selectedDoctor.id, { note: "Approved" });
            setSelectedDoctor(null);
            setDoctors((current) => current.map((doctor) =>
                doctor.id === selectedDoctor.id ? { ...doctor, status: "Verified" } : doctor
            ));
        } catch (error) {
            setError(error.response?.data?.message || "Failed to approve doctor.");
        } finally {
            setActionLoading("");
        }
    };

    const handleReject = async () => {
        if (!selectedDoctor?.id) return;
        setActionLoading("reject");

        try {
            await rejectAdminDoctor(selectedDoctor.id, { reason: "License invalid" });
            setSelectedDoctor(null);
            setDoctors((current) => current.map((doctor) =>
                doctor.id === selectedDoctor.id ? { ...doctor, status: "Rejected" } : doctor
            ));
        } catch (error) {
            setError(error.response?.data?.message || "Failed to reject doctor.");
        } finally {
            setActionLoading("");
        }
    };

    return (
        <div className="max-w-6xl">
            <div className="mb-10 flex items-end justify-between gap-6">
                <div>
                    <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-blue-600">
                        Internal Operations
                    </p>
                    <h1 className="max-w-3xl text-[40px] font-extrabold leading-tight text-slate-950">
                        Manage your medical team's precision and performance.
                    </h1>
                </div>

                <div className="flex gap-3">
                    <button type="button" className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-200/50 px-6 font-extrabold text-slate-700">
                        <ListFilter size={18} />
                        Filters
                    </button>
                    <button type="button" className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-7 font-extrabold text-white">
                        <Download size={18} />
                        Export Report
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}

            <div className="mb-4 grid max-w-4xl grid-cols-3 gap-6">
                <StatCard label="Total Clinicians" value={summary.totalClinicians} accent="+12%" />
                <StatCard label="Pending Approvals" value={summary.pendingApprovals} badge="Urgent" />
                <StatCard label="Patient Throughput" value={summary.patientThroughput} accent="Avg / Mo" muted />
            </div>

            <div className="overflow-hidden rounded-[32px] border-4 border-slate-200/60 bg-white">
                <div className="grid grid-cols-[1.25fr_1fr_1.2fr_0.9fr_0.7fr] bg-slate-50 px-10 py-6 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                    <span>Name</span>
                    <span>Registration Date</span>
                    <span>Email</span>
                    <span>Patient Load</span>
                    <span>Actions</span>
                </div>

                {loading && (
                    <div className="px-10 py-10 text-center text-sm font-semibold text-slate-500">
                        Loading doctors...
                    </div>
                )}

                {!loading && doctors.length === 0 && (
                    <div className="px-10 py-10 text-center text-sm font-semibold text-slate-500">
                        No doctors found.
                    </div>
                )}

                {!loading && doctors.map((doctor) => (
                    <div
                        key={doctor.id || doctor.email}
                        className="grid min-h-[104px] grid-cols-[1.25fr_1fr_1.2fr_0.9fr_0.7fr] items-center px-10 text-sm text-slate-700"
                    >
                        <div className="flex items-center gap-4">
                            <img src={toAssetUrl(doctor.avatar)} alt={doctor.name} className="h-10 w-10 rounded-full object-cover" />
                            <div>
                                <p className="text-lg font-extrabold text-slate-900">{doctor.name}</p>
                                <p className="text-sm text-slate-400">ID: #{doctor.id}</p>
                            </div>
                        </div>
                        <span className="text-xs font-extrabold uppercase text-slate-700">{doctor.registrationDate}</span>
                        <span>{doctor.email}</span>
                        <span className="font-extrabold text-emerald-700">{doctor.patientLoad}</span>
                        <button type="button" onClick={() => openRequests(doctor)} className="text-sm font-extrabold text-blue-600">
                            Details
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex items-center justify-between px-6 text-sm text-slate-600">
                <p>
                    Showing <span className="font-extrabold text-slate-900">{doctors.length}</span> of {meta.total} doctors
                </p>
                <div className="flex items-center gap-2">
                    <PageButton disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft size={19} />
                    </PageButton>
                    <PageButton active>{page}</PageButton>
                    <PageButton disabled={page >= Math.max(1, Math.ceil(meta.total / meta.limit))} onClick={() => setPage(page + 1)}>
                        <ChevronRight size={19} />
                    </PageButton>
                </div>
            </div>

            {selectedDoctor && (
                <VerificationModal
                    doctor={selectedDoctor}
                    requests={requests}
                    loading={requestLoading}
                    actionLoading={actionLoading}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onClose={() => setSelectedDoctor(null)}
                />
            )}
        </div>
    );
}

function StatCard({ label, value, accent, badge, muted = false }) {
    return (
        <div className="rounded-2xl bg-slate-200/45 p-6">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <div className="flex items-end gap-3">
                <p className="text-3xl font-extrabold text-slate-950">{value}</p>
                {accent && <span className={`pb-1 text-sm font-extrabold ${muted ? "text-slate-400" : "text-emerald-700"}`}>{accent}</span>}
                {badge && <span className="mb-1 rounded-md bg-red-100 px-2 py-1 text-[10px] font-extrabold uppercase text-red-600">{badge}</span>}
            </div>
        </div>
    );
}

function PageButton({ children, active = false, disabled = false, onClick }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex h-10 w-10 items-center justify-center rounded-xl font-extrabold shadow-sm disabled:opacity-40 ${active ? "bg-blue-600 text-white shadow-blue-600/20" : "bg-white text-slate-600"}`}
        >
            {children}
        </button>
    );
}

function VerificationModal({ doctor, requests, loading, actionLoading, onApprove, onReject, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-sm">
            <div className="w-full max-w-[620px] rounded-[32px] bg-white p-8 shadow-2xl shadow-slate-900/20">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">Verification requests</h2>
                        <p className="mt-1 text-sm text-slate-500">{doctor.name}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-hidden rounded-[30px] border-4 border-slate-100">
                    <div className="grid grid-cols-[1.1fr_0.75fr_1fr] bg-slate-50 px-7 py-5 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        <span>Patient Name</span>
                        <span>Date</span>
                        <span>Diagnosis AI</span>
                    </div>

                    {loading && <div className="px-7 py-8 text-center text-sm font-semibold text-slate-500">Loading requests...</div>}
                    {!loading && requests.length === 0 && <div className="px-7 py-8 text-center text-sm font-semibold text-slate-500">No verification requests.</div>}
                    {!loading && requests.map((request) => (
                        <div key={request.id} className="grid grid-cols-[1.1fr_0.75fr_1fr] items-center px-7 py-6">
                            <div className="flex items-center gap-4">
                                <img src={toAssetUrl(request.avatar)} alt={request.patientName} className="h-10 w-10 rounded-full object-cover" />
                                <div>
                                    <p className="text-lg font-extrabold text-slate-900">{request.patientName}</p>
                                    <p className="text-sm text-slate-400">ID: #{request.id}</p>
                                </div>
                            </div>
                            <span className="text-xs font-extrabold uppercase text-slate-700">{request.date}</span>
                            <span className="text-sm font-extrabold leading-tight text-emerald-700">{request.diagnosis}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                    <button type="button" onClick={onReject} disabled={Boolean(actionLoading)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-50 font-extrabold text-red-600 disabled:opacity-60">
                        <XCircle size={18} />
                        {actionLoading === "reject" ? "Rejecting..." : "Reject Doctor"}
                    </button>
                    <button type="button" onClick={onApprove} disabled={Boolean(actionLoading)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 font-extrabold text-white disabled:bg-blue-300">
                        <CheckCircle2 size={18} />
                        {actionLoading === "approve" ? "Approving..." : "Approve Doctor"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function normalizeSummary(data) {
    return {
        totalClinicians: data?.totalClinicians ?? data?.totalDoctors ?? data?.doctors ?? 0,
        pendingApprovals: data?.pendingApprovals ?? data?.pending ?? 0,
        patientThroughput: data?.patientThroughput ?? data?.throughput ?? 0,
    };
}

function normalizeDoctor(doctor) {
    return {
        id: doctor.id || doctor.doctorId || doctor.userId || "",
        name: doctor.fullName || doctor.name || doctor.full_name || "Doctor",
        registrationDate: formatDate(doctor.registrationDate || doctor.createdAt || doctor.joinedAt),
        email: doctor.email || "",
        patientLoad: doctor.patientLoad ?? doctor.assignedPatients ?? 0,
        status: doctor.status || doctor.verificationStatus || "",
        avatar: doctor.profilePhotoUrl || doctor.avatarUrl || doctor.avatar || profileDoctor,
    };
}

function normalizeRequests(data) {
    const source = Array.isArray(data) ? data : Array.isArray(data?.requests) ? data.requests : [];
    return source.map((request, index) => ({
        id: request.id || request.requestId || request.scanId || `request-${index}`,
        patientName: request.patient?.name || request.patientName || "Patient",
        date: formatDate(request.date || request.createdAt),
        diagnosis: request.diagnosis || request.aiPrediction || request.finalDiagnosis || "-",
        avatar: request.patient?.avatarUrl || request.avatarUrl || profileDoctor,
    }));
}

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();
}
