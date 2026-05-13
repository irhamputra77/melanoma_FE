import LesionThumbnail from "./LesionThumbnail";

const cases = [
    {
        date: ["Oct", "24,", "2023"],
        patient: "Sarah Johnson",
        id: "9942-A",
        diagnosis: "Malignant Melanoma",
        status: "Verified",
        statusColor: "green",
        lesion: "brown",
        highlighted: true,
    },
    {
        date: ["Oct", "22,", "2023"],
        patient: "Elena Chen",
        id: "4120-C",
        diagnosis: "Benign Nevus",
        status: "Awaiting Review",
        statusColor: "orange",
        lesion: "pink",
    },
    ...Array.from({ length: 6 }, () => ({
        date: ["Oct", "15,", "2023"],
        patient: "Sarah Williams",
        id: "8821-W",
        diagnosis: "Seborrheic Keratosis",
        status: "Rejected",
        statusColor: "red",
        lesion: "peach",
    })),
];

const statusClass = {
    green: "bg-emerald-200 text-emerald-700",
    orange: "bg-orange-200 text-orange-700",
    red: "bg-red-100 text-red-600",
};

export default function CaseHistoryTable() {
    return (
        <div className="mt-9 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full table-fixed text-left">
                <thead className="bg-slate-100 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-700">
                    <tr>
                        <th className="w-[16%] px-20 py-5">Date</th>
                        <th className="w-[22%] px-6 py-5">Patient</th>
                        <th className="w-[20%] px-6 py-5">Clinical Image</th>
                        <th className="w-[22%] px-6 py-5">AI Diagnosis</th>
                        <th className="w-[20%] px-6 py-5">Verification</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                    {cases.map((item, index) => (
                        <tr
                            key={`${item.patient}-${index}`}
                            className={item.highlighted ? "bg-slate-50" : "bg-white"}
                        >
                            <td className="px-20 py-6 align-middle">
                                <p className="text-base font-medium leading-tight text-slate-900">
                                    {item.date.map((line) => (
                                        <span key={line} className="block">
                                            {line}
                                        </span>
                                    ))}
                                </p>
                            </td>

                            <td className="px-6 py-6 align-middle">
                                <p className="text-base font-extrabold leading-tight text-slate-900">
                                    {item.patient.split(" ").map((part) => (
                                        <span key={part} className="block">
                                            {part}
                                        </span>
                                    ))}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">ID: {item.id}</p>
                            </td>

                            <td className="px-6 py-6 align-middle">
                                <LesionThumbnail variant={item.lesion} />
                            </td>

                            <td className="px-6 py-6 align-middle">
                                <p className="text-base font-extrabold leading-tight text-slate-900">
                                    {item.diagnosis.split(" ").map((part, diagnosisIndex) => (
                                        <span key={`${part}-${diagnosisIndex}`} className="block">
                                            {part}
                                        </span>
                                    ))}
                                </p>
                            </td>

                            <td className="px-6 py-6 align-middle">
                                <span
                                    className={`inline-flex min-w-20 justify-center rounded-full px-4 py-1 text-[11px] font-extrabold uppercase ${statusClass[item.statusColor]}`}
                                >
                                    {item.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
