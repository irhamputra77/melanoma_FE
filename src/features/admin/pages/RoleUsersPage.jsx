import { useEffect, useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    KeyRound,
    Mail,
    Pencil,
    Phone,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    UserPlus,
    UserRound,
    UsersRound,
    X,
} from "lucide-react";
import { getEmailValidationError, normalizeEmail } from "../../../utils/emailValidation";
import {
    DEFAULT_ADMIN_PAGE_SIZE,
    formatAdminDate,
    isStrictDeleteConfirmationEnabled,
} from "../../../utils/adminSettings";
import {
    createAdminUser,
    deleteAdminUser,
    getAdminUsers,
    resetAdminUserPassword,
    updateAdminUser,
    updateAdminUserStatus,
} from "../services/adminService";

const roleCopy = {
    admin: {
        title: "Admin Users",
        description: "Monitor administrator accounts and platform access status.",
        empty: "No admin users found.",
        accent: "blue",
    },
    patient: {
        title: "Patient Users",
        description: "Review patient account records and account activity status.",
        empty: "No patient users found.",
        accent: "emerald",
    },
};

export default function RoleUsersPage({ role }) {
    const config = roleCopy[role] || roleCopy.patient;
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState({ page: 1, limit: DEFAULT_ADMIN_PAGE_SIZE, total: 0 });
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [modalError, setModalError] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [addUser, setAddUser] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [resetTarget, setResetTarget] = useState(null);
    const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });

    const fetchUsers = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getAdminUsers({
                role,
                search: search.trim() || undefined,
                status: statusFilter === "all" ? undefined : statusFilter,
                page,
            });
            setUsers((response.data || []).map(normalizeUser));
            setMeta(response.meta || { page, limit: DEFAULT_ADMIN_PAGE_SIZE, total: response.data?.length || 0 });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch users.");
            setUsers([]);
            setMeta({ page, limit: DEFAULT_ADMIN_PAGE_SIZE, total: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [role, page, statusFilter]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setPage(1);
            fetchUsers();
        }, 350);

        return () => clearTimeout(timeout);
    }, [search]);

    const stats = useMemo(() => {
        const active = users.filter((user) => user.status.toLowerCase() === "active").length;
        return {
            total: meta.total || users.length,
            active,
            inactive: Math.max((meta.total || users.length) - active, 0),
        };
    }, [users, meta.total]);

    const openEditModal = (user) => {
        setSuccess("");
        setModalError("");
        setSelectedUser({ ...user });
    };

    const openAddModal = () => {
        setSuccess("");
        setModalError("");
        setAddUser(createBlankRoleUser(role));
    };

    const closeEditModal = () => {
        setSelectedUser(null);
        setModalError("");
    };

    const closeAddModal = () => {
        setAddUser(null);
        setModalError("");
    };

    const handleCreateUser = async (event) => {
        event.preventDefault();
        if (!addUser) return;

        const validationError = validateUser(addUser, { requirePassword: true });
        if (validationError) {
            setModalError(validationError);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        setModalError("");

        try {
            await createAdminUser(toUserPayload(addUser, role, { includePassword: true }));

            closeAddModal();
            setPage(1);
            await fetchUsers();
            setSuccess(`${config.title.replace(" Users", "")} berhasil ditambahkan.`);
        } catch (err) {
            setModalError(getApiErrorMessage(err) || "Failed to create user.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveUser = async (event) => {
        event.preventDefault();
        if (!selectedUser?.key) return;

        const validationError = validateUser(selectedUser);
        if (validationError) {
            setModalError(validationError);
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");
        setModalError("");

        try {
            await updateAdminUser(selectedUser.key, toUserPayload(selectedUser, role));
            if (selectedUser.status) {
                await updateAdminUserStatus(selectedUser.key, selectedUser.status);
            }
            closeEditModal();
            await fetchUsers();
            setSuccess(`${config.title.replace(" Users", "")} berhasil diperbarui.`);
        } catch (err) {
            setModalError(getApiErrorMessage(err) || "Failed to update user.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteTarget?.key) return;

        setSaving(true);
        setError("");
        setSuccess("");
        setModalError("");

        try {
            await deleteAdminUser(deleteTarget.key);
            setDeleteTarget(null);
            await fetchUsers();
            setSuccess(`${deleteTarget.name} berhasil dihapus.`);
        } catch (err) {
            setModalError(getApiErrorMessage(err) || "Failed to delete user.");
        } finally {
            setSaving(false);
        }
    };

    const openResetModal = (user) => {
        setSuccess("");
        setModalError("");
        setResetForm({ password: "", confirmPassword: "" });
        setResetTarget(user);
    };

    const closeResetModal = () => {
        setResetTarget(null);
        setResetForm({ password: "", confirmPassword: "" });
        setModalError("");
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        if (!resetTarget?.key) return;

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
            await resetAdminUserPassword(resetTarget.key, resetForm.password);
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
                        {config.title}
                    </h1>
                    <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
                        {config.description}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white shadow-sm shadow-slate-900/20"
                    >
                        <UserPlus size={16} />
                        Add {titleCase(role)}
                    </button>
                    <button
                        type="button"
                        onClick={fetchUsers}
                        disabled={loading}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm shadow-blue-600/20 disabled:bg-blue-300"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh Data
                    </button>
                </div>
            </div>

            <div className="mb-7 grid gap-5 md:grid-cols-3">
                <MetricCard title="Total Accounts" value={stats.total} icon={<UsersRound size={18} />} tone="blue" />
                <MetricCard title="Active Accounts" value={stats.active} icon={<ShieldCheck size={18} />} tone="emerald" />
                <MetricCard title="Other Status" value={stats.inactive} icon={<UserRound size={18} />} tone="slate" />
            </div>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="relative block">
                    <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={`Search ${role} users`}
                        className="h-11 w-full rounded-xl bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none placeholder:text-slate-400 sm:w-80"
                    />
                </label>
                <select
                    value={statusFilter}
                    onChange={(event) => {
                        setStatusFilter(event.target.value);
                        setPage(1);
                    }}
                    className="h-11 rounded-xl bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm outline-none"
                >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
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
                <div className="grid grid-cols-[1.05fr_1.25fr_0.65fr_0.65fr_0.7fr_0.85fr] bg-slate-50 px-8 py-5 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                    <span>User</span>
                    <span>Contact</span>
                    <span>Gender</span>
                    <span>Status</span>
                    <span>Birth Date</span>
                    <span>Actions</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {loading && <EmptyRow text="Loading users..." />}
                    {!loading && users.length === 0 && <EmptyRow text={config.empty} />}
                    {!loading && users.map((user) => (
                        <article key={user.key} className="grid min-h-[96px] grid-cols-[1.05fr_1.25fr_0.65fr_0.65fr_0.7fr_0.85fr] items-center px-8 text-sm text-slate-700">
                            <div className="flex items-center gap-4">
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${config.accent === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                                    <UserRound size={20} />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-base font-extrabold text-slate-950">{user.name}</p>
                                    <p className="text-xs font-semibold text-slate-400">{titleCase(user.role)}</p>
                                </div>
                            </div>
                            <div className="min-w-0 space-y-2 text-xs font-semibold text-slate-500">
                                <InfoLine icon={<Mail size={14} />} value={user.email || "-"} />
                                <InfoLine icon={<Phone size={14} />} value={user.phone || "-"} />
                            </div>
                            <span className="font-semibold text-slate-600">{titleCase(user.gender) || "-"}</span>
                            <StatusBadge status={user.status} />
                            <span className="font-semibold text-slate-500">{formatDate(user.birthDate)}</span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => openEditModal(user)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                                    aria-label="Edit user"
                                >
                                    <Pencil size={17} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openResetModal(user)}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
                                    aria-label="Reset user password"
                                >
                                    <KeyRound size={17} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalError("");
                                        setDeleteTarget(user);
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600"
                                    aria-label="Delete user"
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
                    Showing <span className="font-extrabold text-slate-900">{users.length}</span> of {meta.total} records
                </p>
                <Pagination page={meta.page || page} total={meta.total} limit={meta.limit || DEFAULT_ADMIN_PAGE_SIZE} onPageChange={setPage} />
            </div>

            {selectedUser && (
                <UserEditModal
                    mode="edit"
                    role={role}
                    user={selectedUser}
                    setUser={setSelectedUser}
                    saving={saving}
                    error={modalError}
                    onClose={closeEditModal}
                    onSubmit={handleSaveUser}
                />
            )}

            {addUser && (
                <UserEditModal
                    mode="create"
                    role={role}
                    user={addUser}
                    setUser={setAddUser}
                    saving={saving}
                    error={modalError}
                    onClose={closeAddModal}
                    onSubmit={handleCreateUser}
                />
            )}

            {deleteTarget && (
                <DeleteModal
                    title={`Hapus ${deleteTarget.name}?`}
                    description="Akun ini akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan."
                    confirmationText={`DELETE ${deleteTarget.name}`}
                    strictConfirmation={isStrictDeleteConfirmationEnabled()}
                    saving={saving}
                    error={modalError}
                    onClose={() => {
                        setModalError("");
                        setDeleteTarget(null);
                    }}
                    onConfirm={handleDeleteUser}
                />
            )}

            {resetTarget && (
                <ResetPasswordModal
                    user={resetTarget}
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

function UserEditModal({ mode = "edit", role, user, setUser, saving, error, onClose, onSubmit }) {
    const isCreate = mode === "create";
    const updateField = (field, value) => {
        setUser((current) => ({ ...current, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <form noValidate onSubmit={onSubmit} className="w-full max-w-[520px] rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="mb-6 flex items-start justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">{isCreate ? "Add" : "Edit"} {titleCase(role)}</h2>
                        <p className="mt-1 text-sm text-slate-500">{isCreate ? "Create a new account for this role." : "Update account profile and access status."}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500" aria-label="Close edit modal">
                        <X size={22} />
                    </button>
                </div>

                {error && <ModalError text={error} />}

                <div className="space-y-4">
                    <ModalField label="Full Name" value={user.name} onChange={(value) => updateField("name", value)} />
                    <ModalField label="Email" value={user.email} type="email" maxLength={254} onChange={(value) => updateField("email", value)} />
                    <ModalField label="Phone" value={user.phone} onChange={(value) => updateField("phone", value)} />
                    <div className="grid grid-cols-2 gap-4">
                        <ModalSelect label="Gender" value={user.gender || ""} options={["", "male", "female"]} onChange={(value) => updateField("gender", value)} />
                        {!isCreate && <ModalSelect label="Status" value={user.status || "active"} options={["active", "pending", "inactive", "suspended"]} onChange={(value) => updateField("status", value)} />}
                    </div>
                    <ModalField label="Birth Date" value={toDateInputValue(user.birthDate)} type="date" onChange={(value) => updateField("birthDate", value)} />
                    {isCreate && <ModalField label="Password" value={user.password} type="password" onChange={(value) => updateField("password", value)} />}
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-xl bg-slate-100 font-extrabold text-slate-700 disabled:opacity-60">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="h-12 rounded-xl bg-blue-600 font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:bg-blue-300">
                        {saving ? "Saving..." : isCreate ? "Create Account" : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function DeleteModal({ title, description, confirmationText, strictConfirmation, saving, error, onClose, onConfirm }) {
    const [confirmation, setConfirmation] = useState("");
    const canDelete = !strictConfirmation || confirmation === confirmationText;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-[6px]">
            <div className="w-full max-w-[420px] rounded-[28px] bg-white p-7 shadow-2xl shadow-slate-900/20">
                <div className="mb-6 flex items-start justify-between gap-5">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-950">{title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-500" aria-label="Close delete modal">
                        <X size={22} />
                    </button>
                </div>

                {error && <ModalError text={error} />}

                {strictConfirmation && (
                    <label className="mb-5 block">
                        <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600">
                            Ketik "{confirmationText}"
                        </span>
                        <input
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            className="h-12 w-full rounded-xl bg-red-50 px-4 text-sm font-extrabold text-red-700 outline-none ring-1 ring-red-100 placeholder:text-red-300"
                            placeholder={confirmationText}
                        />
                    </label>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-xl bg-slate-100 font-extrabold text-slate-700 disabled:opacity-60">
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm} disabled={saving || !canDelete} className="h-12 rounded-xl bg-red-600 font-extrabold text-white shadow-lg shadow-red-600/20 disabled:bg-red-300">
                        {saving ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ResetPasswordModal({ user, form, setForm, saving, error, onClose, onSubmit }) {
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
                            Buat password baru untuk <span className="font-bold text-slate-700">{user.name}</span>.
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
    const isActive = normalized === "active";
    const isPending = normalized === "pending";

    return (
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${isActive ? "bg-emerald-50 text-emerald-700" : isPending ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
            <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-600" : isPending ? "bg-amber-600" : "bg-slate-400"}`} />
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

function normalizeUser(user) {
    return {
        key: user.userId || user.id || user.email,
        name: user.fullName || user.name || "-",
        email: user.email || "",
        phone: user.phoneNumber || user.phone || "",
        role: user.role || "",
        status: user.status || "",
        gender: user.gender || "",
        birthDate: user.birthDate || "",
    };
}

function createBlankRoleUser(role) {
    return {
        key: "",
        name: "",
        email: "",
        phone: "",
        role,
        status: "pending",
        gender: "",
        birthDate: "",
        password: "",
    };
}

function toUserPayload(user, role, options = {}) {
    const payload = {
        fullName: user.name,
        email: normalizeEmail(user.email),
        role,
    };

    const gender = String(user.gender || "").toLowerCase();
    if (gender) {
        payload.gender = gender;
    }

    if (user.phone) {
        payload.phoneNumber = user.phone;
    }

    if (user.birthDate) {
        payload.birthDate = user.birthDate;
    }

    if (options.includePassword) {
        payload.password = user.password;
    }

    return payload;
}

function validateUser(user, options = {}) {
    if (!user.name?.trim()) return "Full name wajib diisi.";
    const emailError = getEmailValidationError(user.email);
    if (emailError) return emailError;
    if (user.gender && !["male", "female"].includes(String(user.gender).toLowerCase())) return "Gender harus male atau female.";
    if (options.requirePassword && !String(user.password || "").trim()) return "Password wajib diisi.";
    return "";
}

function validateResetPassword(form) {
    if (!String(form.password || "").trim()) return "Password baru wajib diisi.";
    if (form.password !== form.confirmPassword) return "Konfirmasi password tidak sama.";
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

function ModalSelect({ label, value, options, onChange }) {
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
                        {option ? titleCase(option) : "Not set"}
                    </option>
                ))}
            </select>
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

function titleCase(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
    return formatAdminDate(value);
}
