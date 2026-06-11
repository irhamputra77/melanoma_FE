import { useMemo, useState } from "react";
import { ScanSearch } from "lucide-react";
import { getAssetUrlCandidates } from "../../../../utils/assets";

export default function GradcamImageCard({
    gradcamUrl,
    label = "GRAD-CAM HEATMAP",
    emptyLabel = "No Grad-CAM image",
}) {
    const gradcamCandidates = useMemo(() => getAssetUrlCandidates(gradcamUrl), [gradcamUrl]);
    const [gradcamFallback, setGradcamFallback] = useState({ source: "", index: 0 });
    const gradcamIndex = gradcamFallback.source === gradcamUrl ? gradcamFallback.index : 0;

    if (gradcamUrl && gradcamCandidates.length) {
        return (
            <div className="relative h-[266px] w-full overflow-hidden rounded-2xl bg-black">
                <img
                    src={gradcamCandidates[gradcamIndex]}
                    alt="Grad-CAM heatmap"
                    className="h-full w-full object-cover"
                    onError={() => {
                        setGradcamFallback((current) => ({
                            source: gradcamUrl,
                            index: Math.min((current.source === gradcamUrl ? current.index : 0) + 1, gradcamCandidates.length - 1),
                        }));
                    }}
                />

                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold text-slate-800 shadow-sm">
                        {label}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-[266px] w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold text-slate-800 shadow-sm">
                    {label}
                </span>
            </div>

            <div className="flex flex-col items-center gap-3 text-slate-300">
                <ScanSearch size={34} strokeWidth={2.4} />
                <p className="text-sm font-extrabold">{emptyLabel}</p>
            </div>
        </div>
    );
}
