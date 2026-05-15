import { useEffect, useState } from "react";
import { Pencil, ShieldCheck, UserRound } from "lucide-react";
import profileDoctor from "../../../assets/login_doctor_profile.png";
import { toAssetUrl } from "../../../utils/assets";
import { getAdminProfile, updateAdminAccountSettings } from "../services/adminService";

const defaultProfile = {
    name: "Aryo Jaty",
    email: "aryojaty@icloud.com",
    gender: "Male",
    role: "Administrator",
    phone: "+628134567890",
    birthDate: "April 23, 1996",
    clinicId: "#MS-9942",
    joined: "Oct 2023",
    avatar: profileDoctor,
};

export default function AdminProfilePage() {
    const [profile, setProfile] = useState(defaultProfile);
    const [initialProfile, setInitialProfile] = useState(defaultProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        let isMounted = true;

        getAdminProfile()
            .then((data) => {
                if (!isMounted) return;
                const normalized = normalizeProfile(data);
                setProfile(normalized);
                setInitialProfile(normalized);
            })
            .catch((error) => {
                if (isMounted) {
                    setError(error.response?.data?.message || "Failed to fetch profile settings.");
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
    }, []);

    const updateField = (field, value) => {
        setProfile((current) => ({ ...current, [field]: value }));
        setError("");
        setSuccess("");
    };

    const discardChanges = () => {
        setProfile(initialProfile);
        setError("");
        setSuccess("");
    };

    const saveProfile = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            await updateAdminAccountSettings({
                fullName: profile.name,
                email: profile.email,
                gender: String(profile.gender).toLowerCase(),
                phoneNumber: profile.phone,
                birthDate: profile.birthDate,
            });
            setInitialProfile(profile);
            setSuccess("Profile saved.");
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-[1420px] pb-12">
            <div className="mb-9">
                <h1 className="text-[40px] font-extrabold leading-tight text-slate-950">Profile Settings</h1>
                <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-600">
                    Manage your clinical credentials, personal information, and platform
                    preferences for the MySkin diagnostic ecosystem.
                </p>
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

            <div className="grid gap-8 xl:grid-cols-[450px_1fr]">
                <div className="rounded-[22px] bg-white p-8 shadow-sm">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <img
                                src={toAssetUrl(profile.avatar)}
                                alt={profile.name}
                                className="h-28 w-28 rounded-[18px] object-cover shadow-xl shadow-slate-900/10"
                            />
                            <button
                                type="button"
                                className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                aria-label="Edit profile photo"
                            >
                                <Pencil size={15} />
                            </button>
                        </div>
                        <h2 className="mt-8 text-xl font-extrabold text-slate-950">{profile.name}</h2>
                        <p className="mt-1 text-sm font-extrabold uppercase tracking-[0.12em] text-blue-600">
                            {profile.role}
                        </p>
                    </div>

                    <div className="mt-8 space-y-4">
                        <ProfileMeta label="Clinic ID" value={profile.clinicId} />
                        <ProfileMeta label="Joined" value={profile.joined} />
                    </div>
                </div>

                <div className="rounded-[22px] bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-3">
                        <UserRound size={22} className="text-blue-600" />
                        <h2 className="text-xl font-extrabold text-slate-950">General Information</h2>
                    </div>

                    <div className="grid gap-x-11 gap-y-8 lg:grid-cols-2">
                        <ProfileField label="Full Name" value={profile.name} loading={loading} onChange={(value) => updateField("name", value)} />
                        <ProfileField label="Email Address" value={profile.email} loading={loading} onChange={(value) => updateField("email", value)} />
                        <ProfileField label="Gender" value={profile.gender} loading={loading} onChange={(value) => updateField("gender", value)} />
                        <ProfileField label="Role" value={profile.role} loading={loading} onChange={(value) => updateField("role", value)} />
                        <ProfileField label="Phone Number" value={profile.phone} loading={loading} onChange={(value) => updateField("phone", value)} />
                        <ProfileField label="Birth Date" value={profile.birthDate} loading={loading} onChange={(value) => updateField("birthDate", value)} />
                    </div>
                </div>
            </div>

            <div className="mt-14 grid gap-8 xl:grid-cols-[450px_1fr]">
                <div className="rounded-[22px] border border-blue-100 bg-blue-50 p-6">
                    <div className="flex gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                            <ShieldCheck size={22} />
                        </span>
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
                                Practitioner Status
                            </p>
                            <h3 className="mt-1 text-lg font-extrabold text-slate-950">Verified Administrator</h3>
                            <p className="mt-5 text-sm leading-relaxed text-slate-600">
                                Your administrator access for the MySkin platform has been verified to manage and
                                oversee Melanoma AI analysis.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-20 flex items-center justify-end gap-12">
                <button
                    type="button"
                    onClick={discardChanges}
                    disabled={loading || saving}
                    className="text-base font-extrabold text-blue-600 disabled:text-slate-400"
                >
                    Discard Changes
                </button>
                <button
                    type="button"
                    onClick={saveProfile}
                    disabled={loading || saving}
                    className="h-14 rounded-xl bg-blue-600 px-12 text-base font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:bg-blue-300"
                >
                    {saving ? "Saving..." : "Save Profile Changes"}
                </button>
            </div>

            <p className="mt-28 text-center text-sm text-slate-500">
                © 2026 MySkin The Clinical Atelier. AI-powered dermatology support.
            </p>
        </div>
    );
}

function ProfileMeta({ label, value }) {
    return (
        <div className="flex h-12 items-center justify-between rounded-xl bg-slate-100 px-4">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-600">{label}</span>
            <span className="text-sm font-semibold text-slate-950">{value}</span>
        </div>
    );
}

function ProfileField({ label, value, loading, onChange }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
                {label}
            </span>
            <input
                value={loading ? "Loading..." : value || ""}
                onChange={(event) => onChange(event.target.value)}
                readOnly={loading}
                className="h-12 w-full rounded-xl bg-slate-100 px-4 text-slate-950 outline-none read-only:text-slate-500"
            />
        </label>
    );
}

function normalizeProfile(data) {
    const account = data?.account || data?.profile || data?.user || {};

    return {
        ...defaultProfile,
        name: account.fullName || account.name || data?.fullName || data?.name || defaultProfile.name,
        email: account.email || data?.email || defaultProfile.email,
        gender: titleCase(account.gender || data?.gender || defaultProfile.gender),
        role: titleCase(account.role || data?.role || defaultProfile.role),
        phone: account.phoneNumber || account.phone || data?.phoneNumber || data?.phone || defaultProfile.phone,
        birthDate: formatReadableDate(account.birthDate || data?.birthDate || defaultProfile.birthDate),
        clinicId: account.clinicId || account.adminId || data?.clinicId || data?.adminId || defaultProfile.clinicId,
        joined: formatJoined(account.joinedAt || account.createdAt || data?.joinedAt || data?.createdAt || defaultProfile.joined),
        avatar: account.profilePhotoUrl || account.avatarUrl || data?.profilePhotoUrl || data?.avatarUrl || defaultProfile.avatar,
    };
}

function titleCase(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatReadableDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatJoined(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
