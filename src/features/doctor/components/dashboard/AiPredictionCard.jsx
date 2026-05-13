import { BrainCircuit } from "lucide-react";
import PredictionBar from "./PredictionBar";

export default function AiPredictionCard() {
    return (
        <div className="bg-[#f4f8fd] border border-blue-100 rounded-[28px] p-7">
            <div className="flex items-start justify-between gap-4 mb-7">
                <div className="flex items-start gap-3">
                    <div className="text-blue-600">
                        <BrainCircuit size={28} strokeWidth={2.5} />
                    </div>

                    <p className="text-lg leading-tight font-extrabold text-blue-600">
                        AI Clinical <br /> Prediction
                    </p>
                </div>

                <span className="whitespace-nowrap rounded-full bg-blue-600 px-4 py-1.5 text-[10px] font-extrabold leading-none text-white">
                    HIGH CONFIDENCE
                </span>
            </div>

            <PredictionBar label="Melanocytic Nevus" value={88} color="blue" showBar />

            <PredictionBar label="Seborrheic Keratosis" value={7} color="slate" />

            <PredictionBar label="Malignant Melanoma" value={5} color="red" />
        </div>
    );
}
