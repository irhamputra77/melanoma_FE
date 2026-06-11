import { useMemo, useState } from "react";
import { ImagePlus, PenLine } from "lucide-react";
import { getAssetUrlCandidates } from "../../../../utils/assets";

export default function ClinicalImageCard({ clinicalImage, onOpenAnnotation }) {
    const imageUrl = clinicalImage?.imageUrl || clinicalImage?.annotatedImageUrl;
    const hasAnnotation = Boolean(clinicalImage?.annotatedImageUrl);
    const canAnnotate = Boolean(clinicalImage?.imageUrl);
    const imageCandidates = useMemo(() => getAssetUrlCandidates(imageUrl), [imageUrl]);
    const [imageFallback, setImageFallback] = useState({ source: "", index: 0 });
    const imageIndex = imageFallback.source === imageUrl ? imageFallback.index : 0;

    if (imageUrl) {
        return (
            <div className="relative h-[266px] w-full overflow-hidden rounded-2xl bg-black">
                <img
                    src={imageCandidates[imageIndex]}
                    alt="Clinical lesion"
                    className="h-full w-full object-cover"
                    onError={() => {
                        setImageFallback((current) => ({
                            source: imageUrl,
                            index: Math.min((current.source === imageUrl ? current.index : 0) + 1, imageCandidates.length - 1),
                        }));
                    }}
                />

                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold text-slate-800 shadow-sm">
                        {hasAnnotation && !clinicalImage?.imageUrl ? "DOCTOR ANNOTATION" : "CLINICAL IMAGE"}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={onOpenAnnotation}
                    disabled={!canAnnotate}
                    className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                    <PenLine size={16} />
                    Edit Annotation
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex h-[266px] w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
            <div
                className="absolute w-[330px] h-[330px] rounded-full opacity-50"
                style={{
                    background:
                        "radial-gradient(circle, rgba(31,88,96,0.1) 0%, rgba(46,109,118,0.25) 38%, rgba(46,109,118,0.0) 70%)",
                    boxShadow:
                        "0 0 20px rgba(82, 191, 207, 0.35), inset 0 0 50px rgba(82, 191, 207, 0.22)",
                }}
            />

            <div
                className="absolute w-[250px] h-[250px] rounded-full opacity-50"
                style={{
                    border: "12px solid rgba(88, 155, 165, 0.18)",
                    boxShadow:
                        "0 0 18px rgba(88,155,165,0.45), inset 0 0 18px rgba(88,155,165,0.25)",
                }}
            />

            <div
                className="relative w-[135px] h-[135px] rounded-full border-[7px] border-[#c78d7e]"
                style={{
                    background:
                        "radial-gradient(circle at 45% 40%, #f3c0ad 0%, #d99684 38%, #ad6e61 68%, #8e554b 100%)",
                    boxShadow:
                        "0 0 0 10px rgba(82, 191, 207, 0.12), 0 0 30px rgba(82, 191, 207, 0.35)",
                }}
            >
                <div
                    className="absolute inset-5 rounded-full"
                    style={{
                        background:
                            "repeating-radial-gradient(circle, rgba(74,40,38,0.75) 0px, rgba(74,40,38,0.75) 2px, transparent 3px, transparent 8px)",
                    }}
                />

                <div
                    className="absolute inset-8 rounded-full opacity-70"
                    style={{
                        background:
                            "radial-gradient(circle, transparent 15%, rgba(79,39,39,0.65) 18%, transparent 22%, transparent 35%, rgba(79,39,39,0.65) 38%, transparent 42%)",
                    }}
                />
            </div>

            <button
                type="button"
                onClick={onOpenAnnotation}
                disabled
                className="absolute bottom-3 right-3 inline-flex cursor-not-allowed items-center gap-2 rounded-2xl bg-blue-300 px-4 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-950/20"
            >
                <ImagePlus size={16} />
                Add Annotation
            </button>
        </div>
    );
}
