import { useEffect, useMemo, useState } from "react";
import {
    BadgeCheck,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Pencil,
    ShieldCheck,
    Trash2,
    UserPlus,
    X,
} from "lucide-react";
import profileDoctor from "../../../assets/login_doctor_profile.png";
import { toAssetUrl } from "../../../utils/assets";
import {
    createAdminUser,
    deleteAdminUser,
    getAdminDoctors,
    getAdminUsers,
    approveAdminDoctor,
    rejectAdminDoctor,
    updateAdminUser,
} from "../services/adminService";

const blankUser = {
    name: "",
    role: "Doctor",
    gender: "Female",
    email: "",
    phone: "",
    birthDate: "",
    password: "",
    specialization: "",
    licenseNumber: "",
    medicalLicense: null,
};

export default function UserManagementPage() {
    const [activeFilter, setActiveFilter] = useState("All Roles");
    const [modalMode, setModalMode] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [verificationUser, setVerificationUser] = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ page: 1, limit: 8, total: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
    const [modalError, setModalError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError("");

        Promise.all([fetchUsers(activeFilter, page), fetchDoctorProfiles()])
            .then(([response, doctorProfiles]) => {
                if (!isMounted) return;

                const { data, meta: responseMeta } = parseUsersResponse(response);
                setUsers(data.map((user) => normalizeUser(user, doctorProfiles)));
                setMeta(responseMeta || { page, limit: 8, total: data.length });
            })
            .catch((error) => {
                if (isMounted) {
                    setError(error.response?.data?.message || "Failed to fetch users.");
                    setUsers([]);
                    setMeta({ page, limit: 8, total: 0 });
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
    }, [activeFilter, page]);

    const filteredUsers = useMemo(() => {
        return users;
    }, [users]);

    const openAddModal = () => {
        setSuccess("");
        setModalError("");
        setSelectedUser(blankUser);
        setModalMode("add");
    };

    const openEditModal = (user) => {
        setSuccess("");
        setModalError("");
        setSelectedUser({ ...user, password: "" });
        setModalMode("edit");
    };

    const closeModal = () => {
        setSelectedUser(null);
        setModalMode("");
        setModalError("");
    };

    const handleSaveUser = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setModalError("");
        setSuccess("");

        try {
            const isAdd = modalMode === "add";
            const validationError = validateUserForm(selectedUser, isAdd);

            if (validationError) {
                setModalError(validationError);
                return;
            }

            if (modalMode === "add") {
                await createAdminUser(toUserPayload(selectedUser, true));
            } else {
                await updateAdminUser(selectedUser.id, toUserPayload(selectedUser, false));
            }

            closeModal();
            const nextPage = isAdd ? 1 : page;
            if (isAdd) {
                setPage(1);
            }
            const [response, doctorProfiles] = await Promise.all([
                fetchUsers(activeFilter, nextPage),
                fetchDoctorProfiles(),
            ]);
            const { data, meta: responseMeta } = parseUsersResponse(response);
            setUsers(data.map((user) => normalizeUser(user, doctorProfiles)));
            setMeta(responseMeta || { page: nextPage, limit: 8, total: data.length });
            setSuccess(isAdd ? "User berhasil ditambahkan." : "User berhasil diperbarui.");
        } catch (error) {
            setModalError(getApiErrorMessage(error) || "Failed to save user.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteUser?.id) return;
        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await deleteAdminUser(deleteUser.id);

            const shouldMoveBack = users.length === 1 && page > 1;
            const nextPage = shouldMoveBack ? page - 1 : page;
            if (shouldMoveBack) {
                setPage(nextPage);
            }

            const [response, doctorProfiles] = await Promise.all([
                fetchUsers(activeFilter, nextPage),
                fetchDoctorProfiles(),
            ]);
            const { data, meta: responseMeta } = parseUsersResponse(response);
            setUsers(data.map((user) => normalizeUser(user, doctorProfiles)));
            setMeta(responseMeta || { page: nextPage, limit: 8, total: data.length });
            setDeleteUser(null);
            setSuccess("User deleted successfully.");
        } catch (error) {
            setModalError(getDeleteErrorMessage(error));
        } finally {
            setDeleting(false);
        }
    };

    const handleVerificationAction = async (action) => {
        if (!verificationUser?.doctorId) {
            setModalError("Doctor profile belum tersedia untuk user ini.");
            return;
        }

        setSaving(action);
        setModalError("");

        try {
            if (action === "approve") {
                await approveAdminDoctor(verificationUser.doctorId, { note: "Approved from user management" });
            } else {
                await rejectAdminDoctor(verificationUser.doctorId, { reason: "Rejected from user management" });
            }

            const [response, doctorProfiles] = await Promise.all([
                fetchUsers(activeFilter, page),
                fetchDoctorProfiles(),
            ]);
            const { data, meta: responseMeta } = parseUsersResponse(response);
            setUsers(data.map((user) => normalizeUser(user, doctorProfiles)));
            setMeta(responseMeta || { page, limit: 8, total: data.length });
            setVerificationUser(null);
            setSuccess(action === "approve" ? "Doctor berhasil disetujui." : "Doctor berhasil ditolak.");
        } catch (error) {
            setModalError(getApiErrorMessage(error) || `Failed to ${action} doctor.`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-6xl">
            <div className="mb-12 flex items-start justify-between gap-6">
                <div>
                    <h1 className="text-[40px] font-extrabold leading-tight text-slate-950">
                        User Management
                    </h1>
                    <p className="mt-2 max-w-2xl text-lg leading-relaxed text-slate-600">
                        Authorize medical practitioners, manage access levels, and audit system
                        activity across the MySkin diagnostic network.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddModal}
                    className="mt-12 inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-7 text-base font-extrabold text-white shadow-lg shadow-blue-600/20"
                >
                    <UserPlus size={19} />
                    Add User
                </button>
            </div>

            <div className="mb-6 flex gap-2">
                {["All Roles", "Doctors", "Patients"].map((filter) => (
                    <button
                        key={filter}
                        type="button"
                        onClick={() => {
                            setActiveFilter(filter);
                            setPage(1);
                        }}
                        className={`h-9 min-w-36 rounded-full px-6 text-sm font-extrabold ${activeFilter === filter
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600"
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {error && !modalMode && !verificationUser && !deleteUser && (
                <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-6 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                    {success}
                </div>
            )}

            <div className="overflow-hidden rounded-[32px] border-4 border-slate-200/60 bg-white">
                <div className="grid grid-cols-[1.2fr_0.75fr_1.35fr_0.85fr_0.8fr] bg-slate-50 px-10 py-6 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                    <span>Name</span>
                    <span>Role</span>
                    <span>Email</span>
                    <span>Status</span>
                    <span>Actions</span>
                </div>

                <div className="divide-y divide-transparent">
                    {loading && (
                        <div className="px-10 py-10 text-center text-sm font-semibold text-slate-500">
                            Loading users...
                        </div>
                    )}

                    {!loading && filteredUsers.length === 0 && (
                        <div className="px-10 py-10 text-center text-sm font-semibold text-slate-500">
                            No users found.
                        </div>
                    )}

                    {!loading && filteredUsers.map((user) => (
                        <div
                            key={user.id || user.email}
                            className="grid min-h-[104px] grid-cols-[1.2fr_0.75fr_1.35fr_0.85fr_0.8fr] items-center px-10 text-slate-700"
                        >
                            <UserIdentity user={user} />
                            <RolePill role={user.role} />
                            <span className="text-sm">{user.email}</span>
                            <StatusBadge status={user.status} />
                            <div className="flex items-center gap-5">
                                {user.role === "Doctor" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModalError("");
                                            setVerificationUser(user);
                                        }}
                                        className="text-blue-400"
                                        aria-label="Verify doctor"
                                    >
                                        <ShieldCheck size={21} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => openEditModal(user)}
                                    className="text-slate-500"
                                    aria-label="Edit user"
                                >
                                    <Pencil size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSuccess("");
                                        setModalError("");
                                        setDeleteUser(user);
                                    }}
                                    className="text-red-300"
                                    aria-label="Delete user"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 flex items-center justify-between px-6 text-sm text-slate-600">
                <p>
                    Showing <span className="font-extrabold text-slate-900">{filteredUsers.length}</span> of {meta.total} users
                </p>
                <Pagination page={meta.page || page} total={meta.total} limit={meta.limit || 8} onPageChange={setPage} />
            </div>

            {modalMode && selectedUser && (
                <UserModal
                    mode={modalMode}
                    user={selectedUser}
                    setUser={setSelectedUser}
                    onClose={closeModal}
                    onSubmit={handleSaveUser}
                    saving={saving}
                    error={modalError}
                />
            )}

            {deleteUser && (
                <DeleteUserModal
                    user={deleteUser}
                    deleting={deleting}
                    error={modalError}
                    onCancel={() => {
                        setModalError("");
                        setDeleteUser(null);
                    }}
                    onConfirm={handleDeleteUser}
                />
            )}

            {verificationUser && (
                <DoctorRegistrationModal
                    user={verificationUser}
                    saving={saving}
                    error={modalError}
                    onApprove={() => handleVerificationAction("approve")}
                    onReject={() => handleVerificationAction("reject")}
                    onClose={() => {
                        setModalError("");
                        setVerificationUser(null);
                    }}
                />
            )}
        </div>
    );
}

function UserIdentity({ user }) {
    return (
        <div className="flex items-center gap-4">
            {user.avatar ? (
                <img src={toAssetUrl(user.avatar)} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-base font-extrabold text-blue-600">
                    SD
                </div>
            )}
            <div>
                <p className="text-lg font-extrabold text-slate-900">{user.name}</p>
                <p className="text-sm text-slate-400">ID: #{user.displayId || user.id}</p>
            </div>
        </div>
    );
}

function RolePill({ role }) {
    return (
        <span className="inline-flex h-8 w-28 items-center justify-center rounded-full bg-blue-50 text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
            {role}
        </span>
    );
}

function StatusBadge({ status }) {
    const isActive = status === "Active";

    return (
        <span className={`inline-flex items-center gap-2 text-sm font-extrabold ${isActive ? "text-emerald-700" : "text-red-600"}`}>
            <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-600" : "bg-red-600"}`} />
            {status}
        </span>
    );
}

function Pagination({ page, total, limit, onPageChange }) {
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return (
        <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm disabled:opacity-40">
                <ChevronLeft size={19} />
            </button>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-white shadow-lg shadow-blue-600/20">
                {page}
            </button>
            <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm disabled:opacity-40">
                <ChevronRight size={19} />
            </button>
        </div>
    );
}

function UserModal({ mode, user, setUser, onClose, onSubmit, saving = false, error = "" }) {
    const isEdit = mode === "edit";

    const updateField = (field, value) => {
        setUser((current) => ({ ...current, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <form
                onSubmit={onSubmit}
                className="w-full max-w-[520px] rounded-[32px] bg-white p-8 shadow-2xl shadow-slate-900/20"
            >
                <div className="mb-7 flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">
                            {isEdit ? "Edit User" : "Add New User"}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {isEdit ? "Edit a professional in the clinic portal" : "Register a new professional to the clinic portal"}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    {error && (
                        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                            {error}
                        </div>
                    )}

                    <ModalField
                        label="Full Name"
                        value={user.name}
                        placeholder="e.g. Dr. Helena Troy"
                        onChange={(value) => updateField("name", value)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <ModalSelect
                            label="Role"
                            value={user.role}
                            options={["Admin", "Doctor", "Patient"]}
                            onChange={(value) => updateField("role", value)}
                        />
                        <ModalSelect
                            label="Gender"
                            value={user.gender}
                            options={["Female", "Male"]}
                            onChange={(value) => updateField("gender", value)}
                        />
                    </div>

                    <ModalField
                        label="Email Address"
                        value={user.email}
                        placeholder="h.troy@clinical-atelier.com"
                        onChange={(value) => updateField("email", value)}
                    />
                    <ModalField
                        label="Phone Number"
                        value={user.phone}
                        placeholder="+628134567890"
                        onChange={(value) => updateField("phone", value)}
                    />
                    <ModalField
                        label="Birth Date"
                        value={user.birthDate}
                        placeholder="April 23, 1996"
                        onChange={(value) => updateField("birthDate", value)}
                    />
                    {!isEdit && user.role === "Doctor" && (
                        <div className="grid grid-cols-2 gap-4">
                            <ModalField
                                label="Specialization"
                                value={user.specialization}
                                placeholder="Dermatology"
                                onChange={(value) => updateField("specialization", value)}
                            />
                            <ModalField
                                label="License Number"
                                value={user.licenseNumber}
                                placeholder="DRS-2023-001"
                                onChange={(value) => updateField("licenseNumber", value)}
                            />
                            <div className="col-span-2">
                                <ModalFileField
                                    label="Medical License"
                                    file={user.medicalLicense}
                                    accept="application/pdf,.pdf"
                                    placeholder="Upload PDF file"
                                    onChange={(file) => updateField("medicalLicense", file)}
                                />
                            </div>
                        </div>
                    )}
                    {isEdit && user.role === "Doctor" && (
                        <ModalSelect
                            label="Status"
                            value={user.status}
                            options={["Active", "Pending", "Inactive"]}
                            onChange={(value) => updateField("status", value)}
                        />
                    )}
                    {!isEdit && (
                        <ModalField
                            label="Password"
                            value={user.password}
                            placeholder="password123"
                            type="password"
                            onChange={(value) => updateField("password", value)}
                        />
                    )}
                </div>

                <div className="mt-8 grid grid-cols-[0.75fr_1.25fr] gap-4">
                    <button type="button" onClick={onClose} className="h-14 rounded-xl bg-slate-200 text-base font-extrabold text-slate-900">
                        Cancel
                    </button>
                    <button type="submit" disabled={Boolean(saving)} className="h-14 rounded-xl bg-blue-600 text-base font-extrabold text-white shadow-lg shadow-blue-600/25 disabled:bg-blue-300">
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create Account"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function DeleteUserModal({ user, deleting, error = "", onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <div className="w-full max-w-[420px] rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">Hapus user?</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            Data <span className="font-bold text-slate-700">{user.name || user.email}</span> akan dihapus permanen dari sistem. Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>
                    <button type="button" onClick={onCancel} className="text-slate-500" aria-label="Close">
                        <X size={22} />
                    </button>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={deleting}
                        className="h-12 rounded-xl bg-slate-100 font-extrabold text-slate-700 disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        className="h-12 rounded-xl bg-red-600 font-extrabold text-white shadow-lg shadow-red-600/20 disabled:bg-red-300"
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
                {error && (
                    <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

function DoctorRegistrationModal({ user, saving, error = "", onApprove, onReject, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <div className="w-full max-w-[430px] overflow-hidden rounded-xl bg-white shadow-2xl shadow-slate-900/20">
                <div className="flex h-12 items-center justify-between bg-blue-600 px-5 text-white">
                    <h2 className="text-sm font-extrabold">New Doctor Registration</h2>
                    <button type="button" onClick={onClose} className="text-white" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5">
                    {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
                    <div className="mb-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-extrabold text-white">
                            {initials(user.name)}
                        </div>
                        <div>
                            <p className="font-extrabold text-slate-950">{user.name || "Doctor"}</p>
                            <p className="text-xs font-semibold text-slate-500">ID: {user.displayId || user.id || "-"}</p>
                            <span className="mt-1 inline-flex rounded-full bg-blue-100 px-3 py-1 text-[10px] font-extrabold text-blue-600">
                                {user.specialization || "-"}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InfoBox label="Email" value={user.email || "-"} />
                        <InfoBox label="Phone" value={user.phone || "-"} />
                        <InfoBox label="Birth Date" value={formatReadableDate(user.birthDate)} />
                        <InfoBox label="Gender" value={user.gender || "-"} />
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                                <CalendarDays size={16} />
                            </span>
                            <div>
                                <p className="text-sm font-extrabold text-slate-950">{user.licenseNumber || "-"}</p>
                                <p className="text-xs text-slate-500">{user.licenseFile || "-"}</p>
                            </div>
                        </div>
                        <button type="button" disabled={!user.licenseFile} className="rounded-md bg-white px-3 py-2 text-xs font-extrabold text-blue-600 disabled:text-slate-400">
                            View
                        </button>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <button type="button" onClick={onReject} disabled={Boolean(saving) || !user.doctorId} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-extrabold text-red-600 disabled:opacity-60">
                            <X size={15} />
                            {saving === "reject" ? "Rejecting..." : "Reject"}
                        </button>
                        <button type="button" onClick={onApprove} disabled={Boolean(saving) || !user.doctorId} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:bg-blue-300">
                            <BadgeCheck size={15} />
                            {saving === "approve" ? "Approving..." : "Approve"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoBox({ label, value }) {
    return (
        <div className="rounded-lg bg-slate-100 px-4 py-3">
            <p className="mb-1 text-[10px] font-bold text-slate-500">{label}</p>
            <p className="truncate text-xs font-semibold text-slate-950">{value}</p>
        </div>
    );
}

function normalizeUser(user, doctorProfiles = {}) {
    const doctorProfile = doctorProfiles[user.userId || user.id] || {};
    return {
        id: user.userId || user.id || "",
        doctorId: doctorProfile.doctorId || "",
        displayId: user.clinicId || user.medicalId || user.displayId || user.id || "",
        name: user.fullName || user.name || user.full_name || "",
        role: titleCase(user.role || "patient"),
        gender: titleCase(user.gender || ""),
        email: user.email || "",
        phone: user.phoneNumber || user.phone || "",
        birthDate: toDateInputValue(user.birthDate || user.birth_date || ""),
        status: titleCase(doctorProfile.status || user.status || "active"),
        avatar: user.profilePhotoUrl || user.avatarUrl || user.avatar || profileDoctor,
        specialization: doctorProfile.specialization || user.specialization || "",
        licenseNumber: doctorProfile.licenseNumber || user.licenseNumber || user.medicalLicenseNumber || user.registrationNumber || "",
        medicalLicense: null,
        licenseFile: doctorProfile.licenseFile || user.licenseFile || user.medicalLicenseFile || user.licenseDocument || "",
    };
}

function parseUsersResponse(response) {
    const nestedPayload = response?.data && !Array.isArray(response.data) ? response.data : null;
    const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(nestedPayload?.data)
                ? nestedPayload.data
                : [];
    const meta = response?.meta || nestedPayload?.meta;

    return { data, meta };
}

function fetchUsers(activeFilter, page) {
    return getAdminUsers({
        role: activeFilter === "All Roles" ? "" : activeFilter.slice(0, -1).toLowerCase(),
        page,
        limit: 8,
    });
}

async function fetchDoctorProfiles() {
    const response = await getAdminDoctors({ page: 1, limit: 100 });
    return Object.fromEntries(
        (response.data || []).map((doctor) => [doctor.userId, doctor])
    );
}

function toUserPayload(user, includePassword) {
    if (includePassword && String(user.role || "").toLowerCase() === "doctor") {
        const payload = new FormData();
        payload.append("fullName", user.name);
        payload.append("email", user.email);
        payload.append("role", "doctor");
        payload.append("gender", String(user.gender || "").toLowerCase());
        payload.append("password", user.password);
        payload.append("specialization", user.specialization);
        payload.append("licenseNumber", user.licenseNumber);

        if (user.phone) payload.append("phoneNumber", user.phone);
        if (user.birthDate) payload.append("birthDate", user.birthDate);
        if (user.medicalLicense) payload.append("medicalLicense", user.medicalLicense);

        return payload;
    }

    const payload = {
        fullName: user.name,
        email: user.email,
        role: String(user.role || "").toLowerCase(),
        gender: String(user.gender || "").toLowerCase(),
    };

    if (user.phone) {
        payload.phoneNumber = user.phone;
    }

    if (user.birthDate) {
        payload.birthDate = user.birthDate;
    }

    if (!includePassword && String(user.role || "").toLowerCase() === "doctor" && user.status) {
        payload.status = String(user.status).toLowerCase();
    }

    if (includePassword) {
        payload.password = user.password;
    }

    return payload;
}

function validateUserForm(user, includePassword) {
    if (!user.name?.trim()) return "Full name wajib diisi.";
    if (!user.email?.trim()) return "Email wajib diisi.";
    if (!["admin", "doctor", "patient"].includes(String(user.role || "").toLowerCase())) {
        return "Role harus admin, doctor, atau patient.";
    }
    if (!["male", "female"].includes(String(user.gender || "").toLowerCase())) {
        return "Gender harus male atau female.";
    }
    if (includePassword && String(user.password || "").length < 6) {
        return "Password minimal 6 karakter.";
    }
    if (includePassword && String(user.role || "").toLowerCase() === "doctor") {
        if (!user.specialization?.trim()) return "Specialization wajib diisi untuk doctor.";
        if (!user.licenseNumber?.trim()) return "License number wajib diisi untuk doctor.";
        const fileError = validateMedicalLicenseFile(user.medicalLicense);
        if (fileError) return fileError;
    }

    return "";
}

function getApiErrorMessage(error) {
    const payload = error.response?.data;

    if (payload?.message) {
        return payload.message;
    }

    if (payload?.error) {
        return payload.error;
    }

    if (payload?.errors && typeof payload.errors === "object") {
        return Object.values(payload.errors)
            .flat()
            .filter(Boolean)
            .join(" ");
    }

    return "";
}

function getDeleteErrorMessage(error) {
    const statusCode = error.response?.status;

    if (statusCode >= 500) {
        return "User gagal dihapus karena masih memiliki data terkait atau terjadi kendala di server.";
    }

    return getApiErrorMessage(error) || "Failed to delete user.";
}

function validateMedicalLicenseFile(file) {
    if (!file) return "";
    if (file.type !== "application/pdf") return "Medical license harus berupa file PDF.";
    if (file.size > 5 * 1024 * 1024) return "Ukuran medical license maksimal 5MB.";
    return "";
}

function titleCase(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    return parts.length > 0 ? parts.map((part) => part[0]).join("").slice(0, 3).toUpperCase() : "DR";
}

function formatReadableDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
}

function toDateInputValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toISOString().slice(0, 10);
}

function ModalField({ label, value, placeholder, onChange, type = "text" }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">
                {label}
            </span>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 w-full rounded-xl bg-slate-100 px-4 text-slate-900 outline-none placeholder:text-slate-400"
            />
        </label>
    );
}

function ModalFileField({ label, file, placeholder, accept, onChange }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">
                {label}
            </span>
            <span className="flex h-12 cursor-pointer items-center rounded-xl bg-slate-100 px-4 text-slate-900">
                {file?.name || placeholder}
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

function ModalSelect({ label, value, options, onChange }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">
                {label}
            </span>
            <span className="relative block">
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-12 w-full appearance-none rounded-xl bg-slate-100 px-4 text-slate-900 outline-none"
                >
                    {options.map((option) => (
                        <option key={option}>{option}</option>
                    ))}
                </select>
                <ChevronDown size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
            </span>
        </label>
    );
}
