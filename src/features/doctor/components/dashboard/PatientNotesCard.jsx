import { AlignLeft } from "lucide-react";

export default function PatientNotesCard({ notes }) {
    return (
        <div className="min-h-[160px] rounded-3xl bg-slate-100 p-5 sm:min-h-[190px] sm:p-7">
            <div className="flex items-center gap-3 mb-5">
                <AlignLeft size={22} className="text-slate-800" />
                <h3 className="text-lg font-extrabold text-slate-900">
                    Patient Notes
                </h3>
            </div>

            <p className="text-base leading-relaxed text-slate-600">
                "{notes || "No patient notes available."}"
            </p>
        </div>
    );
}
