const defaultMetadata = {
    zoom: "4.0x",
    light: "Polarized",
    bodySite: "Left Shoulder",
};

const labels = {
    zoom: "ZOOM",
    light: "LIGHT",
    bodySite: "BODY SITE",
};

export default function ClinicalImageMeta({ clinicalImage }) {
    const metadata = { ...defaultMetadata, ...clinicalImage };

    return (
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            {Object.entries(labels).map(([key, label]) => (
                <div key={key}>
                    <p className="text-[10px] font-extrabold text-slate-500">
                        {label}
                    </p>
                    <p className="text-base font-extrabold text-slate-900 mt-1">
                        {metadata[key]}
                    </p>
                </div>
            ))}
        </div>
    );
}
