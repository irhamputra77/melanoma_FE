import profileDoctor from "../../../../assets/login_doctor_profile.png";
import { toAssetUrl } from "../../../../utils/assets";
import LesionThumbnail from "./LesionThumbnail";

export default function PatientDetailPanel({ evolutionData, loading = false }) {
    const patient = evolutionData?.patient;
    const scans = evolutionData?.evolution || [];

    return (
        <aside className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <section>
                <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-700">
                        Patient Detail
                    </h2>
                    <div className="flex w-full min-w-0 items-center gap-4 rounded-2xl bg-slate-50 px-4 py-3 lg:w-auto">
                        <img
                            src={profileDoctor}
                            alt={patient?.name || "Patient"}
                            className="h-12 w-12 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                            <p className="truncate text-base font-extrabold leading-tight text-slate-900">{patient?.name || "-"}</p>
                            <p className="text-xs text-slate-500">
                                {patient ? `${patient.age} y.o. - ${patient.gender}` : "Select a patient"}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-5">
                <div className="mb-4 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
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
                    <div className="relative overflow-hidden">
                        <div className="dashboard-table-scroll overflow-x-auto pb-3">
                            <div className="relative flex min-w-max gap-5 px-1 pt-8">
                                <span className="absolute left-1 right-1 top-[14px] h-0.5 bg-blue-600" />
                                {scans.map((scan, index) => (
                                    <TimelineScan
                                        key={scan.scanId}
                                        scan={scan}
                                        muted={index > 0}
                                    />
                                ))}
                            </div>
                        </div>
                        <span className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent" />
                        <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
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
        <div className="relative w-[220px] shrink-0">
            <span className="absolute left-1/2 top-[-22px] h-3 w-3 -translate-x-1/2 rounded-full bg-blue-600 ring-4 ring-white" />

            <div className="mb-3 min-h-10">
                <p className="text-[11px] font-extrabold uppercase text-slate-700">{month}</p>
                {status && (
                    <p className={`mt-1 text-[10px] font-extrabold ${scan.growthPercentage ? "text-red-600" : "text-slate-400"}`}>
                        {status}
                    </p>
                )}
            </div>

            <div className={`rounded-xl bg-white p-2.5 shadow-sm ${muted ? "opacity-50" : "border border-red-200"}`}>
                {scan.imageUrl ? (
                    <img
                        src={toAssetUrl(scan.imageUrl)}
                        alt={scan.scanId}
                        className="h-[150px] w-full rounded-lg object-cover"
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
