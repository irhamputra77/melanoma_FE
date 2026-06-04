import { useEffect, useMemo, useState } from "react";
import {
    Building2,
    ChevronLeft,
    ChevronRight,
    KeyRound,
    Mail,
    Pencil,
    Phone,
    RefreshCw,
    Search,
    Stethoscope,
    Trash2,
    Upload,
    UserRound,
    UserCheck,
    UserPlus,
    UsersRound,
    X,
} from "lucide-react";
import { getClinics } from "../../../services/clinicService";
import { getEmailValidationError, normalizeEmail } from "../../../utils/emailValidation";
import {
    DEFAULT_ADMIN_PAGE_SIZE,
    formatAdminDate,
    isStrictDeleteConfirmationEnabled,
} from "../../../utils/adminSettings";
import {
    approveAdminDoctor,
    createAdminUser,
    deleteAdminUser,
    getAdminDoctorVerificationRequests,
    getAdminDoctors,
    getAdminDoctorsSummary,
    rejectAdminDoctor,
    resetAdminUserPassword,
    updateAdminUser,
} from "../services/adminService";

export default function DoctorDetailsPage() {
    const [doctors, setDoctors] = useState([]);
    const [clinics, setClinics] = useState([]);
    const [summary, setSummary] = useState({ totalClinicians: 0, pendingApprovals: 0, patientThroughput: 0 });
    const [meta, setMeta] = useState({ page: 1, limit: DEFAULT_ADMIN_PAGE_SIZE, total: 0 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [clinicFilter, setClinicFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [modalError, setModalError] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [addDoctor, setAddDoctor] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [resetTarget, setResetTarget] = useState(null);
    const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });
    const [patientDoctor, setPatientDoctor] = useState(null);
    const [doctorPatients, setDoctorPatients] = useState([]);
    const [patientsLoading, setPatientsLoading] = useState(false);

    const fetchDoctors = async () => {
        setLoading(true);
        setError("");

        try {
            const [summaryResult, doctorsResult, clinicsResult] = await Promise.all([
                getAdminDoctorsSummary(),
                getAdminDoctors({
                    search: search.trim() || undefined,
                    status: statusFilter,
                    clinicId: clinicFilter === "all" ? undefined : clinicFilter,
                    page,
                }),
                getClinics({ page: 1, limit: 100, isActive: "all" }),
            ]);

            const clinicList = parseClinicList(clinicsResult);
            const nextClinicMap = Object.fromEntries(clinicList.map((clinic) => [clinic.clinicId, clinic.name]));
            const doctorList = (doctorsResult.data || []).map((doctor) => normalizeDoctor(doctor, nextClinicMap));

            setSummary(normalizeSummary(summaryResult));
            setClinics(clinicList);
            setDoctors(doctorList);
            setMeta(doctorsResult.meta || { page, limit: DEFAULT_ADMIN_PAGE_SIZE, total: doctorList.length });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch doctors.");
            setDoctors([]);
            setMeta({ page, limit: DEFAULT_ADMIN_PAGE_SIZE, total: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, [page, statusFilter, clinicFilter]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setPage(1);
            fetchDoctors();
        }, 350);

        return () => clearTimeout(timeout);
    }, [search]);

    const stats = useMemo(() => ({
        total: summary.totalClinicians || meta.total || doctors.length,
        pending: summary.pendingApprovals || 0,
        throughput: summary.patientThroughput || 0,
        visible: doctors.length,
    }), [summary, meta.total, doctors.length]);

    const handleSaveDoctor = async (event) => {
        event.preventDefault();
        if (!selectedDoctor?.userId) {
            setModalError("User ID doctor tidak tersedia.");
            return;
        }

        const validationError = validateDoctor(selectedDoctor);
        if (validationError) {
            setModalError(validationError);
            return;
        }

        const statusChangeError = validateDoctorStatusChange(selectedDoctor);
        if (statusChangeError) {
            setModalError(statusChangeError);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        setModalError("");

        try {
            await updateAdminUser(selectedDoctor.userId, {
                fullName: selectedDoctor.name,
                email: normalizeEmail(selectedDoctor.email),
                role: "doctor",
                gender: String(selectedDoctor.gender || "").toLowerCase(),
                phoneNumber: selectedDoctor.phone || undefined,
                birthDate: selectedDoctor.birthDate || undefined,
            });

            if (selectedDoctor.status !== selectedDoctor.originalStatus) {
                if (selectedDoctor.status === "verified") {
                    await approveAdminDoctor(selectedDoctor.doctorId, { note: "Updated from Doctor Management" });
                } else if (selectedDoctor.status === "rejected") {
                    await rejectAdminDoctor(selectedDoctor.doctorId, { reason: "Updated from Doctor Management" });
                }
            }

            setSelectedDoctor(null);
            await fetchDoctors();
            setSuccess("Doctor berhasil diperbarui.");
        } catch (err) {
            setModalError(getApiErrorMessage(err) || "Failed to update doctor.");
        } finally {
            setSaving(false);
        }
    };

    const openAddDoctorModal = () => {
        setSuccess("");
        setModalError("");
        setAddDoctor(createBlankDoctor(clinicFilter, clinics));
    };

    const closeAddDoctorModal = () => {
        setModalError("");
        setAddDoctor(null);
    };

    const handleCreateDoctor = async (event) => {
        event.preventDefault();
        if (!addDoctor) return;

        const validationError = validateDoctor(addDoctor, { requirePassword: true, requireDoctorFields: true });
        if (validationError) {
            setModalError(validationError);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        setModalError("");

        try {
            await createAdminUser(toDoctorCreatePayload(addDoctor));
            closeAddDoctorModal();
            setPage(1);
            await fetchDoctors();
            setSuccess("Doctor berhasil ditambahkan.");
        } catch (err) {
            setModalError(getApiErrorMessage(err) || "Failed to create doctor.");
        } finally {
            setSaving(false);
        }
    };

    const openPatientsModal = async (doctor) => {
        setPatientDoctor(doctor);
        setDoctorPatients([]);
        setPatientsLoading(true);
        setModalError("");

        try {
            const response = await getAdminDoctorVerificationRequests(doctor.doctorId);
            setDoctorPatients(normalizeDoctorPatients(response));
        } catch (err) {
            setModalError(getApiErrorMessage(err) || "Failed to fetch doctor patients.");
        } finally {
            setPatientsLoading(false);
        }
    };

    const handleDeleteDoctor = async () => {
        if (!deleteTarget?.userId) {
            setModalError("User ID doctor tidak tersedia.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        setModalError("");

        try {
            await deleteAdminUser(deleteTarget.userId);
            setDeleteTarget(null);
            setDeleteConfirmation("");
            await fetchDoctors();
            setSuccess(`${deleteTarget.name} berhasil dihapus permanen.`);
        } catch (err) {
            setModalError(getApiErrorMessage(err) || "Failed to delete doctor.");
        } finally {
            setSaving(false);
        }
    };

    const openResetModal = (doctor) => {
        setSuccess("");
        setModalError("");
        setResetForm({ password: "", confirmPassword: "" });
        setResetTarget(doctor);
    };

    const closeResetModal = () => {
        setResetTarget(null);
        setResetForm({ password: "", confirmPassword: "" });
        setModalError("");
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        if (!resetTarget?.userId) {
            setModalError("User ID doctor tidak tersedia.");
            return;
        }

        const validationError = validateResetPassword(resetForm);
        if (validationError) {
            setModalError(validationError);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        setModalError("");

        try {
            await resetAdminUserPassword(resetTarget.userId, resetForm.password);
            const resetName = resetTarget.name;
            closeResetModal();
            setSuccess(`Password ${resetName} berhasil direset.`);
        } catch (err) {
            setModalError(getApiErrorMessage(err) || "Failed to reset password.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl pb-10">
            <div className="mb-9 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="text-[40px] font-extrabold leading-tight text-slate-950">
                        Doctor Management
                    </h1>
                    <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
                        Review doctor profiles, clinic assignments, verification status, and patient load.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={openAddDoctorModal}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white shadow-sm shadow-slate-900/20"
                    >
                        <UserPlus size={16} />
                        Add Doctor
                    </button>
                    <button
                        type="button"
                        onClick={fetchDoctors}
                        disabled={loading}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm shadow-blue-600/20 disabled:bg-blue-300"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh Data
                    </button>
                </div>
            </div>

            <div className="mb-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Total Doctors" value={stats.total} icon={<Stethoscope size={18} />} tone="blue" />
                <MetricCard title="Visible Records" value={stats.visible} icon={<UsersRound size={18} />} tone="slate" />
                <MetricCard title="Pending Approval" value={stats.pending} icon={<UserCheck size={18} />} tone="amber" />
                <MetricCard title="Patient Throughput" value={stats.throughput} icon={<UsersRound size={18} />} tone="emerald" />
            </div>

            <div className="mb-6 grid gap-3 xl:grid-cols-[1fr_auto_auto] xl:items-center">
                <label className="relative block">
                    <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search doctors"
                        className="h-11 w-full rounded-xl bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
                    />
                </label>
                <select
                    value={clinicFilter}
                    onChange={(event) => {
                        setClinicFilter(event.target.value);
                        setPage(1);
                    }}
                    className="h-11 rounded-xl bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm outline-none"
                >
                    <option value="all">All clinics</option>
                    {clinics.map((clinic) => (
                        <option key={clinic.clinicId} value={clinic.clinicId}>{clinic.name}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(event) => {
                        setStatusFilter(event.target.value);
                        setPage(1);
                    }}
                    className="h-11 rounded-xl bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm outline-none"
                >
                    <option value="all">All statuses</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="unverified">Unverified</option>
                </select>
            </div>

            {error && (
                <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-6 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                    {success}
                </div>
            )}

            <section className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-sm">
                <div className="grid grid-cols-[1.05fr_1.05fr_0.9fr_0.65fr_0.6fr_0.6fr_0.85fr] bg-slate-50 px-8 py-5 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                    <span>Doctor</span>
                    <span>Contact</span>
                    <span>Clinic</span>
                    <span>Specialty</span>
                    <span>Status</span>
                    <span>Patient Load</span>
                    <span>Actions</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {loading && <EmptyRow text="Loading doctors..." />}
                    {!loading && doctors.length === 0 && <EmptyRow text="No doctors found." />}
                    {!loading && doctors.map((doctor) => (
                        <article key={doctor.key} className="grid min-h-[102px] grid-cols-[1.05fr_1.05fr_0.9fr_0.65fr_0.6fr_0.6fr_0.85fr] items-center px-8 text-sm text-slate-700">
                            <div className="flex items-center gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                    <Stethoscope size={20} />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-base font-extrabold text-slate-950">{doctor.name}</p>
                                    <p className="truncate text-xs font-semibold text-slate-400">{formatDate(doctor.birthDate || doctor.joinedAt)}</p>
                                </div>
                            </div>
                            <div className="min-w-0 space-y-2 text-xs font-semibold text-slate-500">
                                <InfoLine icon={<Mail size={14} />} value={doctor.email || "-"} />
                                <InfoLine icon={<Phone size={14} />} value={doctor.phone || "-"} />
                            </div>
                            <InfoLine icon={<Building2 size={15} />} value={doctor.clinicName || "No clinic"} />
                            <span className="font-semibold text-slate-600">{doctor.specialization || "-"}</span>
                            <StatusBadge status={doctor.status} />
                            <span className="font-extrabold text-emerald-700">{doctor.patientLoad}</span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => openPatientsModal(doctor)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
                                    aria-label="View doctor patients"
                                >
                                    <UsersRound size={17} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openResetModal(doctor)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
                                    aria-label="Reset doctor password"
                                >
                                    <KeyRound size={17} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSuccess("");
                                        setModalError("");
                                        setSelectedDoctor({ ...doctor, originalStatus: doctor.status });
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                                    aria-label="Edit doctor"
                                >
                                    <Pencil size={17} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSuccess("");
                                        setModalError("");
                                        setDeleteTarget(doctor);
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600"
                                    aria-label="Delete doctor"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <div className="mt-8 flex items-center justify-between px-6 text-sm text-slate-600">
                <p>
                    Showing <span className="font-extrabold text-slate-900">{doctors.length}</span> of {meta.total} records
                </p>
                <Pagination page={meta.page || page} total={meta.total} limit={meta.limit || DEFAULT_ADMIN_PAGE_SIZE} onPageChange={setPage} />
            </div>

            {selectedDoctor && (
                <DoctorEditModal
                    mode="edit"
                    doctor={selectedDoctor}
                    setDoctor={setSelectedDoctor}
                    clinics={clinics}
                    saving={saving}
                    error={modalError}
                    onClose={() => {
                        setModalError("");
                        setSelectedDoctor(null);
                    }}
                    onSubmit={handleSaveDoctor}
                />
            )}

            {addDoctor && (
                <DoctorEditModal
                    mode="create"
                    doctor={addDoctor}
                    setDoctor={setAddDoctor}
                    clinics={clinics}
                    saving={saving}
                    error={modalError}
                    onClose={closeAddDoctorModal}
                    onSubmit={handleCreateDoctor}
                />
            )}

            {deleteTarget && (
                <DeleteModal
                    doctor={deleteTarget}
                    confirmation={deleteConfirmation}
                    setConfirmation={setDeleteConfirmation}
                    strictConfirmation={isStrictDeleteConfirmationEnabled()}
                    saving={saving}
                    error={modalError}
                    onClose={() => {
                        setModalError("");
                        setDeleteTarget(null);
                        setDeleteConfirmation("");
                    }}
                    onConfirm={handleDeleteDoctor}
                />
            )}

            {patientDoctor && (
                <DoctorPatientsModal
                    doctor={patientDoctor}
                    patients={doctorPatients}
                    loading={patientsLoading}
                    error={modalError}
                    onClose={() => {
                        setModalError("");
                        setPatientDoctor(null);
                    }}
                />
            )}

            {resetTarget && (
                <ResetPasswordModal
                    doctor={resetTarget}
                    form={resetForm}
                    setForm={setResetForm}
                    saving={saving}
                    error={modalError}
                    onClose={closeResetModal}
                    onSubmit={handleResetPassword}
                />
            )}
        </div>
    );
}

function DoctorEditModal({ mode = "edit", doctor, setDoctor, clinics = [], saving, error, onClose, onSubmit }) {
    const isCreate = mode === "create";
    const updateField = (field, value) => {
        setDoctor((current) => ({ ...current, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <form noValidate onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="mb-6 flex items-start justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">{isCreate ? "Add Doctor" : "Edit Doctor"}</h2>
                        <p className="mt-1 text-sm text-slate-500">{isCreate ? "Create a doctor account and verification profile." : "Update doctor account details."}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500" aria-label="Close edit modal">
                        <X size={22} />
                    </button>
                </div>

                {error && <ModalError text={error} />}

                <div className="space-y-4">
                    <ModalField label="Full Name" value={doctor.name} onChange={(value) => updateField("name", value)} />
                    <ModalField label="Email" value={doctor.email} type="email" maxLength={254} onChange={(value) => updateField("email", value)} />
                    <ModalField label="Phone" value={doctor.phone} onChange={(value) => updateField("phone", value)} />
                    <div className="grid grid-cols-2 gap-4">
                        <ModalSelect label="Gender" value={doctor.gender || ""} options={["", "male", "female"]} onChange={(value) => updateField("gender", value)} />
                        {!isCreate && <ModalSelect label="Doctor Status" value={doctor.status || "pending"} options={doctorStatusOptions(doctor.status)} onChange={(value) => updateField("status", value)} />}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <ModalField label="Birth Date" value={toDateInputValue(doctor.birthDate)} type="date" onChange={(value) => updateField("birthDate", value)} />
                        {isCreate && <ModalField label="Password" value={doctor.password} type="password" onChange={(value) => updateField("password", value)} />}
                    </div>
                    {isCreate && (
                        <>
                            <ModalSelect
                                label="Clinic"
                                value={doctor.clinicId || ""}
                                options={["", ...clinics.map((clinic) => clinic.clinicId)]}
                                getOptionLabel={(value) => value ? clinics.find((clinic) => clinic.clinicId === value)?.name || value : "Select clinic"}
                                onChange={(value) => updateField("clinicId", value)}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <ModalField label="Specialization" value={doctor.specialization} onChange={(value) => updateField("specialization", value)} />
                                <ModalField label="License Number" value={doctor.licenseNumber} onChange={(value) => updateField("licenseNumber", value)} />
                            </div>
                            <ModalFileField
                                label="Medical License"
                                file={doctor.medicalLicense}
                                accept="application/pdf,.pdf"
                                onChange={(file) => updateField("medicalLicense", file)}
                            />
                        </>
                    )}
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-xl bg-slate-100 font-extrabold text-slate-700 disabled:opacity-60">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="h-12 rounded-xl bg-blue-600 font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:bg-blue-300">
                        {saving ? "Saving..." : isCreate ? "Create Doctor" : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function DoctorPatientsModal({ doctor, patients, loading, error, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <div className="w-full max-w-[620px] rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="mb-6 flex items-start justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">Doctor Patients</h2>
                        <p className="mt-1 text-sm text-slate-500">{doctor.name}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500" aria-label="Close patients modal">
                        <X size={22} />
                    </button>
                </div>

                {error && <ModalError text={error} />}

                <div className="overflow-hidden rounded-[24px] border border-slate-200">
                    <div className="grid grid-cols-[1.1fr_1.2fr_0.75fr_0.9fr] bg-slate-50 px-5 py-4 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                        <span>Patient</span>
                        <span>Email</span>
                        <span>Cases</span>
                        <span>Latest AI</span>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                        {loading && <EmptyRow text="Loading patients..." />}
                        {!loading && patients.length === 0 && <EmptyRow text="No patients found for this doctor." />}
                        {!loading && patients.map((patient) => (
                            <article key={patient.key} className="grid min-h-[82px] grid-cols-[1.1fr_1.2fr_0.75fr_0.9fr] items-center px-5 text-sm text-slate-700">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                        <UserRound size={18} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate font-extrabold text-slate-950">{patient.name}</p>
                                        <p className="truncate text-xs font-semibold text-slate-400">{formatDate(patient.latestDate)}</p>
                                    </div>
                                </div>
                                <span className="truncate text-xs font-semibold text-slate-500">{patient.email || "-"}</span>
                                <span className="font-extrabold text-slate-950">{patient.caseCount}</span>
                                <span className="truncate text-xs font-extrabold text-emerald-700">{patient.latestDiagnosis || "-"}</span>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeleteModal({ doctor, confirmation, setConfirmation, strictConfirmation, saving, error, onClose, onConfirm }) {
    const requiredText = `DELETE ${doctor.name}`;
    const canDelete = !strictConfirmation || confirmation === requiredText;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <div className="w-full max-w-[420px] rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="mb-6 flex items-start justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">Hapus {doctor.name}?</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            Aksi ini akan menghapus akun doctor secara permanen beserta relasi konsultasi yang ditangani backend. Lakukan hanya jika benar-benar diperlukan.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500" aria-label="Close delete modal">
                        <X size={22} />
                    </button>
                </div>

                {error && <ModalError text={error} />}

                {strictConfirmation && (
                    <label className="mb-5 block">
                        <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">
                            Ketik "{requiredText}"
                        </span>
                        <input
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            className="h-12 w-full rounded-xl bg-red-50 px-4 text-sm font-extrabold text-red-700 outline-none ring-1 ring-red-100 placeholder:text-red-300"
                            placeholder={requiredText}
                        />
                    </label>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-xl bg-slate-100 font-extrabold text-slate-700 disabled:opacity-60">
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm} disabled={saving || !canDelete} className="h-12 rounded-xl bg-red-600 font-extrabold text-white shadow-lg shadow-red-600/20 disabled:bg-red-300">
                        {saving ? "Deleting..." : "Delete Permanently"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ResetPasswordModal({ doctor, form, setForm, saving, error, onClose, onSubmit }) {
    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <form noValidate onSubmit={onSubmit} className="w-full max-w-[440px] rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="mb-6 flex items-start justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">Reset Password</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            Buat password baru untuk <span className="font-bold text-slate-700">{doctor.name}</span>.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500" aria-label="Close reset password modal">
                        <X size={22} />
                    </button>
                </div>

                {error && <ModalError text={error} />}

                <div className="space-y-4">
                    <ModalField label="New Password" value={form.password} type="password" onChange={(value) => updateField("password", value)} />
                    <ModalField label="Confirm Password" value={form.confirmPassword} type="password" onChange={(value) => updateField("confirmPassword", value)} />
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-xl bg-slate-100 font-extrabold text-slate-700 disabled:opacity-60">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="h-12 rounded-xl bg-amber-600 font-extrabold text-white shadow-lg shadow-amber-600/20 disabled:bg-amber-300">
                        {saving ? "Resetting..." : "Reset Password"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function MetricCard({ title, value, icon, tone }) {
    const toneClass = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-700",
        slate: "bg-slate-100 text-slate-700",
    }[tone];

    return (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>{icon}</span>
            </div>
            <p className="text-[34px] font-extrabold leading-none text-slate-950">{Number(value || 0).toLocaleString("en-US")}</p>
        </section>
    );
}

function StatusBadge({ status }) {
    const normalized = String(status || "").toLowerCase();
    const isVerified = normalized === "verified";
    const isPending = normalized === "pending";

    return (
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${isVerified ? "bg-emerald-50 text-emerald-700" : isPending ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
            <span className={`h-2 w-2 rounded-full ${isVerified ? "bg-emerald-600" : isPending ? "bg-amber-600" : "bg-slate-400"}`} />
            {titleCase(status) || "-"}
        </span>
    );
}

function InfoLine({ icon, value }) {
    return (
        <div className="flex min-w-0 items-center gap-2">
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

function normalizeSummary(data) {
    return {
        totalClinicians: data?.totalClinicians ?? data?.totalDoctors ?? data?.doctors ?? 0,
        pendingApprovals: data?.pendingApprovals ?? data?.pending ?? 0,
        patientThroughput: data?.patientThroughput ?? data?.throughput ?? 0,
    };
}

function normalizeDoctor(doctor, clinicMap = {}) {
    return {
        key: doctor.doctorId || doctor.id || doctor.email,
        doctorId: doctor.doctorId || doctor.id || "",
        userId: doctor.userId || "",
        clinicId: doctor.clinicId || "",
        clinicName: doctor.clinicName || doctor.clinic?.name || clinicMap[doctor.clinicId] || "",
        name: doctor.fullName || doctor.name || "Doctor",
        email: doctor.email || "",
        phone: doctor.phoneNumber || doctor.phone || "",
        gender: doctor.gender || "",
        birthDate: doctor.birthDate || "",
        joinedAt: doctor.joinedAt || doctor.registrationDate || "",
        status: doctor.status || doctor.verificationStatus || "",
        specialization: doctor.specialization || "",
        patientLoad: doctor.patientLoad ?? doctor.assignedPatients ?? 0,
    };
}

function createBlankDoctor(clinicFilter, clinics = []) {
    const selectedClinic = clinicFilter && clinicFilter !== "all"
        ? clinicFilter
        : clinics[0]?.clinicId || "";

    return {
        key: "",
        doctorId: "",
        userId: "",
        clinicId: selectedClinic,
        clinicName: "",
        name: "",
        email: "",
        phone: "",
        gender: "",
        birthDate: "",
        joinedAt: "",
        status: "pending",
        specialization: "",
        patientLoad: 0,
        password: "",
        licenseNumber: "",
        medicalLicense: null,
    };
}

function toDoctorCreatePayload(doctor) {
    const payload = new FormData();
    payload.append("fullName", doctor.name);
    payload.append("email", normalizeEmail(doctor.email));
    payload.append("role", "doctor");
    payload.append("gender", String(doctor.gender || "").toLowerCase());
    payload.append("password", doctor.password);
    payload.append("clinicId", doctor.clinicId);
    payload.append("specialization", doctor.specialization);
    payload.append("licenseNumber", doctor.licenseNumber);

    if (doctor.phone) payload.append("phoneNumber", doctor.phone);
    if (doctor.birthDate) payload.append("birthDate", doctor.birthDate);
    if (doctor.medicalLicense) payload.append("medicalLicense", doctor.medicalLicense);

    return payload;
}

function normalizeDoctorPatients(response) {
    const source = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    const patients = new Map();

    source.forEach((item, index) => {
        const key = item.patientId || item.patientEmail || item.patientName || `patient-${index}`;
        const existing = patients.get(key);
        const next = {
            key,
            name: item.patientName || item.patient?.name || "Patient",
            email: item.patientEmail || item.patient?.email || "",
            caseCount: (existing?.caseCount || 0) + 1,
            latestDate: existing?.latestDate || item.date || item.createdAt || item.receivedAt,
            latestDiagnosis: existing?.latestDiagnosis || formatDiagnosis(item.aiDiagnosis || item.diagnosis || item.aiPrediction, item.aiConfidence),
        };

        patients.set(key, next);
    });

    return Array.from(patients.values());
}

function parseClinicList(response) {
    const source = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
    return source.map((clinic) => ({
        clinicId: clinic.clinicId || clinic.id,
        name: clinic.name || "Clinic",
    })).filter((clinic) => clinic.clinicId);
}

function formatDate(value) {
    return formatAdminDate(value);
}

function titleCase(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function validateDoctor(doctor, options = {}) {
    if (!doctor.name?.trim()) return "Full name wajib diisi.";
    const emailError = getEmailValidationError(doctor.email);
    if (emailError) return emailError;
    if (doctor.gender && !["male", "female"].includes(String(doctor.gender).toLowerCase())) return "Gender harus male atau female.";
    if (options.requirePassword && String(doctor.password || "").length < 6) return "Password minimal 6 karakter.";
    if (options.requireDoctorFields) {
        if (!doctor.clinicId) return "Clinic wajib dipilih.";
        if (!doctor.specialization?.trim()) return "Specialization wajib diisi.";
        if (!doctor.licenseNumber?.trim()) return "License number wajib diisi.";
        const fileError = validateMedicalLicenseFile(doctor.medicalLicense);
        if (fileError) return fileError;
    }
    return "";
}

function validateResetPassword(form) {
    if (String(form.password || "").length < 6) return "Password baru minimal 6 karakter.";
    if (form.password !== form.confirmPassword) return "Konfirmasi password tidak sama.";
    return "";
}

function validateDoctorStatusChange(doctor) {
    if (doctor.status === doctor.originalStatus) return "";
    if (["verified", "rejected"].includes(doctor.status)) return "";
    return "Status doctor hanya bisa diubah ke Verified atau Rejected dari halaman ini. Untuk mengubah ke Pending/Unverified perlu endpoint backend khusus.";
}

function doctorStatusOptions(currentStatus) {
    const current = String(currentStatus || "pending").toLowerCase();
    return Array.from(new Set([current, "verified", "rejected"]));
}

function formatDiagnosis(diagnosis, confidence) {
    if (!diagnosis) return "";
    if (typeof confidence !== "number") return diagnosis;
    const score = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence);
    return `${score}% ${diagnosis}`;
}

function validateMedicalLicenseFile(file) {
    if (!file) return "";
    if (file.type !== "application/pdf") return "Medical license harus berupa file PDF.";
    if (file.size > 5 * 1024 * 1024) return "Ukuran medical license maksimal 5MB.";
    return "";
}

function ModalField({ label, value, onChange, type = "text", maxLength }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">{label}</span>
            <input
                type={type}
                maxLength={maxLength}
                value={value || ""}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 w-full rounded-xl bg-slate-100 px-4 text-slate-900 outline-none placeholder:text-slate-400"
            />
        </label>
    );
}

function ModalSelect({ label, value, options, onChange, getOptionLabel }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">{label}</span>
            <select
                value={value || ""}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 w-full rounded-xl bg-slate-100 px-4 text-slate-900 outline-none"
            >
                {options.map((option) => (
                    <option key={option || "none"} value={option}>
                        {getOptionLabel ? getOptionLabel(option) : option ? titleCase(option) : "Not set"}
                    </option>
                ))}
            </select>
        </label>
    );
}

function ModalFileField({ label, file, accept, onChange }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">{label}</span>
            <span className="flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700">
                <Upload size={17} className="text-blue-600" />
                <span className="truncate">{file?.name || "Upload PDF file"}</span>
            </span>
            <input
                type="file"
                accept={accept}
                onChange={(event) => onChange(event.target.files?.[0] || null)}
                className="hidden"
            />
        </label>
    );
}

function ModalError({ text }) {
    return <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{text}</div>;
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

function toDateInputValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toISOString().slice(0, 10);
}
