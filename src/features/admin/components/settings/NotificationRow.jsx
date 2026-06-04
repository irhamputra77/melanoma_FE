import ToggleSwitch from "./ToggleSwitch";

export default function NotificationRow({ icon, title, description, enabled, onToggle, disabled }) {
    return (
        <div className="flex items-center justify-between gap-6 rounded-xl bg-white px-4 py-4">
            <div className="flex items-center gap-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    {icon}
                </span>

                <div>
                    <p className="text-base font-extrabold text-slate-900">{title}</p>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
            </div>

            <ToggleSwitch checked={enabled} onClick={onToggle} disabled={disabled} ariaLabel={title} />
        </div>
    );
}
