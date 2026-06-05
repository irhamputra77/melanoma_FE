import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, ShieldCheck, UserRound } from "lucide-react";
import profileDoctor from "../../../assets/login_doctor_profile.png";
import { toAssetUrl } from "../../../utils/assets";
import { getEmailValidationError, normalizeEmail } from "../../../utils/emailValidation";
import {
    getDoctorProfile,
    getDoctorSettings,
    updateDoctorAccountSettings,
    updateDoctorProfile,
    updateDoctorProfilePhoto,
} from "../services/doctorService";

const emptyProfile = {
    id: "",
    fullName: "",
    email: "",
    gender: "",
    role: "doctor",
    phoneNumber: "",
    birthDate: "",
    joinedAt: "",
    status: "",
    profilePhotoUrl: "",
    clinicName: "",
};

export default function DoctorProfilePage() {
    const fileInputRef = useRef(null);
    const [profile, setProfile] = useState(emptyProfile);
    const [initialProfile, setInitialProfile] = useState(emptyProfile);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [loading, setLoading] = useState(true);
    const [editLoading, setEditLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        let isMounted = true;

        Promise.allSettled([getDoctorProfile(), getDoctorSettings()])
            .then(([profileResult, settingsResult]) => {
                if (!isMounted) return;

                if (profileResult.status === "rejected") {
                    throw profileResult.reason;
                }

                const normalized = normalizeDoctorProfile(
                    profileResult.value,
                    settingsResult.status === "fulfilled" ? settingsResult.value : null
                );

                setProfile(normalized);
                setInitialProfile(normalized);
            })
            .catch((error) => {
                if (isMounted) {
                    setError(error.response?.data?.message || "Failed to fetch doctor profile.");
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

    useEffect(() => {
        return () => {
            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }
        };
    }, [photoPreview]);

    const displayName = profile.fullName || "Doctor Name";
    const displayRole = titleCase(profile.role || "doctor");
    const imageUrl = useMemo(() => {
        if (photoPreview) return photoPreview;
        if (profile.profilePhotoUrl) return toAssetUrl(profile.profilePhotoUrl);
        return profileDoctor;
    }, [photoPreview, profile.profilePhotoUrl]);

    const updateField = (field, value) => {
        if (!isEditing) return;

        setProfile((current) => ({ ...current, [field]: value }));
        setSuccess("");
        setError("");
    };

    const handlePhotoChange = (event) => {
        if (!isEditing) return;

        const file = event.target.files?.[0];
        if (!file) return;

        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }

        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
        setSuccess("");
        setError("");
    };

    const startEditing = async () => {
        setEditLoading(true);
        setError("");
        setSuccess("");

        try {
            const [profileResult, settingsResult] = await Promise.allSettled([
                getDoctorProfile(),
                getDoctorSettings(),
            ]);

            if (profileResult.status === "rejected") {
                throw profileResult.reason;
            }

            const normalized = normalizeDoctorProfile(
                profileResult.value,
                settingsResult.status === "fulfilled" ? settingsResult.value : null
            );

            if (photoPreview) {
                URL.revokeObjectURL(photoPreview);
            }

            setProfile(normalized);
            setInitialProfile(normalized);
            setPhotoFile(null);
            setPhotoPreview("");
            setIsEditing(true);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            setError(error.response?.data?.message || "Failed to fetch editable doctor profile.");
        } finally {
            setEditLoading(false);
        }
    };

    const discardChanges = () => {
        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }

        setProfile(initialProfile);
        setPhotoFile(null);
        setPhotoPreview("");
        setError("");
        setSuccess("");
        setIsEditing(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const saveProfile = async () => {
        if (!isEditing) return;

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
            let uploadedPhotoUrl = "";
            const tasks = [
                updateDoctorProfile({
                    fullName: profile.fullName,
                    phoneNumber: profile.phoneNumber,
                    gender: profile.gender,
                    birthDate: profile.birthDate,
                }),
            ];

            if (normalizedEmail !== normalizeEmail(initialProfile.email)) {
                tasks.push(updateDoctorAccountSettings({ email: normalizedEmail }));
            }

            if (photoFile) {
                tasks.push(
                    updateDoctorProfilePhoto(photoFile).then((result) => {
                        uploadedPhotoUrl = extractProfilePhotoUrl(result);
                        return result;
                    })
                );
            }

            await Promise.all(tasks);

            let nextProfile = { ...profile };
            const [freshProfileResult, freshSettingsResult] = await Promise.allSettled([
                getDoctorProfile(),
                getDoctorSettings(),
            ]);

            if (freshProfileResult.status === "fulfilled") {
                nextProfile = normalizeDoctorProfile(
                    freshProfileResult.value,
                    freshSettingsResult.status === "fulfilled" ? freshSettingsResult.value : {
                        account: { email: normalizedEmail },
                    }
                );
            } else {
                nextProfile.email = normalizedEmail;
            }

            if (uploadedPhotoUrl) {
                nextProfile.profilePhotoUrl = uploadedPhotoUrl;
            }

            setProfile(nextProfile);
            setInitialProfile(nextProfile);
            setPhotoFile(null);
            setPhotoPreview("");
            setIsEditing(false);
            setSuccess("Profile changes saved.");

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save profile changes.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-109px)] max-w-7xl pb-3">
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-[32px] font-extrabold leading-tight text-slate-950">
                        Profile Settings
                    </h1>
                    <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-600">
                        Manage your clinical credentials, personal information, and platform
                        preferences for the MySkin diagnostic ecosystem.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={startEditing}
                    disabled={loading || editLoading || saving || isEditing}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/15 disabled:bg-blue-300"
                >
                    <Pencil size={16} />
                    {editLoading ? "Fetching..." : isEditing ? "Editing" : "Edit Profile"}
                </button>
            </div>

            {error && (
                <div className="mb-5 rounded-xl bg-red-50 px-5 py-3 text-sm font-semibold text-red-600">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-5 rounded-xl bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
                    {success}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.95fr]">
                <section className="rounded-[22px] bg-white p-7 shadow-sm">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <img
                                src={imageUrl}
                                alt={displayName}
                                className="h-28 w-28 rounded-2xl object-cover shadow-xl shadow-slate-900/10"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!isEditing || loading || saving}
                                className="absolute -bottom-2 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white disabled:bg-slate-300"
                                aria-label="Edit profile picture"
                            >
                                <Pencil size={15} />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />
                        </div>

                        <h2 className="mt-7 text-base font-extrabold text-slate-950">
                            {loading ? "Loading..." : displayName}
                        </h2>
                        <p className="mt-1 text-xs font-extrabold uppercase text-blue-600">
                            {displayRole}
                        </p>
                    </div>

                    <div className="mt-7 space-y-4">
                        <InfoStrip label="Clinic" value={profile.clinicName || "-"} />
                        <InfoStrip label="Joined" value={formatShortDate(profile.joinedAt)} />
                    </div>
                </section>

                <section className="rounded-[22px] bg-white p-7 shadow-sm">
                    <div className="mb-7 flex items-center gap-3">
                        <UserRound size={18} className="text-blue-600" />
                        <h2 className="text-lg font-extrabold text-slate-950">
                            General Information
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-x-9 gap-y-7 md:grid-cols-2">
                        <ProfileField
                            label="Full Name"
                            value={profile.fullName}
                            loading={loading}
                            readOnly={!isEditing}
                            onChange={(value) => updateField("fullName", value)}
                        />
                        <ProfileField
                            label="Email Address"
                            type="email"
                            value={profile.email}
                            loading={loading}
                            readOnly={!isEditing}
                            maxLength={254}
                            onChange={(value) => updateField("email", value)}
                        />
                        <ProfileSelect
                            label="Gender"
                            value={profile.gender}
                            loading={loading}
                            disabled={!isEditing}
                            onChange={(value) => updateField("gender", value)}
                        />
                        <ProfileField label="Role" value={displayRole} readOnly />
                        <ProfileField
                            label="Phone Number"
                            value={profile.phoneNumber}
                            loading={loading}
                            readOnly={!isEditing}
                            onChange={(value) => updateField("phoneNumber", value)}
                        />
                        <ProfileField
                            label="Birth Date"
                            type="date"
                            value={toDateInputValue(profile.birthDate)}
                            loading={loading}
                            readOnly={!isEditing}
                            onChange={(value) => updateField("birthDate", value)}
                        />
                    </div>
                </section>
            </div>

            <div className="mt-16 flex items-center justify-end gap-12">
                <button
                    type="button"
                    onClick={discardChanges}
                    disabled={loading || saving || !isEditing}
                    className="text-sm font-extrabold text-blue-600 disabled:text-slate-400"
                >
                    Discard Changes
                </button>
                <button
                    type="button"
                    onClick={saveProfile}
                    disabled={loading || saving || !isEditing}
                    className="h-14 rounded-xl bg-blue-600 px-12 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:bg-blue-300"
                >
                    {saving ? "Saving..." : "Save Profile Changes"}
                </button>
            </div>

            <p className="mt-20 text-center text-xs text-slate-500">
                (c) 2026 MySkin The Clinical Atelier. AI-powered dermatology support.
            </p>
        </div>
    );
}

function InfoStrip({ label, value }) {
    return (
        <div className="flex h-12 items-center justify-between rounded-xl bg-slate-100 px-4 text-xs">
            <span className="font-extrabold uppercase text-slate-500">{label}</span>
            <span className="font-extrabold text-slate-900">{value || "-"}</span>
        </div>
    );
}

function ProfileField({ label, value, onChange, type = "text", readOnly = false, loading = false, maxLength }) {
    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-extrabold uppercase text-blue-600">
                {label}
            </span>
            <input
                type={type}
                maxLength={maxLength}
                value={loading && type !== "date" ? "Loading..." : value || ""}
                readOnly={readOnly || loading}
                onChange={(event) => onChange?.(event.target.value)}
                className="h-11 w-full rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-900 outline-none read-only:text-slate-700"
            />
        </label>
    );
}

function ProfileSelect({ label, value, onChange, loading = false, disabled = false }) {
    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-extrabold uppercase text-blue-600">
                {label}
            </span>
            <select
                value={loading ? "" : value || ""}
                disabled={loading || disabled}
                onChange={(event) => onChange?.(event.target.value)}
                className="h-11 w-full rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-900 outline-none disabled:text-slate-500"
            >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select>
        </label>
    );
}

function normalizeDoctorProfile(profileData, settingsData) {
    const user = profileData?.user || profileData?.doctor || profileData?.profile || profileData || {};
    const settingsAccount = settingsData?.account || {};

    return {
        id: user.id || user.userId || user.doctorId || user.clinicId || "",
        fullName: user.fullName || user.name || user.full_name || "",
        email: user.email || settingsAccount.email || "",
        gender: normalizeGender(user.gender),
        role: user.role || "doctor",
        phoneNumber: user.phoneNumber || user.phone || user.phone_number || "",
        birthDate: toDateInputValue(user.birthDate || user.birth_date || ""),
        joinedAt: user.createdAt || user.joinedAt || user.joined || "",
        status: user.status || user.verificationStatus || user.practitionerStatus || "",
        clinicName:
            user.clinicName ||
            user.clinic?.name ||
            user.clinic?.clinicName ||
            user.doctorProfile?.clinicName ||
            user.doctorProfile?.clinic?.name ||
            user.profile?.clinicName ||
            user.profile?.clinic?.name ||
            profileData?.clinicName ||
            profileData?.clinic?.name ||
            "",
        profilePhotoUrl:
            user.profilePhotoUrl ||
            user.profilePhoto ||
            user.photoUrl ||
            user.avatarUrl ||
            user.avatar ||
            user.imageUrl ||
            user.doctorProfile?.profilePhotoUrl ||
            user.doctorProfile?.photoUrl ||
            user.doctorProfile?.avatarUrl ||
            user.profile?.profilePhotoUrl ||
            user.profile?.photoUrl ||
            profileData?.profilePhotoUrl ||
            profileData?.photoUrl ||
            profileData?.avatarUrl ||
            "",
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

function normalizeGender(value) {
    const gender = String(value || "").toLowerCase();
    if (gender === "male" || gender === "female") return gender;
    return "";
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

function formatShortDate(value) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });
}

function getPractitionerStatus(status) {
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("pending")) return "Pending Verification";
    if (normalized.includes("reject")) return "Verification Rejected";
    return "Verified Doctor";
}
