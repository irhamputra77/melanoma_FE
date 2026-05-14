import profileDoctor from "../../../../assets/login_doctor_profile.png";
import { toAssetUrl } from "../../../../utils/assets";
import LesionThumbnail from "./LesionThumbnail";

export default function PatientDetailPanel({ evolutionData, loading = false }) {
    const patient = evolutionData?.patient;
    const scans = evolutionData?.evolution || [];

    return (
        <aside className="border-l border-slate-200 pl-8">
            <section>
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-sm font-extrabold uppercase tracking-[0.22em] text-slate-700">
                        Patient Detail
                    </h2>
                </div>

                <div className="flex items-center gap-5 rounded-2xl bg-white p-5 shadow-sm">
                    <img
                        src={profileDoctor}
                        alt={patient?.name || "Patient"}
                        className="h-14 w-14 rounded-full object-cover"
                    />
                    <div>
                        <p className="text-lg font-extrabold text-slate-900">{patient?.name || "-"}</p>
                        <p className="text-sm text-slate-500">
                            {patient ? `${patient.age} y.o. - ${patient.gender}` : "Select a patient"}
                        </p>
                    </div>
                </div>
            </section>

            <section className="mt-10">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-sm font-extrabold uppercase tracking-[0.22em] text-slate-700">
                        Lesion Evolution
                    </h2>
                    <span className="rounded-md bg-blue-100 px-3 py-2 text-[11px] font-extrabold text-blue-700">
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
                    <div className="relative pl-10">
                        <span className="absolute bottom-0 left-[3px] top-2 w-0.5 bg-blue-600" />
                        {scans.map((scan, index) => (
                            <TimelineScan
                                key={scan.scanId}
                                scan={scan}
                                muted={index > 0}
                            />
                        ))}
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
        <div className="relative pb-9">
            <span className="absolute -left-10 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" />

            <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-xs font-extrabold uppercase text-slate-700">{month}</p>
                {status && (
                    <p className={`text-[11px] font-extrabold ${scan.growthPercentage ? "text-red-600" : "text-slate-400"}`}>
                        {status}
                    </p>
                )}
            </div>

            <div className={`rounded-xl bg-white p-3 shadow-sm ${muted ? "opacity-50" : "border border-red-200"}`}>
                {scan.imageUrl ? (
                    <img
                        src={toAssetUrl(scan.imageUrl)}
                        alt={scan.scanId}
                        className="h-[285px] w-full rounded-xl object-cover"
                    />
                ) : (
                    <LesionThumbnail variant={muted ? "pale" : "brown"} size="large" muted={muted} />
                )}
                {scan.note && (
                    <p className="mt-2 text-xs italic leading-relaxed text-slate-600">
                        "{scan.note}"
                    </p>
                )}
            </div>
        </div>
    );
}
