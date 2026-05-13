export default function PredictionBar({
    label,
    value,
    color = "blue",
    showBar = false,
}) {
    const valueColor = {
        blue: "text-slate-900",
        slate: "text-slate-500",
        red: "text-red-600",
    };

    if (showBar) {
        return (
            <div className="mb-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <p className="text-sm font-medium text-slate-900">
                        {label}
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900">
                        {value}%
                    </p>
                </div>

                <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${value}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4 last:mb-0">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className={`text-sm font-bold ${valueColor[color]}`}>
                    {value}%
                </p>
            </div>
        </div>
    );
}
