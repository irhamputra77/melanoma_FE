import { useEffect, useState } from "react";
import {
    Bell,
    ChevronDown,
    Mail,
    Shield,
    ShieldCheck,
    Sparkles,
    UserCircle,
} from "lucide-react";
import NotificationRow from "../../admin/components/settings/NotificationRow";
import SettingsSection from "../../admin/components/settings/SettingsSection";
import ToggleSwitch from "../../admin/components/settings/ToggleSwitch";
import {
    getDoctorSettings,
    updateDoctorAccountSettings,
    updateDoctorNotificationSettings,
    updateDoctorPreferences,
    updateDoctorPrivacySettings,
    updateDoctorTwoFactor,
} from "../services/doctorService";

const defaultSettings = {
    account: {
        email: "",
        twoFactorEnabled: false,
    },
    notifications: {
        emailNotifications: true,
        verificationAlerts: true,
    },
    privacy: {
        dataVisibility: "restricted_clinical_team_only",
    },
    preferences: {
        language: "English (US)",
    },
};

export default function DoctorSettingsPage() {
    const [settings, setSettings] = useState(defaultSettings);
    const [initialSettings, setInitialSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        let isMounted = true;

        getDoctorSettings()
            .then((data) => {
                if (!isMounted) return;

                const nextSettings = toDoctorSettings(data);
                setSettings(nextSettings);
                setInitialSettings(nextSettings);
            })
            .catch((error) => {
                if (isMounted) {
                    setError(error.response?.data?.message || "Failed to fetch doctor settings.");
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

    const updateSettings = (section, value) => {
        setSettings((current) => ({
            ...current,
            [section]: {
                ...current[section],
                ...value,
            },
        }));
        setError("");
        setSuccess("");
    };

    const toggleTwoFactor = async () => {
        const enabled = !settings.account.twoFactorEnabled;
        const previous = settings.account.twoFactorEnabled;

        updateSettings("account", { twoFactorEnabled: enabled });
        setSaving("2fa");

        try {
            await updateDoctorTwoFactor(enabled);
        } catch (error) {
            updateSettings("account", { twoFactorEnabled: previous });
            setError(error.response?.data?.message || "Failed to update two-factor setting.");
        } finally {
            setSaving("");
        }
    };

    const toggleNotification = async (key) => {
        const previousNotifications = settings.notifications;
        const nextNotifications = {
            ...settings.notifications,
            [key]: !settings.notifications[key],
        };

        updateSettings("notifications", nextNotifications);
        setSaving("notifications");

        try {
            await updateDoctorNotificationSettings(nextNotifications);
        } catch (error) {
            updateSettings("notifications", previousNotifications);
            setError(error.response?.data?.message || "Failed to update notification settings.");
        } finally {
            setSaving("");
        }
    };

    const discardChanges = () => {
        setSettings(initialSettings);
        setError("");
        setSuccess("");
    };

    const savePreferences = async () => {
        setSaving("all");
        setError("");
        setSuccess("");

        try {
            await Promise.all([
                updateDoctorAccountSettings({ email: settings.account.email }),
                updateDoctorPrivacySettings(settings.privacy),
                updateDoctorPreferences(settings.preferences),
            ]);

            const nextSettings = toDoctorSettings(settings);
            setSettings(nextSettings);
            setInitialSettings(nextSettings);
            setSuccess("Preferences saved.");
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save preferences.");
        } finally {
            setSaving("");
        }
    };

    return (
        <div className="mx-auto max-w-6xl pb-10">
            <div className="mb-11">
                <h1 className="text-[40px] font-extrabold leading-tight text-slate-900">
                    Settings
                </h1>
                <p className="mt-2 text-xl text-slate-600">
                    Manage your clinic preferences and security protocols.
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

            <div className="space-y-8">
                <SettingsSection icon={<UserCircle size={24} />} title="Account Settings">
                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                        <div className="space-y-5">
                            <Field
                                label="Email Address"
                                value={loading ? "Loading..." : settings.account.email}
                                onChange={(value) => updateSettings("account", { email: value })}
                                readOnly={loading}
                            />

                            <div>
                                <label className="mb-2 block text-sm font-extrabold text-slate-600">
                                    Password
                                </label>
                                <div className="flex h-14 items-center justify-between rounded-xl bg-white px-4">
                                    <span className="text-slate-900">********</span>
                                    <button
                                        type="button"
                                        className="text-sm font-bold text-blue-600"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex min-h-40 items-center justify-between gap-6 rounded-2xl bg-white px-7">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900">
                                    Two-Factor Authentication
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Enhanced security for clinical data access.
                                </p>
                            </div>

                            <ToggleSwitch
                                checked={settings.account.twoFactorEnabled}
                                onClick={toggleTwoFactor}
                                disabled={loading || saving === "2fa"}
                            />
                        </div>
                    </div>
                </SettingsSection>

                <SettingsSection icon={<Bell size={24} />} title="Notification Settings">
                    <div className="space-y-4">
                        <NotificationRow
                            icon={<Mail size={21} />}
                            title="Email Notifications"
                            description="Weekly summaries and system updates."
                            enabled={settings.notifications.emailNotifications}
                            onToggle={() => toggleNotification("emailNotifications")}
                            disabled={loading || saving === "notifications"}
                        />
                        <NotificationRow
                            icon={<ShieldCheck size={21} />}
                            title="Verification Alerts"
                            description="Instant alerts for new high-confidence detections."
                            enabled={settings.notifications.verificationAlerts}
                            onToggle={() => toggleNotification("verificationAlerts")}
                            disabled={loading || saving === "notifications"}
                        />
                    </div>
                </SettingsSection>

                <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                    <SettingsSection icon={<Shield size={22} />} title="Privacy Settings">
                        <div className="rounded-2xl bg-white p-4">
                            <label className="mb-2 block text-sm font-extrabold text-slate-900">
                                Data Visibility
                            </label>
                            <div className="relative">
                                <select
                                    value={settings.privacy.dataVisibility}
                                    onChange={(event) => updateSettings("privacy", { dataVisibility: event.target.value })}
                                    disabled={loading}
                                    className="flex h-11 w-full appearance-none items-center justify-between rounded-lg bg-slate-100 px-4 text-sm text-slate-900 outline-none disabled:text-slate-500"
                                >
                                    <option value="restricted_clinical_team_only">Restricted (Clinical Team Only)</option>
                                    <option value="restricted_self_only">Restricted (Self Only)</option>
                                    <option value="shared_with_clinic">Shared With Clinic</option>
                                </select>
                                <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            </div>
                        </div>

                        <p className="mt-5 text-sm italic text-slate-500">
                            Data is encrypted using AES-256 standards.
                        </p>
                    </SettingsSection>

                    <SettingsSection icon={<Sparkles size={22} />} title="System Preferences">
                        <div className="flex items-center justify-between gap-6">
                            <p className="text-sm font-extrabold text-slate-900">Language</p>
                            <button
                                type="button"
                                onClick={() => updateSettings("preferences", { language: "English (US)" })}
                                className="text-sm font-extrabold text-blue-600"
                            >
                                {settings.preferences.language}
                            </button>
                        </div>
                    </SettingsSection>
                </div>

                <div className="flex items-center justify-end gap-12 pt-2">
                    <button
                        type="button"
                        onClick={discardChanges}
                        disabled={loading || Boolean(saving)}
                        className="text-base font-extrabold text-blue-600 disabled:text-slate-400"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="button"
                        onClick={savePreferences}
                        disabled={loading || saving === "all"}
                        className="h-14 rounded-xl bg-blue-600 px-10 text-base font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:bg-blue-300"
                    >
                        {saving === "all" ? "Saving..." : "Save Preferences"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, readOnly = false }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-extrabold text-slate-600">
                {label}
            </label>
            <input
                value={value || ""}
                onChange={(event) => onChange?.(event.target.value)}
                readOnly={readOnly}
                className="flex h-14 w-full items-center rounded-xl bg-white px-4 text-slate-900 outline-none read-only:text-slate-500"
            />
        </div>
    );
}

function toDoctorSettings(data) {
    return {
        account: {
            email: data?.account?.email ?? defaultSettings.account.email,
            twoFactorEnabled: data?.account?.twoFactorEnabled ?? defaultSettings.account.twoFactorEnabled,
        },
        notifications: {
            emailNotifications: data?.notifications?.emailNotifications ?? defaultSettings.notifications.emailNotifications,
            verificationAlerts: data?.notifications?.verificationAlerts ?? defaultSettings.notifications.verificationAlerts,
        },
        privacy: {
            dataVisibility: data?.privacy?.dataVisibility ?? defaultSettings.privacy.dataVisibility,
        },
        preferences: {
            language: data?.preferences?.language ?? defaultSettings.preferences.language,
        },
    };
}
