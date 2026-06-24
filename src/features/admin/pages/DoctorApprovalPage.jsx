import { useEffect, useState } from "react";
import {
    BadgeCheck,
    Building2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Eye,
    FileText,
    Mail,
    RefreshCw,
    Search,
    Stethoscope,
    X,
    XCircle,
} from "lucide-react";
import { getClinics } from "../../../services/clinicService";
import {
    approveAdminDoctor,
    getAdminDoctors,
    rejectAdminDoctor,
} from "../services/adminService";
import { toAssetUrl } from "../../../utils/assets";
import { DEFAULT_ADMIN_PAGE_SIZE } from "../../../utils/adminSettings";

export default function DoctorApprovalPage() {
    const [doctors, setDoctors] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: DEFAULT_ADMIN_PAGE_SIZE, total: 0 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [clinicFilter, setClinicFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [reviewError, setReviewError] = useState("");
    const [reviewTarget, setReviewTarget] = useState(null);
    const [filePreviewTarget, setFilePreviewTarget] = useState(null);

    const fetchPendingDoctors = async () => {
        setLoading(true);
        setError("");

        try {
            const [doctorsResult, clinicsResult] = await Promise.allSettled([
                getAdminDoctors({
                    search: search.trim() || undefined,
                    status: "pending",
                    clinicId: clinicFilter === "all" ? undefined : clinicFilter,
                    page,
                }),
                getClinics({ page: 1, limit: 100, isActive: "all" }),
            ]);
            if (doctorsResult.status === "rejected") {
                throw doctorsResult.reason;
            }

            const clinicList = clinicsResult.status === "fulfilled" ? parseClinicList(clinicsResult.value) : clinics;
            const clinicMap = Object.fromEntries(clinicList.map((clinic) => [clinic.clinicId, clinic.name]));
            const doctorList = (doctorsResult.value.data || []).map((doctor) => normalizeDoctor(doctor, clinicMap));

            setClinics(clinicList);
            setDoctors(doctorList);
            setMeta(doctorsResult.value.meta || { page, limit: DEFAULT_ADMIN_PAGE_SIZE, total: doctorList.length });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch pending doctors.");
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingDoctors();
    }, [page, clinicFilter]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setPage(1);
            fetchPendingDoctors();
        }, 350);

        return () => clearTimeout(timeout);
    }, [search]);

    const submitReview = async (event) => {
        event.preventDefault();
        if (!reviewTarget) return;

        if (reviewTarget.action === "reject" && !reviewTarget.note.trim()) {
            setReviewError("Reason wajib diisi saat menolak doctor.");
            return;
        }

        setSaving(true);
        setError("");
        setReviewError("");
        setSuccess("");

        try {
            if (reviewTarget.action === "approve") {
                await approveAdminDoctor(reviewTarget.doctorId, { note: reviewTarget.note.trim() || "Approved from doctor approval page" });
                setSuccess("Doctor berhasil disetujui.");
            } else {
                await rejectAdminDoctor(reviewTarget.doctorId, { reason: reviewTarget.note.trim() });
                setSuccess("Doctor berhasil ditolak.");
            }
            setReviewTarget(null);
            await fetchPendingDoctors();
        } catch (err) {
            setReviewError(getApiErrorMessage(err) || "Gagal memproses approval doctor.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl pb-10">
            <div className="mb-7 flex flex-col gap-5 sm:mb-9 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold leading-tight text-slate-950 sm:text-[40px]">
                        Doctor Approval
                    </h1>
                    <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
                        Review pending doctor registrations and approve clinic access.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchPendingDoctors}
                    disabled={loading}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm shadow-blue-600/20 disabled:bg-blue-300 sm:w-auto"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Refresh Data
                </button>
            </div>

            <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
                <label className="relative block">
                    <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search pending doctors"
                        className="h-11 w-full rounded-xl bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
                    />
                </label>
                <select
                    value={clinicFilter}
                    onChange={(event) => {
                        setClinicFilter(event.target.value);
                        setPage(1);
                    }}
                    className="h-11 w-full rounded-xl bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm outline-none xl:w-auto"
                >
                    <option value="all">All clinics</option>
                    {clinics.map((clinic) => (
                        <option key={clinic.clinicId} value={clinic.clinicId}>{clinic.name}</option>
                    ))}
                </select>
            </div>

            {error && <Alert tone="red" text={error} />}
            {success && <Alert tone="emerald" text={success} />}

            <section className="admin-table-scroll overflow-x-auto rounded-[24px] border border-slate-200/70 bg-white shadow-sm sm:rounded-[28px]">
                <div className="grid min-w-[960px] grid-cols-[1.1fr_1.15fr_1fr_0.9fr_0.9fr] gap-6 bg-slate-50 px-8 py-5 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                    <span>Doctor</span>
                    <span>Contact</span>
                    <span>Clinic</span>
                    <span>License</span>
                    <span>Actions</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {loading && <EmptyRow text="Loading pending doctors..." />}
                    {!loading && doctors.length === 0 && <EmptyRow text="No pending doctor approvals." />}
                    {!loading && doctors.map((doctor) => (
                        <article key={doctor.key} className="grid min-h-[104px] min-w-[960px] grid-cols-[1.1fr_1.15fr_1fr_0.9fr_0.9fr] items-center gap-6 px-8 text-sm text-slate-700">
                            <div className="flex items-center gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                                    <Stethoscope size={20} />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-base font-extrabold text-slate-950">{doctor.name}</p>
                                    <p className="truncate text-xs font-semibold text-slate-400">{doctor.specialization || "Dermatology"}</p>
                                </div>
                            </div>
                            <InfoLine icon={<Mail size={14} />} value={doctor.email || "-"} />
                            <InfoLine icon={<Building2 size={15} />} value={doctor.clinicName || "No clinic"} />
                            <LicenseCell doctor={doctor} onPreview={() => setFilePreviewTarget(doctor)} />
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReviewError("");
                                        setReviewTarget({ ...doctor, action: "approve", note: "Doctor data valid." });
                                    }}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                                    aria-label="Approve doctor"
                                >
                                    <BadgeCheck size={19} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReviewError("");
                                        setReviewTarget({ ...doctor, action: "reject", note: "" });
                                    }}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"
                                    aria-label="Reject doctor"
                                >
                                    <XCircle size={19} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <div className="mt-6 flex flex-col gap-4 px-1 text-sm text-slate-600 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p>
                    Showing <span className="font-extrabold text-slate-900">{doctors.length}</span> of {meta.total} records
                </p>
                <Pagination page={meta.page || page} total={meta.total} limit={meta.limit || DEFAULT_ADMIN_PAGE_SIZE} onPageChange={setPage} />
            </div>

            {reviewTarget && (
                <ReviewModal
                    doctor={reviewTarget}
                    setDoctor={setReviewTarget}
                    saving={saving}
                    error={reviewError}
                    onClose={() => {
                        setReviewError("");
                        setReviewTarget(null);
                    }}
                    onSubmit={submitReview}
                    onPreviewFile={() => setFilePreviewTarget(reviewTarget)}
                />
            )}

            {filePreviewTarget && (
                <LicensePreviewModal
                    doctor={filePreviewTarget}
                    onClose={() => setFilePreviewTarget(null)}
                />
            )}
        </div>
    );
}

function ReviewModal({ doctor, setDoctor, saving, error, onClose, onSubmit, onPreviewFile }) {
    const isReject = doctor.action === "reject";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <form onSubmit={onSubmit} className="w-full max-w-[480px] rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="mb-6 flex items-start justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">
                            {isReject ? "Reject Doctor" : "Approve Doctor"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">{doctor.name}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500" aria-label="Close modal">
                        <X size={22} />
                    </button>
                </div>

                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                    <InfoLine icon={<Mail size={15} />} value={doctor.email || "-"} />
                    <InfoLine icon={<Building2 size={15} />} value={doctor.clinicName || "No clinic"} />
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <InfoLine icon={<FileText size={15} />} value={doctor.licenseNumber || getFileName(doctor.licenseFile) || "-"} />
                        <button
                            type="button"
                            onClick={onPreviewFile}
                            disabled={!doctor.licenseFile}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-extrabold text-blue-600 shadow-sm disabled:text-slate-400"
                        >
                            <Eye size={15} />
                            View File
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold leading-relaxed text-red-600">
                        {error}
                    </div>
                )}

                <label className="mt-5 block">
                    <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">
                        {isReject ? "Rejection Reason" : "Approval Note"}
                    </span>
                    <textarea
                        value={doctor.note}
                        onChange={(event) => setDoctor((current) => ({ ...current, note: event.target.value }))}
                        placeholder={isReject ? "Tuliskan alasan penolakan" : "Catatan approval"}
                        className="min-h-28 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                    />
                </label>

                <div className="mt-7 grid grid-cols-2 gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-xl bg-slate-100 font-extrabold text-slate-700 disabled:opacity-60">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className={`h-12 rounded-xl font-extrabold text-white shadow-lg disabled:opacity-60 ${isReject ? "bg-red-600 shadow-red-600/20" : "bg-blue-600 shadow-blue-600/20"}`}
                    >
                        {saving ? "Saving..." : isReject ? "Reject Doctor" : "Approve Doctor"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function LicenseCell({ doctor, onPreview }) {
    return (
        <div className="min-w-0 space-y-2">
            <InfoLine icon={<FileText size={15} />} value={doctor.licenseNumber || getFileName(doctor.licenseFile) || "-"} />
            <button
                type="button"
                onClick={onPreview}
                disabled={!doctor.licenseFile}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-50 px-3 text-xs font-extrabold text-blue-600 disabled:bg-slate-50 disabled:text-slate-400"
            >
                <Eye size={14} />
                View File
            </button>
        </div>
    );
}

function LicensePreviewModal({ doctor, onClose }) {
    const fileUrl = toAssetUrl(doctor.licenseFile);
    const fileName = getFileName(doctor.licenseFile) || "Attached file";
    const isPdf = /\.pdf(?:\?|#|$)/i.test(fileUrl);
    const isImage = /\.(png|jpe?g|webp|gif)(?:\?|#|$)/i.test(fileUrl);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-[6px]">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-900/20">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-500">Doctor File</p>
                        <h2 className="mt-1 truncate text-2xl font-extrabold text-slate-950">{doctor.name}</h2>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-500">{fileName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {fileUrl && (
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-extrabold text-white shadow-sm shadow-blue-600/20"
                            >
                                <ExternalLink size={15} />
                                Open
                            </a>
                        )}
                        <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500" aria-label="Close file preview">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-auto bg-slate-50 p-4">
                    {!fileUrl && (
                        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm font-semibold text-slate-500">
                            No file attached.
                        </div>
                    )}

                    {fileUrl && isPdf && (
                        <iframe
                            src={fileUrl}
                            title={`License file ${doctor.name}`}
                            className="h-[70vh] min-h-[420px] w-full rounded-2xl border border-slate-200 bg-white"
                        />
                    )}

                    {fileUrl && isImage && (
                        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-3">
                            <img
                                src={fileUrl}
                                alt={`License file ${doctor.name}`}
                                className="max-h-[70vh] w-full object-contain"
                            />
                        </div>
                    )}

                    {fileUrl && !isPdf && !isImage && (
                        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
                            <FileText size={42} className="text-slate-300" />
                            <p className="mt-4 text-base font-extrabold text-slate-900">Preview belum tersedia untuk tipe file ini.</p>
                            <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-slate-500">
                                Admin tetap bisa membuka berkas di tab baru untuk memeriksa dokumen doctor.
                            </p>
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm shadow-blue-600/20"
                            >
                                <ExternalLink size={16} />
                                Open File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Alert({ tone, text }) {
    const classes = tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600";
    return <div className={`mb-6 rounded-2xl px-5 py-4 text-sm font-semibold ${classes}`}>{text}</div>;
}

function InfoLine({ icon, value }) {
    return (
        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="shrink-0 text-slate-400">{icon}</span>
            <span className="truncate">{value}</span>
        </div>
    );
}

function EmptyRow({ text }) {
    return <div className="px-8 py-12 text-center text-sm font-semibold text-slate-500">{text}</div>;
}

function Pagination({ page, total, limit, onPageChange }) {
    const totalPages = Math.max(1, Math.ceil(Number(total || 0) / Number(limit || DEFAULT_ADMIN_PAGE_SIZE)));

    return (
        <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm disabled:opacity-40">
                <ChevronLeft size={19} />
            </button>
            <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-600 px-3 font-extrabold text-white shadow-lg shadow-blue-600/20">{page}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm disabled:opacity-40">
                <ChevronRight size={19} />
            </button>
        </div>
    );
}

function normalizeDoctor(doctor, clinicMap = {}) {
    return {
        key: doctor.doctorId || doctor.id || doctor.email,
        doctorId: doctor.doctorId || doctor.id,
        clinicId: doctor.clinicId || "",
        clinicName: doctor.clinicName || doctor.clinic?.name || clinicMap[doctor.clinicId] || "",
        name: doctor.fullName || doctor.name || "Doctor",
        email: doctor.email || "",
        specialization: doctor.specialization || "",
        licenseNumber: doctor.licenseNumber || "",
        licenseFile: doctor.licenseFile || "",
    };
}

function parseClinicList(response) {
    const source = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    return source.map((clinic) => ({
        clinicId: clinic.clinicId || clinic.id,
        name: clinic.name || "Clinic",
    })).filter((clinic) => clinic.clinicId);
}

function getApiErrorMessage(error) {
    const payload = error.response?.data;
    if (payload?.message) return payload.message;
    if (payload?.error) return payload.error;
    if (payload?.errors && typeof payload.errors === "object") {
        return Object.values(payload.errors).flat().filter(Boolean).join(" ");
    }
    return "";
}

function getFileName(path = "") {
    if (!path) return "";
    const cleanPath = path.split("?")[0].split("#")[0];
    return cleanPath.split("/").filter(Boolean).pop() || cleanPath;
}
