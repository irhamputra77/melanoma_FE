const metadata = [
    {
        label: "ZOOM",
        value: "4.0x",
    },
    {
        label: "LIGHT",
        value: "Polarized",
    },
    {
        label: "BODY SITE",
        value: "Left Shoulder",
    },
];

export default function ClinicalImageMeta() {
    return (
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            {metadata.map((item) => (
                <div key={item.label}>
                    <p className="text-[10px] font-extrabold text-slate-500">
                        {item.label}
                    </p>
                    <p className="text-base font-extrabold text-slate-900 mt-1">
                        {item.value}
                    </p>
                </div>
            ))}
        </div>
    );
}