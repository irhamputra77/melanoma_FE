import { useEffect, useState } from "react";
import {
    Bell,
    ChevronDown,
    ClipboardCheck,
    Database,
    SlidersHorizontal,
    UserCircle,
} from "lucide-react";
import NotificationRow from "../components/settings/NotificationRow";
import SettingsSection from "../components/settings/SettingsSection";
import ToggleSwitch from "../components/settings/ToggleSwitch";
import { getEmailValidationError, normalizeEmail } from "../../../utils/emailValidation";
import { setMaintenanceMode } from "../../../utils/maintenanceMode";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
    saveAdminOperationsSettings,
    saveAdminPreferences,
} from "../../../utils/adminSettings";
import {
    cleanupAdminAuditLogs,
    cleanupAdminSystemLogs,
    getAdminSettings,
    updateAdminAccountSettings,
    updateAdminNotificationSettings,
    updateAdminOperationsSettings,
    updateAdminPreferences,
} from "../services/adminService";

const defaultSettings = {
    account: {
        email: "",
    },
    notifications: {
        doctorApprovalAlerts: true,
        clinicRequestAlerts: true,
        systemAlerts: true,
    },
    operations: {
        defaultPageSize: 8,
        auditLogRetentionDays: 180,
        maintenanceMode: false,
        deleteConfirmationRequired: true,
    },
    preferences: {
        language: "English (US)",
        timezone: "Asia/Jakarta",
    },
};

export default function SystemSettingsDoctorPage() {
    const { changeLanguage = () => {} } = useLanguage() || {};
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

        getAdminSettings()
            .then((data) => {
                if (!isMounted) return;

                const normalized = normalizeSettings(data);
                setSettings(normalized);
                setInitialSettings(normalized);
                saveAdminOperationsSettings(normalized.operations);
                saveAdminPreferences(normalized.preferences);
                changeLanguage(normalized.preferences.language);
            })
            .catch((error) => {
                if (isMounted) {
                    setError(error.response?.data?.message || "Failed to fetch admin settings.");
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

    const toggleNotification = (key) => {
        updateSettings("notifications", {
            [key]: !settings.notifications[key],
        });
    };

    const toggleOperation = (key) => {
        updateSettings("operations", {
            [key]: !settings.operations[key],
        });
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

        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters.");
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
            await updateAdminAccountSettings({ currentPassword, newPassword });
            resetPasswordForm();
            setIsChangingPassword(false);
            setSuccess("Password updated.");
        } catch (error) {
            setError(error.response?.data?.message || "Failed to update password.");
        } finally {
            setSaving("");
        }
    };

    const saveSettings = async () => {
        const emailError = getEmailValidationError(settings.account.email);
        if (emailError) {
            setError(emailError);
            setSuccess("");
            return;
        }

        const normalizedEmail = normalizeEmail(settings.account.email);
        const nextSettings = normalizeSettings({
            ...settings,
            account: { ...settings.account, email: normalizedEmail },
        });

        setSaving("all");
        setError("");
        setSuccess("");

        try {
            if (hasChanged(nextSettings.account, initialSettings.account)) {
                await updateAdminAccountSettings({ email: normalizedEmail });
            }
            if (hasChanged(nextSettings.notifications, initialSettings.notifications)) {
                await updateAdminNotificationSettings(nextSettings.notifications);
            }
            if (hasChanged(nextSettings.operations, initialSettings.operations)) {
                await updateAdminOperationsSettings(nextSettings.operations);
            }
            if (hasChanged(nextSettings.preferences, initialSettings.preferences)) {
                await updateAdminPreferences(nextSettings.preferences);
            }

            setSettings(nextSettings);
            setInitialSettings(nextSettings);
            setMaintenanceMode(nextSettings.operations.maintenanceMode);
            saveAdminOperationsSettings(nextSettings.operations);
            saveAdminPreferences(nextSettings.preferences);
            changeLanguage(nextSettings.preferences.language);
            setSuccess("Admin settings saved.");
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save admin settings.");
        } finally {
            setSaving("");
        }
    };

    const runAuditCleanup = async () => {
        setSaving("audit-cleanup");
        setError("");
        setSuccess("");

        try {
            const result = await cleanupAdminAuditLogs();
            const deleted = result?.deletedCount ?? result?.count ?? 0;
            setSuccess(`Audit log cleanup selesai. ${deleted} record dihapus.`);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to cleanup audit logs.");
        } finally {
            setSaving("");
        }
    };

    const runSystemLogCleanup = async () => {
        setSaving("system-log-cleanup");
        setError("");
        setSuccess("");

        try {
            const result = await cleanupAdminSystemLogs(settings.operations.auditLogRetentionDays);
            const deleted = result?.deletedCount ?? result?.count ?? 0;
            setSuccess(`System log cleanup selesai. ${deleted} record dihapus.`);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to cleanup system logs.");
        } finally {
            setSaving("");
        }
    };

    return (
        <div className="max-w-6xl pb-10">
            <div className="mb-11">
                <h1 className="text-[40px] font-extrabold leading-tight text-slate-900">
                    Admin Settings
                </h1>
                <p className="mt-2 max-w-3xl text-xl text-slate-600">
                    Manage admin account access, operational defaults, approval alerts, and platform control settings.
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
                <SettingsSection icon={<UserCircle size={24} />} title="Account Access">
                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                        <div className="space-y-5">
                            <Field
                                id="admin-email"
                                label="Admin Email Address"
                                value={loading ? "Loading..." : settings.account.email}
                                readOnly={loading}
                                type="email"
                                maxLength={254}
                                onChange={(value) => updateSettings("account", { email: value })}
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
                        </div>

                        {isChangingPassword && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-5">
                                    <h3 className="text-base font-extrabold text-slate-900">Change Password</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Use at least 6 characters for the new password.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <Field
                                        id="admin-current-password"
                                        label="Current Password"
                                        type="password"
                                        autoComplete="current-password"
                                        value={passwordForm.currentPassword}
                                        onChange={(value) => updatePasswordForm("currentPassword", value)}
                                        inputClassName="border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white"
                                    />
                                    <Field
                                        id="admin-new-password"
                                        label="New Password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={passwordForm.newPassword}
                                        onChange={(value) => updatePasswordForm("newPassword", value)}
                                        inputClassName="border border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white"
                                    />
                                    <Field
                                        id="admin-confirm-password"
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
                </SettingsSection>

                <SettingsSection icon={<Bell size={24} />} title="Admin Notifications">
                    <div className="space-y-4">
                        <NotificationRow
                            icon={<ClipboardCheck size={21} />}
                            title="Doctor Approval Queue"
                            description="Notify admins when new doctors need review."
                            enabled={settings.notifications.doctorApprovalAlerts}
                            onToggle={() => toggleNotification("doctorApprovalAlerts")}
                            disabled={loading || Boolean(saving)}
                        />
                        <NotificationRow
                            icon={<ClipboardCheck size={21} />}
                            title="Clinic Request Queue"
                            description="Notify admins when clinics are waiting for approval."
                            enabled={settings.notifications.clinicRequestAlerts}
                            onToggle={() => toggleNotification("clinicRequestAlerts")}
                            disabled={loading || Boolean(saving)}
                        />
                        <NotificationRow
                            icon={<Database size={21} />}
                            title="Critical System Alerts"
                            description="Surface failed jobs, abnormal API errors, and data sync issues."
                            enabled={settings.notifications.systemAlerts}
                            onToggle={() => toggleNotification("systemAlerts")}
                            disabled={loading || Boolean(saving)}
                        />
                    </div>
                </SettingsSection>

                <SettingsSection icon={<SlidersHorizontal size={24} />} title="Operational Defaults">
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        <SelectField
                            id="admin-default-page-size"
                            label="Default Table Page Size"
                            value={String(settings.operations.defaultPageSize)}
                            disabled={loading}
                            options={[
                                { value: "8", label: "8 rows" },
                                { value: "16", label: "16 rows" },
                                { value: "24", label: "24 rows" },
                                { value: "32", label: "32 rows" },
                            ]}
                            onChange={(value) => updateSettings("operations", { defaultPageSize: Number(value) })}
                        />
                        <SelectField
                            id="admin-audit-log-retention"
                            label="Audit Log Retention"
                            value={String(settings.operations.auditLogRetentionDays)}
                            disabled={loading}
                            options={[
                                { value: "30", label: "30 days" },
                                { value: "90", label: "90 days" },
                                { value: "180", label: "180 days" },
                                { value: "365", label: "365 days" },
                            ]}
                            onChange={(value) => updateSettings("operations", { auditLogRetentionDays: Number(value) })}
                        />
                        <div className="rounded-2xl bg-white p-5">
                            <p className="text-base font-extrabold text-slate-950">Audit Log Cleanup</p>
                            <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-600">
                                Remove expired audit log records using the selected retention window.
                            </p>
                            <button
                                type="button"
                                onClick={runAuditCleanup}
                                disabled={loading || Boolean(saving)}
                                className="mt-4 h-11 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white shadow-sm shadow-slate-900/20 disabled:bg-slate-300"
                            >
                                {saving === "audit-cleanup" ? "Cleaning..." : "Run Audit Cleanup"}
                            </button>
                        </div>
                        <div className="rounded-2xl bg-white p-5">
                            <p className="text-base font-extrabold text-slate-950">System Log Cleanup</p>
                            <p className="mt-1 max-w-md text-sm leading-relaxed text-slate-600">
                                Remove expired system log records using the selected retention window.
                            </p>
                            <button
                                type="button"
                                onClick={runSystemLogCleanup}
                                disabled={loading || Boolean(saving)}
                                className="mt-4 h-11 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white shadow-sm shadow-slate-900/20 disabled:bg-slate-300"
                            >
                                {saving === "system-log-cleanup" ? "Cleaning..." : "Run System Cleanup"}
                            </button>
                        </div>
                        <TogglePanel
                            title="Maintenance Mode"
                            description="Temporarily block non-admin access while operational work is in progress."
                            checked={settings.operations.maintenanceMode}
                            disabled={loading || Boolean(saving)}
                            onToggle={() => toggleOperation("maintenanceMode")}
                        />
                        <TogglePanel
                            title="Require Delete Confirmation"
                            description="Keep strict confirmation prompts for destructive admin actions."
                            checked={settings.operations.deleteConfirmationRequired}
                            disabled={loading || Boolean(saving)}
                            onToggle={() => toggleOperation("deleteConfirmationRequired")}
                        />
                    </div>
                </SettingsSection>

                <SettingsSection icon={<SlidersHorizontal size={22} />} title="Workspace Preferences">
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        <SelectField
                            id="admin-language"
                            label="Language"
                            value={settings.preferences.language}
                            disabled={loading}
                            options={[
                                { value: "English (US)", label: "English (US)" },
                                { value: "Bahasa Indonesia", label: "Bahasa Indonesia" },
                            ]}
                            onChange={(value) => updateSettings("preferences", { language: value })}
                        />
                        <SelectField
                            id="admin-timezone"
                            label="Timezone"
                            value={settings.preferences.timezone}
                            disabled={loading}
                            options={[
                                { value: "Asia/Jakarta", label: "Asia/Jakarta" },
                                { value: "Asia/Makassar", label: "Asia/Makassar" },
                                { value: "Asia/Jayapura", label: "Asia/Jayapura" },
                                { value: "UTC", label: "UTC" },
                            ]}
                            onChange={(value) => updateSettings("preferences", { timezone: value })}
                        />
                    </div>
                </SettingsSection>

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
                        onClick={saveSettings}
                        disabled={loading || saving === "all"}
                        className="h-14 rounded-xl bg-blue-600 px-10 text-base font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:bg-blue-300"
                    >
                        {saving === "all" ? "Saving..." : "Save Admin Settings"}
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
            <label htmlFor={id} className="mb-2 block text-sm font-extrabold text-slate-600">{label}</label>
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

function SelectField({ id, label, value, options, disabled, onChange }) {
    return (
        <label htmlFor={id} className="block rounded-2xl bg-white p-4">
            <span className="mb-2 block text-sm font-extrabold text-slate-900">{label}</span>
            <span className="relative block">
                <select
                    id={id}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={disabled}
                    className="flex h-11 w-full appearance-none items-center justify-between rounded-lg bg-slate-100 px-4 text-sm text-slate-900 outline-none disabled:text-slate-500"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
            </span>
        </label>
    );
}

function TogglePanel({ title, description, checked, disabled, onToggle }) {
    return (
        <div className="flex min-h-32 items-center justify-between gap-6 rounded-2xl bg-white p-5">
            <div>
                <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
            </div>
            <ToggleSwitch checked={checked} onClick={onToggle} disabled={disabled} ariaLabel={title} />
        </div>
    );
}

function hasChanged(nextValue, previousValue) {
    return JSON.stringify(nextValue) !== JSON.stringify(previousValue);
}

function normalizeSettings(data) {
    const account = data?.account || {};
    const notifications = data?.notifications || {};
    const operations = data?.operations || {};
    const preferences = data?.preferences || {};

    return {
        account: {
            ...defaultSettings.account,
            email: account.email || data?.email || "",
        },
        notifications: {
            ...defaultSettings.notifications,
            doctorApprovalAlerts: Boolean(notifications.doctorApprovalAlerts ?? data?.doctorApprovalAlerts ?? defaultSettings.notifications.doctorApprovalAlerts),
            clinicRequestAlerts: Boolean(notifications.clinicRequestAlerts ?? data?.clinicRequestAlerts ?? defaultSettings.notifications.clinicRequestAlerts),
            systemAlerts: Boolean(notifications.systemAlerts ?? data?.systemAlerts ?? defaultSettings.notifications.systemAlerts),
        },
        operations: {
            ...defaultSettings.operations,
            defaultPageSize: Number(operations.defaultPageSize ?? data?.defaultPageSize ?? defaultSettings.operations.defaultPageSize),
            auditLogRetentionDays: Number(operations.auditLogRetentionDays ?? data?.auditLogRetentionDays ?? defaultSettings.operations.auditLogRetentionDays),
            maintenanceMode: Boolean(operations.maintenanceMode ?? data?.maintenanceMode ?? defaultSettings.operations.maintenanceMode),
            deleteConfirmationRequired: Boolean(operations.deleteConfirmationRequired ?? data?.deleteConfirmationRequired ?? defaultSettings.operations.deleteConfirmationRequired),
        },
        preferences: {
            ...defaultSettings.preferences,
            language: preferences.language || data?.language || defaultSettings.preferences.language,
            timezone: preferences.timezone || data?.timezone || defaultSettings.preferences.timezone,
        },
    };
}
