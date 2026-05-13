import { MoreVertical, Share2 } from "lucide-react";
import ClinicalImageCard from "./ClinicalImageCard";
import ClinicalImageMeta from "./ClinicalImageMeta";
import AiPredictionCard from "./AiPredictionCard";
import PatientNotesCard from "./PatientNotesCard";
import PhysicianObservationBox from "./PhysicianObservationBox";
import CaseActionButtons from "./CaseActionButtons";

export default function CaseExaminationPanel() {
    return (
        <div className="bg-white rounded-[32px] p-8 xl:p-10">
            <div className="flex items-start justify-between gap-6 mb-8">
                <div>
                    <p className="text-[10px] tracking-[0.38em] text-blue-600 font-extrabold mb-3">
                        CASE EXAMINATION
                    </p>

                    <h2 className="text-[30px] leading-tight font-extrabold text-slate-900">
                        Case #SK-9921: Sarah Johnson
                    </h2>

                    <p className="text-base text-slate-500 mt-2">
                        Dermatoscopy Analysis Request • Received April 22, 2026
                    </p>
                </div>

                <div className="flex items-center gap-5 text-slate-700">
                    <button className="hover:text-blue-600 transition">
                        <Share2 size={22} />
                    </button>

                    <button className="hover:text-blue-600 transition">
                        <MoreVertical size={24} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
                <div>
                    <ClinicalImageCard />
                    <ClinicalImageMeta />
                </div>

                <div className="space-y-6">
                    <AiPredictionCard />
                    <PatientNotesCard />
                </div>
            </div>

            <div className="mt-10">
                <PhysicianObservationBox />
            </div>

            <CaseActionButtons />
        </div>
    );
}