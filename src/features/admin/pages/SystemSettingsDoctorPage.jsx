import {
    Bell,
    ChevronDown,
    Mail,
    Shield,
    ShieldCheck,
    Sparkles,
    UserCircle,
} from "lucide-react";
import NotificationRow from "../components/settings/NotificationRow";
import SettingsSection from "../components/settings/SettingsSection";
import ToggleSwitch from "../components/settings/ToggleSwitch";

export default function SystemSettingsDoctorPage() {
    return (
        <div className="max-w-6xl">
            <div className="mb-11">
                <h1 className="text-[40px] font-extrabold leading-tight text-slate-900">
                    Settings
                </h1>
                <p className="mt-2 text-xl text-slate-600">
                    Manage your clinic preferences and security protocols.
                </p>
            </div>

            <div className="space-y-8">
                <SettingsSection
                    icon={<UserCircle size={24} />}
                    title="Account Settings"
                >
                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                        <div className="space-y-5">
                            <Field label="Email Address" value="aryojaty@icloud.com" />

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

                            <ToggleSwitch checked />
                        </div>
                    </div>
                </SettingsSection>

                <SettingsSection icon={<Bell size={24} />} title="Notification Settings">
                    <div className="space-y-4">
                        <NotificationRow
                            icon={<Mail size={21} />}
                            title="Email Notifications"
                            description="Weekly summaries and system updates."
                            enabled
                        />
                        <NotificationRow
                            icon={<ShieldCheck size={21} />}
                            title="Verification Alerts"
                            description="Instant alerts for new high-confidence detections."
                        />
                    </div>
                </SettingsSection>

                <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                    <SettingsSection icon={<Shield size={22} />} title="Privacy Settings">
                        <div className="rounded-2xl bg-white p-4">
                            <label className="mb-2 block text-sm font-extrabold text-slate-900">
                                Data Visibility
                            </label>
                            <button
                                type="button"
                                className="flex h-11 w-full items-center justify-between rounded-lg bg-slate-100 px-4 text-sm text-slate-900"
                            >
                                Restricted (Clinical Team Only)
                                <ChevronDown size={18} className="text-slate-500" />
                            </button>
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
                                className="text-sm font-extrabold text-blue-600"
                            >
                                English (US)
                            </button>
                        </div>
                    </SettingsSection>
                </div>

                <div className="flex items-center justify-end gap-12 pt-2">
                    <button
                        type="button"
                        className="text-base font-extrabold text-blue-600"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="button"
                        className="h-14 rounded-xl bg-blue-600 px-10 text-base font-extrabold text-white shadow-lg shadow-blue-600/20"
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-extrabold text-slate-600">
                {label}
            </label>
            <div className="flex h-14 items-center rounded-xl bg-white px-4 text-slate-900">
                {value}
            </div>
        </div>
    );
}
