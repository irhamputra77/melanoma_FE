import { useEffect, useState } from "react";
import {
    Bell,
    Mail,
    ShieldCheck,
    Sparkles,
    UserCircle,
} from "lucide-react";
import NotificationRow from "../../admin/components/settings/NotificationRow";
import SettingsSection from "../../admin/components/settings/SettingsSection";
import { getEmailValidationError, normalizeEmail } from "../../../utils/emailValidation";
import {
    getDoctorSettings,
    updateDoctorAccountSettings,
    updateDoctorNotificationSettings,
    updateDoctorPreferences,
} from "../services/doctorService";

const defaultSettings = {
    account: {
        email: "",
    },
    notifications: {
        emailNotifications: true,
        verificationAlerts: true,
    },
    preferences: {
        language: "English (US)",
    },
};

export default function DoctorSettingsPage() {
    const [settings, setSettings] = useState(defaultSettings);
    const [initialSettings, setInitialSettings] = useState(defaultSettings);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
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

    const updatePasswordForm = (field, value) => {
        setPasswordForm((current) => ({
            ...current,
            [field]: value,
        }));
        setError("");
        setSuccess("");
    };

    const resetPasswordForm = () => {
        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
    };

    const togglePasswordForm = () => {
        setIsChangingPassword((current) => !current);
        resetPasswordForm();
        setError("");
        setSuccess("");
    };

    const savePassword = async () => {
        const { currentPassword, newPassword, confirmPassword } = passwordForm;

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Please complete all password fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New password confirmation does not match.");
            return;
        }

        setSaving("password");
        setError("");
        setSuccess("");

        try {
            await updateDoctorAccountSettings({ currentPassword, newPassword });
            resetPasswordForm();
            setIsChangingPassword(false);
            setSuccess("Password updated.");
        } catch (error) {
            setError(error.response?.data?.message || "Failed to update password.");
        } finally {
            setSaving("");
        }
    };

    const savePreferences = async () => {
        const emailError = getEmailValidationError(settings.account.email);
        if (emailError) {
            setError(emailError);
            setSuccess("");
            return;
        }

        const normalizedEmail = normalizeEmail(settings.account.email);
        setSaving("all");
        setError("");
        setSuccess("");

        try {
            await Promise.all([
                updateDoctorAccountSettings({ email: normalizedEmail }),
                updateDoctorPreferences(settings.preferences),
            ]);

            const nextSettings = toDoctorSettings({
                ...settings,
                account: { ...settings.account, email: normalizedEmail },
            });
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
                    Manage your clinic account, notifications, and workspace preferences.
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
                                id="doctor-email"
                                label="Email Address"
                                value={loading ? "Loading..." : settings.account.email}
                                onChange={(value) => updateSettings("account", { email: value })}
                                readOnly={loading}
                                type="email"
                                maxLength={254}
                            />

                            <div>
                                <label className="mb-2 block text-sm font-extrabold text-slate-600">
                                    Password
                                </label>
                                <div className="flex h-14 items-center justify-between rounded-xl bg-white px-4">
                                    <span className="text-slate-900">********</span>
                                    <button
                                        type="button"
                                        onClick={togglePasswordForm}
                                        disabled={loading || saving === "password"}
                                        className="text-sm font-bold text-blue-600 disabled:text-slate-400"
                                    >
                                        {isChangingPassword ? "Cancel" : "Change"}
                                    </button>
                                </div>
                            </div>

                            {isChangingPassword && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="mb-5">
                                        <h3 className="text-base font-extrabold text-slate-900">Change Password</h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Backend password policy will be applied when you save.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <Field
                                            id="doctor-current-password"
                                            label="Current Password"
                                            type="password"
                                            autoComplete="current-password"
                                            value={passwordForm.currentPassword}
                                            onChange={(value) => updatePasswordForm("currentPassword", value)}
                                            inputClassName="border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white"
                                        />
                                        <Field
                                            id="doctor-new-password"
                                            label="New Password"
                                            type="password"
                                            autoComplete="new-password"
                                            value={passwordForm.newPassword}
                                            onChange={(value) => updatePasswordForm("newPassword", value)}
                                            inputClassName="border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white"
                                        />
                                        <Field
                                            id="doctor-confirm-password"
                                            label="Confirm New Password"
                                            type="password"
                                            autoComplete="new-password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(value) => updatePasswordForm("confirmPassword", value)}
                                            inputClassName="border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white"
                                        />
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={savePassword}
                                                disabled={saving === "password"}
                                                className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm shadow-blue-600/20 disabled:bg-blue-300"
                                            >
                                                {saving === "password" ? "Updating..." : "Update Password"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex min-h-40 flex-col justify-center rounded-2xl bg-white px-7">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900">
                                    Account Access
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Keep your email and password current so clinic communication remains reliable.
                                </p>
                            </div>
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

function Field({
    id,
    label,
    value,
    onChange,
    readOnly = false,
    type = "text",
    autoComplete,
    inputClassName = "",
    maxLength,
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-2 block text-sm font-extrabold text-slate-600">
                {label}
            </label>
            <input
                id={id}
                type={type}
                maxLength={maxLength}
                autoComplete={autoComplete}
                value={value || ""}
                onChange={(event) => onChange?.(event.target.value)}
                readOnly={readOnly}
                className={`flex h-14 w-full items-center rounded-xl bg-white px-4 text-slate-900 outline-none transition read-only:text-slate-500 ${inputClassName}`}
            />
        </div>
    );
}

function toDoctorSettings(data) {
    return {
        account: {
            email: data?.account?.email ?? defaultSettings.account.email,
        },
        notifications: {
            emailNotifications: data?.notifications?.emailNotifications ?? defaultSettings.notifications.emailNotifications,
            verificationAlerts: data?.notifications?.verificationAlerts ?? defaultSettings.notifications.verificationAlerts,
        },
        preferences: {
            language: data?.preferences?.language ?? defaultSettings.preferences.language,
        },
    };
}
