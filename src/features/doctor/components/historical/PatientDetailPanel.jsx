import profileDoctor from "../../../../assets/login_doctor_profile.png";
import LesionThumbnail from "./LesionThumbnail";

export default function PatientDetailPanel() {
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
                        alt="Sarah Johnson"
                        className="h-14 w-14 rounded-full object-cover"
                    />
                    <div>
                        <p className="text-lg font-extrabold text-slate-900">Sarah Johnson</p>
                        <p className="text-sm text-slate-500">42 y.o. - Female</p>
                    </div>
                </div>
            </section>

            <section className="mt-10">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-sm font-extrabold uppercase tracking-[0.22em] text-slate-700">
                        Lesion Evolution
                    </h2>
                    <span className="rounded-md bg-blue-100 px-3 py-2 text-[11px] font-extrabold text-blue-700">
                        3 SCANS FOUND
                    </span>
                </div>

                <div className="relative pl-10">
                    <span className="absolute bottom-0 left-[3px] top-2 w-0.5 bg-blue-600" />
                    <TimelineScan
                        month="October 2023"
                        status="+12% Area Growth"
                        statusClass="text-red-600"
                        variant="brown"
                        note="Note: High vascularity detected at periphery."
                    />
                    <TimelineScan month="August 2023" variant="pale" muted />
                    <TimelineScan month="June 2023" status="Baseline Scan" variant="pale" muted />
                </div>
            </section>
        </aside>
    );
}

function TimelineScan({ month, status, statusClass = "text-slate-400", variant, note, muted }) {
    return (
        <div className="relative pb-9">
            <span className="absolute -left-10 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" />

            <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-xs font-extrabold uppercase text-slate-700">{month}</p>
                {status && (
                    <p className={`text-[11px] font-extrabold ${statusClass}`}>{status}</p>
                )}
            </div>

            <div className={`rounded-xl bg-white p-3 shadow-sm ${muted ? "opacity-50" : "border border-red-200"}`}>
                <LesionThumbnail variant={variant} size="large" muted={muted} />
                {note && (
                    <p className="mt-2 text-xs italic leading-relaxed text-slate-600">
                        "{note}"
                    </p>
                )}
            </div>
        </div>
    );
}
