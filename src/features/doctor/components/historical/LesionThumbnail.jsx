export default function LesionThumbnail({ variant = "brown", size = "small", muted = false }) {
    const sizeClass = size === "large" ? "h-[285px] w-full" : "h-12 w-12";
    const lesionClass = size === "large" ? "h-[190px] w-[190px]" : "h-8 w-8";

    const palette = {
        brown: {
            shell: "#d58f76",
            center: "#5d2f2b",
            bg: "#050807",
        },
        pink: {
            shell: "#ef5d9a",
            center: "#8a1048",
            bg: "#050807",
        },
        peach: {
            shell: "#f0a179",
            center: "#8b4636",
            bg: "#050807",
        },
        pale: {
            shell: "#f3c7cd",
            center: "#cf7f91",
            bg: "#8e908d",
        },
    };

    const colors = palette[variant] || palette.brown;

    return (
        <div
            className={`${sizeClass} ${muted ? "opacity-45" : ""} overflow-hidden rounded-xl flex items-center justify-center`}
            style={{ backgroundColor: colors.bg }}
        >
            <div
                className={`${lesionClass} rounded-full relative`}
                style={{
                    background: `radial-gradient(circle at 48% 45%, #ffe0ce 0%, ${colors.shell} 45%, ${colors.center} 100%)`,
                    boxShadow: size === "large" ? "0 0 0 18px rgba(92, 157, 165, 0.25)" : "none",
                }}
            >
                <div
                    className="absolute inset-[18%] rounded-full"
                    style={{
                        background:
                            "repeating-radial-gradient(circle, rgba(30, 20, 20, 0.65) 0 2px, transparent 3px 8px)",
                    }}
                />
            </div>
        </div>
    );
}
