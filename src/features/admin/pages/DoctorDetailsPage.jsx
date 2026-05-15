import { useEffect, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Download,
    ListFilter,
    X,
} from "lucide-react";
import profileDoctor from "../../../assets/login_doctor_profile.png";
import { toAssetUrl } from "../../../utils/assets";
import {
    getAdminDoctorVerificationRequests,
    getAdminDoctors,
    getAdminDoctorsSummary,
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
    const [modalError, setModalError] = useState("");
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

    const openDoctorDetails = async (doctor) => {
        setSelectedDoctor(doctor);
        setRequests([]);
        setRequestLoading(true);
        setModalError("");
        setError("");

        try {
            const data = await getAdminDoctorVerificationRequests(doctor.id);
            setRequests(normalizeRequests(data));
        } catch (error) {
            setModalError(error.response?.data?.message || "Failed to fetch verification requests.");
        } finally {
            setRequestLoading(false);
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
                        <button type="button" onClick={() => openDoctorDetails(doctor)} className="text-sm font-extrabold text-blue-600">
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
                <VerificationRequestModal
                    requests={requests}
                    loading={requestLoading}
                    error={modalError}
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

function VerificationRequestModal({ requests, loading, error, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <div className="w-full max-w-[420px] rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="mb-7 flex items-center justify-between">
                    <h2 className="text-2xl font-extrabold text-slate-950">Verification request</h2>
                    <button type="button" onClick={onClose} className="text-slate-600" aria-label="Close">
                        <X size={22} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-[26px] border-4 border-slate-100">
                    <div className="grid grid-cols-[1.15fr_0.7fr_0.95fr] bg-slate-50 px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        <span>Patient Name</span>
                        <span>Date</span>
                        <span>Diagnosis AI</span>
                    </div>

                    {loading && (
                        <div className="px-5 py-7 text-center text-sm font-semibold text-slate-500">
                            Loading requests...
                        </div>
                    )}

                    {!loading && requests.length === 0 && (
                        <div className="px-5 py-7 text-center text-sm font-semibold text-slate-500">
                            No verification requests.
                        </div>
                    )}

                    {!loading && requests.map((request) => (
                        <div key={request.id} className="grid grid-cols-[1.15fr_0.7fr_0.95fr] items-center px-5 py-5">
                            <div className="flex items-center gap-3">
                                {request.avatar ? (
                                    <img src={toAssetUrl(request.avatar)} alt={request.patientName} className="h-9 w-9 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-extrabold text-blue-600">
                                        {initials(request.patientName)}
                                    </div>
                                )}
                                <div>
                                    <p className="font-extrabold leading-tight text-slate-950">{request.patientName}</p>
                                    <p className="mt-1 text-xs text-slate-400">ID: #{request.id}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-extrabold uppercase text-slate-700">{request.date}</span>
                            <span className="text-xs font-extrabold leading-tight text-emerald-700">{request.diagnosis}</span>
                        </div>
                    ))}
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
        id: doctor.doctorId || doctor.id || "",
        userId: doctor.userId || "",
        displayId: doctor.clinicId || doctor.licenseNumber || doctor.doctorId || doctor.userId || "",
        name: doctor.fullName || doctor.name || doctor.full_name || "Doctor",
        registrationDate: formatDate(doctor.registrationDate || doctor.createdAt || doctor.joinedAt),
        email: doctor.email || "",
        phone: doctor.phoneNumber || doctor.phone || "",
        birthDate: doctor.birthDate || "",
        gender: titleCase(doctor.gender || ""),
        patientLoad: doctor.patientLoad ?? doctor.assignedPatients ?? 0,
        status: doctor.status || doctor.verificationStatus || "",
        specialization: doctor.specialization || "",
        licenseNumber: doctor.licenseNumber || "",
        licenseFile: doctor.licenseFile || "",
        avatar: doctor.profilePhotoUrl || doctor.avatarUrl || doctor.avatar || profileDoctor,
    };
}

function normalizeRequests(data) {
    const source = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
            ? data.data
            : [];

    return source.map((request, index) => ({
        id: request.requestId || request.caseId || request.id || `request-${index}`,
        patientName: request.patientName || request.patient?.name || "Patient",
        date: formatDate(request.date || request.createdAt),
        diagnosis: formatDiagnosis(request.aiDiagnosis || request.diagnosis || request.aiPrediction, request.aiConfidence),
        avatar: request.patientAvatarUrl || "",
    }));
}

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();
}

function formatDiagnosis(diagnosis, confidence) {
    if (!diagnosis) return "-";
    if (typeof confidence !== "number") return diagnosis;
    return `${Math.round(confidence * 100)}% ${diagnosis}`;
}

function initials(name) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return parts.length > 0 ? parts.map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "PT";
}

function titleCase(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
