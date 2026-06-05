import { Mic, Paperclip } from "lucide-react";

export default function PhysicianObservationBox({ value, onChange, onSave, saving = false }) {
    return (
        <div>
            <div className="mb-4 flex items-center justify-between gap-4">
                <label className="block font-extrabold text-slate-900">
                    Physician Observations
                </label>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="text-sm font-extrabold text-blue-600 disabled:text-slate-400"
                >
                    {saving ? "Saving..." : "Save Observation"}
                </button>
            </div>

            <div className="relative">
                <textarea
                    value={value}
                    onChange={(event) => onChange?.(event.target.value)}
                    placeholder="Type your professional assessment here..."
                    className="w-full h-[120px] resize-none rounded-2xl bg-slate-100 px-5 py-5 pr-20 text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100"
                />

                <div className="absolute right-5 bottom-5 flex items-center gap-4 text-slate-600">
                </div>
            </div>
        </div>
    );
}
