import { useMemo, useState } from "react";
import { ImageOff } from "lucide-react";
import { getAssetUrlCandidates } from "../../../../utils/assets";

export default function CaseImageThumbnail({ imageUrl, label, alt }) {
    const candidates = useMemo(() => getAssetUrlCandidates(imageUrl), [imageUrl]);
    const [fallback, setFallback] = useState({ source: "", index: 0 });
    const imageIndex = fallback.source === imageUrl ? fallback.index : 0;

    return (
        <div className="space-y-1">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {imageUrl && candidates.length ? (
                    <img
                        src={candidates[imageIndex]}
                        alt={alt || label}
                        className="h-full w-full object-cover"
                        onError={() => {
                            setFallback((current) => ({
                                source: imageUrl,
                                index: Math.min((current.source === imageUrl ? current.index : 0) + 1, candidates.length - 1),
                            }));
                        }}
                    />
                ) : (
                    <ImageOff size={18} className="text-slate-400" />
                )}
            </div>
        </div>
    );
}
