import { toAssetUrl } from "../../../../utils/assets";

export default function AssignedCaseCard({ item, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative w-full min-h-[100px] overflow-hidden rounded-2xl bg-white px-5 py-4 text-left transition hover:shadow-md ${active ? "shadow-sm" : ""
                }`}
        >
            {active && (
                <span className="absolute inset-y-0 left-0 w-1 bg-blue-600" />
            )}

            <div className="flex h-full flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 flex items-center justify-center text-xl">
                            {item.avatarUrl ? (
                                <img
                                    src={toAssetUrl(item.avatarUrl)}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                item.avatar || initialsFromName(item.name)
                            )}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold leading-tight text-slate-900">
                                {item.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">ID: {item.id}</p>
                        </div>
                    </div>

                    {item.urgent && (
                        <span className="mt-1 shrink-0 rounded-lg bg-red-100 px-3 py-1 text-[10px] font-extrabold leading-none text-red-600">
                            URGENT
                        </span>
                    )}
                </div>

                <p className="text-xs text-slate-500">{item.time}</p>
            </div>
        </button>
    );
}

function initialsFromName(name = "") {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}
