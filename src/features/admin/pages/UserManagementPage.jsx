import { useEffect, useMemo, useState } from "react";
import {
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
    getAdminUsers,
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
};

export default function UserManagementPage() {
    const [activeFilter, setActiveFilter] = useState("All Roles");
    const [modalMode, setModalMode] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ page: 1, limit: 8, total: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError("");

        getAdminUsers({
            role: activeFilter === "All Roles" ? "" : activeFilter.slice(0, -1).toLowerCase(),
            page,
            limit: 8,
        })
            .then((response) => {
                if (!isMounted) return;

                const data = Array.isArray(response.data) ? response.data : [];
                setUsers(data.map(normalizeUser));
                setMeta(response.meta || { page, limit: 8, total: data.length });
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
        setSelectedUser(blankUser);
        setModalMode("add");
    };

    const openEditModal = (user) => {
        setSelectedUser({ ...user, password: "password123" });
        setModalMode("edit");
    };

    const closeModal = () => {
        setSelectedUser(null);
        setModalMode("");
    };

    const handleSaveUser = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            if (modalMode === "add") {
                await createAdminUser(toUserPayload(selectedUser, true));
            } else {
                await updateAdminUser(selectedUser.id, toUserPayload(selectedUser, false));
            }

            closeModal();
            setPage(1);
            const response = await getAdminUsers({
                role: activeFilter === "All Roles" ? "" : activeFilter.slice(0, -1).toLowerCase(),
                page: 1,
                limit: 8,
            });
            const data = Array.isArray(response.data) ? response.data : [];
            setUsers(data.map(normalizeUser));
            setMeta(response.meta || { page: 1, limit: 8, total: data.length });
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save user.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!userId) return;
        setError("");

        try {
            await deleteAdminUser(userId);
            setUsers((current) => current.filter((user) => user.id !== userId));
            setMeta((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
        } catch (error) {
            setError(error.response?.data?.message || "Failed to delete user.");
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

            {error && (
                <div className="mb-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                    {error}
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
                                <button type="button" className="text-blue-400" aria-label="Verify user">
                                    <ShieldCheck size={21} />
                                </button>
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
                                    onClick={() => handleDeleteUser(user.id)}
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
                <p className="text-sm text-slate-400">ID: #{user.id}</p>
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

function UserModal({ mode, user, setUser, onClose, onSubmit, saving = false }) {
    const isEdit = mode === "edit";

    const updateField = (field, value) => {
        setUser((current) => ({ ...current, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-sm">
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
                            options={["Doctor", "Patient"]}
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
                    <ModalField
                        label="Password"
                        value={user.password}
                        placeholder="password123"
                        type="password"
                        onChange={(value) => updateField("password", value)}
                    />
                </div>

                <div className="mt-8 grid grid-cols-[0.75fr_1.25fr] gap-4">
                    <button type="button" onClick={onClose} className="h-14 rounded-xl bg-slate-200 text-base font-extrabold text-slate-900">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="h-14 rounded-xl bg-blue-600 text-base font-extrabold text-white shadow-lg shadow-blue-600/25 disabled:bg-blue-300">
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create Account"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function normalizeUser(user) {
    return {
        id: user.id || user.userId || "",
        name: user.fullName || user.name || user.full_name || "",
        role: titleCase(user.role || "patient"),
        gender: titleCase(user.gender || ""),
        email: user.email || "",
        phone: user.phoneNumber || user.phone || "",
        birthDate: toDateInputValue(user.birthDate || user.birth_date || ""),
        status: titleCase(user.status || "active"),
        avatar: user.profilePhotoUrl || user.avatarUrl || user.avatar || profileDoctor,
    };
}

function toUserPayload(user, includePassword) {
    const payload = {
        fullName: user.name,
        email: user.email,
        role: String(user.role || "").toLowerCase(),
        gender: String(user.gender || "").toLowerCase(),
        phoneNumber: user.phone,
        birthDate: user.birthDate,
    };

    if (includePassword) {
        payload.password = user.password;
    }

    return payload;
}

function titleCase(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
