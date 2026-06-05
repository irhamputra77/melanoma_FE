import { useEffect, useState } from "react";
import { CalendarDays, Mail, Pencil, Phone, Shield, UserRound } from "lucide-react";
import profileDoctor from "../../../assets/login_doctor_profile.png";
import { toAssetUrl } from "../../../utils/assets";
import { getEmailValidationError, normalizeEmail } from "../../../utils/emailValidation";
import { getAdminProfile, updateAdminAccountSettings, updateAdminProfilePhoto } from "../services/adminService";

const defaultProfile = {
    name: "Aryo Jaty",
    email: "aryojaty@icloud.com",
    gender: "Male",
    role: "Administrator",
    phone: "+628134567890",
    birthDate: "1996-04-23",
    status: "Active",
    joined: "Oct 2023",
    avatar: profileDoctor,
};

export default function AdminProfilePage() {
    const [profile, setProfile] = useState(defaultProfile);
    const [initialProfile, setInitialProfile] = useState(defaultProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
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
        const emailError = getEmailValidationError(profile.email);
        if (emailError) {
            setError(emailError);
            setSuccess("");
            return;
        }

        const normalizedEmail = normalizeEmail(profile.email);
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            await updateAdminAccountSettings({
                fullName: profile.name,
                email: normalizedEmail,
                gender: String(profile.gender).toLowerCase(),
                phoneNumber: profile.phone,
                birthDate: profile.birthDate || undefined,
            });
            const nextProfile = { ...profile, email: normalizedEmail };
            setProfile(nextProfile);
            setInitialProfile(nextProfile);
            setSuccess("Profile saved.");
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    const uploadProfilePhoto = async (file) => {
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file.");
            setSuccess("");
            return;
        }

        setUploadingPhoto(true);
        setError("");
        setSuccess("");

        try {
            const result = await updateAdminProfilePhoto(file);
            let photoUrl = extractProfilePhotoUrl(result);

            if (!photoUrl) {
                const freshProfile = normalizeProfile(await getAdminProfile());
                photoUrl = freshProfile.avatar;
            }

            if (photoUrl) {
                const nextProfile = { ...profile, avatar: photoUrl };
                setProfile(nextProfile);
                setInitialProfile((current) => ({ ...current, avatar: photoUrl }));
            }
            setSuccess(result?.message || "Admin photo updated successfully.");
        } catch (error) {
            setError(error.response?.data?.message || "Failed to update admin photo.");
        } finally {
            setUploadingPhoto(false);
        }
    };

    return (
        <div className="max-w-[1420px] pb-12">
            <div className="mb-9">
                <h1 className="text-[40px] font-extrabold leading-tight text-slate-950">Profile Settings</h1>
                <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-600">
                    Manage your administrator identity and account contact details for the MySkin platform.
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
                            <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                                <Pencil size={15} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    disabled={loading || uploadingPhoto}
                                    aria-label="Upload admin profile photo"
                                    onChange={(event) => {
                                        uploadProfilePhoto(event.target.files?.[0]);
                                        event.target.value = "";
                                    }}
                                />
                            </label>
                        </div>
                        <h2 className="mt-8 text-xl font-extrabold text-slate-950">{profile.name}</h2>
                        <p className="mt-1 text-sm font-extrabold uppercase tracking-[0.12em] text-blue-600">
                            {uploadingPhoto ? "Uploading photo..." : profile.role}
                        </p>
                    </div>

                    <div className="mt-8 space-y-4">
                        <ProfileMeta icon={<Shield size={16} />} label="Account Status" value={profile.status} />
                        <ProfileMeta label="Joined" value={profile.joined} />
                        <ProfileMeta label="Role" value={profile.role} />
                    </div>
                </div>

                <div className="rounded-[22px] bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-3">
                        <UserRound size={22} className="text-blue-600" />
                        <h2 className="text-xl font-extrabold text-slate-950">General Information</h2>
                    </div>

                    <div className="grid gap-x-11 gap-y-8 lg:grid-cols-2">
                        <ProfileField label="Full Name" value={profile.name} loading={loading} onChange={(value) => updateField("name", value)} />
                        <ProfileField label="Email Address" value={profile.email} loading={loading} type="email" maxLength={254} onChange={(value) => updateField("email", value)} />
                        <SelectProfileField
                            label="Gender"
                            value={profile.gender}
                            loading={loading}
                            options={["Male", "Female", "Other"]}
                            onChange={(value) => updateField("gender", value)}
                        />
                        <ProfileField label="Phone Number" value={profile.phone} loading={loading} onChange={(value) => updateField("phone", value)} />
                        <ProfileField label="Birth Date" value={profile.birthDate} loading={loading} type="date" onChange={(value) => updateField("birthDate", value)} />
                    </div>

                    <div className="mt-10 grid gap-4 lg:grid-cols-3">
                        <InfoTile icon={<Mail size={18} />} label="Primary Email" value={profile.email} />
                        <InfoTile icon={<Phone size={18} />} label="Phone" value={profile.phone || "-"} />
                        <InfoTile icon={<CalendarDays size={18} />} label="Member Since" value={profile.joined || "-"} />
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

function ProfileMeta({ label, value, icon }) {
    return (
        <div className="flex h-12 items-center justify-between rounded-xl bg-slate-100 px-4">
            <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-600">
                {icon}
                {label}
            </span>
            <span className="text-sm font-semibold text-slate-950">{value}</span>
        </div>
    );
}

function ProfileField({ label, value, loading, onChange, type = "text", maxLength }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
                {label}
            </span>
            <input
                type={type}
                maxLength={maxLength}
                value={loading ? "Loading..." : value || ""}
                onChange={(event) => onChange(event.target.value)}
                readOnly={loading}
                className="h-12 w-full rounded-xl bg-slate-100 px-4 text-slate-950 outline-none read-only:text-slate-500"
            />
        </label>
    );
}

function SelectProfileField({ label, value, loading, options, onChange }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
                {label}
            </span>
            <select
                value={loading ? "" : value || ""}
                onChange={(event) => onChange(event.target.value)}
                disabled={loading}
                className="h-12 w-full rounded-xl bg-slate-100 px-4 text-slate-950 outline-none disabled:text-slate-500"
            >
                {loading ? (
                    <option value="">Loading...</option>
                ) : options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </label>
    );
}

function InfoTile({ icon, label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                {icon}
            </div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 break-words text-sm font-extrabold text-slate-950">{value}</p>
        </div>
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
        birthDate: formatDateInput(account.birthDate || data?.birthDate || defaultProfile.birthDate),
        status: titleCase(account.status || data?.status || defaultProfile.status),
        joined: formatJoined(account.joinedAt || account.createdAt || data?.joinedAt || data?.createdAt || defaultProfile.joined),
        avatar:
            account.profilePhotoUrl ||
            account.profilePhoto ||
            account.photoUrl ||
            account.avatarUrl ||
            account.avatar ||
            data?.profilePhotoUrl ||
            data?.profilePhoto ||
            data?.photoUrl ||
            data?.avatarUrl ||
            data?.avatar ||
            defaultProfile.avatar,
    };
}

function extractProfilePhotoUrl(result) {
    return (
        result?.photoUrl ||
        result?.profilePhotoUrl ||
        result?.avatarUrl ||
        result?.data?.photoUrl ||
        result?.data?.profilePhotoUrl ||
        result?.data?.avatarUrl ||
        ""
    );
}

function titleCase(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().slice(0, 10);
}

function formatJoined(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
