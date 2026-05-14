import { toAssetUrl } from "../../../../utils/assets";

export default function ClinicalImageCard({ imageUrl }) {
    if (imageUrl) {
        return (
            <div className="h-[266px] w-[352px] rounded-2xl bg-black overflow-hidden flex items-center justify-center relative">
                <img
                    src={toAssetUrl(imageUrl)}
                    alt="Clinical lesion"
                    className="h-full w-full object-cover"
                />
            </div>
        );
    }

    return (
        <div className="h-[266px] w-[352px] rounded-2xl bg-black overflow-hidden flex items-center justify-center relative">
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
        </div>
    );
}
