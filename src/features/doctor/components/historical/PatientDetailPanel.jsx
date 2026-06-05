import profileDoctor from "../../../../assets/login_doctor_profile.png";
import { toAssetUrl } from "../../../../utils/assets";
import LesionThumbnail from "./LesionThumbnail";

export default function PatientDetailPanel({ evolutionData, loading = false }) {
    const patient = evolutionData?.patient;
    const scans = evolutionData?.evolution || [];

    return (
        <aside className="flex h-full min-h-0 flex-col border-l border-slate-200 pl-6">
            <section className="shrink-0">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-700">
                        Patient Detail
                    </h2>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                    <img
                        src={profileDoctor}
                        alt={patient?.name || "Patient"}
                        className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                        <p className="text-base font-extrabold leading-tight text-slate-900">{patient?.name || "-"}</p>
                        <p className="text-xs text-slate-500">
                            {patient ? `${patient.age} y.o. - ${patient.gender}` : "Select a patient"}
                        </p>
                    </div>
                </div>
            </section>

            <section className="mt-6 flex min-h-0 flex-1 flex-col">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-700">
                        Lesion Evolution
                    </h2>
                    <span className="rounded-md bg-blue-100 px-3 py-1.5 text-[10px] font-extrabold text-blue-700">
                        {loading ? "..." : `${scans.length} SCANS FOUND`}
                    </span>
                </div>

                {loading && (
                    <div className="rounded-xl bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">
                        Loading lesion evolution...
                    </div>
                )}

                {!loading && scans.length === 0 && (
                    <div className="rounded-xl bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">
                        No evolution data.
                    </div>
                )}

                {!loading && scans.length > 0 && (
                    <div className="relative min-h-[300px] flex-1 overflow-hidden">
                        <div className="h-full overflow-y-auto pr-3">
                            <div className="relative pl-8">
                                <span className="absolute bottom-0 left-[3px] top-2 w-0.5 bg-blue-600" />
                                {scans.map((scan, index) => (
                                    <TimelineScan
                                        key={scan.scanId}
                                        scan={scan}
                                        muted={index > 0}
                                    />
                                ))}
                            </div>
                        </div>
                        <span className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-gradient-to-b from-slate-100 to-transparent" />
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-100 to-transparent" />
                    </div>
                )}
            </section>
        </aside>
    );
}

function TimelineScan({ scan, muted }) {
    const month = scan.date
        ? new Date(scan.date).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        })
        : "-";
    const status = scan.growthPercentage
        ? `+${scan.growthPercentage}% Area Growth`
        : scan.note;

    return (
        <div className="relative pb-5">
            <span className="absolute -left-8 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" />

            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-extrabold uppercase text-slate-700">{month}</p>
                {status && (
                    <p className={`text-[10px] font-extrabold ${scan.growthPercentage ? "text-red-600" : "text-slate-400"}`}>
                        {status}
                    </p>
                )}
            </div>

            <div className={`rounded-xl bg-white p-2.5 shadow-sm ${muted ? "opacity-50" : "border border-red-200"}`}>
                {scan.imageUrl ? (
                    <img
                        src={toAssetUrl(scan.imageUrl)}
                        alt={scan.scanId}
                        className="h-[190px] w-full rounded-lg object-cover"
                    />
                ) : (
                    <LesionThumbnail variant={muted ? "pale" : "brown"} size="large" muted={muted} />
                )}
                {scan.note && (
                    <p className="mt-2 text-[11px] italic leading-relaxed text-slate-600">
                        "{scan.note}"
                    </p>
                )}
            </div>
        </div>
    );
}
