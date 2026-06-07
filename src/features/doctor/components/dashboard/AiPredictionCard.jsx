import { BrainCircuit } from "lucide-react";
import PredictionBar from "./PredictionBar";
import { toAssetUrl } from "../../../../utils/assets";

export default function AiPredictionCard({ aiPrediction }) {
    const predictions = normalizePredictions(aiPrediction);
    const [primary, ...secondary] = predictions;
    const confidenceLabel = aiPrediction
        ? formatConfidence(aiPrediction?.confidence ?? primary?.percentage)
        : "HIGH CONFIDENCE";

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
                    {confidenceLabel}
                </span>
            </div>

            {aiPrediction?.gradcamUrl && (
                <div className="mb-6 overflow-hidden rounded-2xl border border-blue-100 bg-white">
                    <img
                        src={toAssetUrl(aiPrediction.gradcamUrl)}
                        alt="Grad-CAM heatmap"
                        className="h-40 w-full object-cover"
                    />
                    <div className="px-4 py-3 text-xs font-bold text-slate-500">
                        Grad-CAM heatmap reference
                    </div>
                </div>
            )}

            <PredictionBar
                label={primary?.label || "Melanocytic Nevus"}
                value={primary?.percentage ?? 0}
                color="blue"
                showBar
            />

            {secondary.length > 0 ? (
                secondary.map((item, index) => (
                    <PredictionBar
                        key={item.label}
                        label={item.label}
                        value={item.percentage}
                        color={index === secondary.length - 1 ? "red" : "slate"}
                    />
                ))
            ) : (
                <>
                    <PredictionBar label="Seborrheic Keratosis" value={0} color="slate" />
                    <PredictionBar label="Malignant Melanoma" value={0} color="red" />
                </>
            )}
        </div>
    );
}

function normalizePredictions(aiPrediction) {
    if (Array.isArray(aiPrediction?.predictions) && aiPrediction.predictions.length) {
        return aiPrediction.predictions;
    }

    const label = aiPrediction?.prediction || "Melanocytic Nevus";
    const confidence = Number(aiPrediction?.confidence);

    return [
        {
            label,
            percentage: Number.isFinite(confidence) ? Math.round(confidence * 100) : 0,
        },
    ];
}

function formatConfidence(value) {
    if (typeof value === "string") return value;

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return "HIGH CONFIDENCE";

    return `${numericValue <= 1 ? Math.round(numericValue * 100) : Math.round(numericValue)}% CONFIDENCE`;
}
