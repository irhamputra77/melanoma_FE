import { Mic, Paperclip } from "lucide-react";

export default function PhysicianObservationBox() {
    return (
        <div>
            <label className="block font-extrabold text-slate-900 mb-4">
                Physician Observations
            </label>

            <div className="relative">
                <textarea
                    placeholder="Type your professional assessment here..."
                    className="w-full h-[120px] resize-none rounded-2xl bg-slate-100 px-5 py-5 pr-20 text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100"
                />

                <div className="absolute right-5 bottom-5 flex items-center gap-4 text-slate-600">
                    <button className="hover:text-blue-600 transition">
                        <Mic size={20} />
                    </button>

                    <button className="hover:text-blue-600 transition">
                        <Paperclip size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}