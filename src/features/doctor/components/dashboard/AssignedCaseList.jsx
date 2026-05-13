import AssignedCaseCard from "./AssignedCaseCard";

const assignedCases = [
    {
        name: "Sarah Johnson",
        id: "#SK-9921",
        time: "2 hours ago",
        urgent: true,
        avatar: "👩🏻‍⚕️",
    },
    {
        name: "David Chen",
        id: "#SK-8812",
        time: "5 hours ago",
        avatar: "👨🏻",
    },
    {
        name: "Aaron Minaj",
        id: "#SK-8812",
        time: "5 hours ago",
        avatar: "👨🏽",
    },
    {
        name: "Kevin Smith",
        id: "#SK-8812",
        time: "5 hours ago",
        avatar: "🧔🏻",
    },
    {
        name: "David Arch",
        id: "#SK-8812",
        time: "5 hours ago",
        avatar: "👨🏼",
    },
    {
        name: "Billie Minaj",
        id: "#SK-8756",
        time: "Yesterday",
        avatar: "👨‍🦳",
    },
    {
        name: "Elena Ellish",
        id: "#SK-8756",
        time: "Yesterday",
        avatar: "👩🏼",
    },
    {
        name: "Christie Minaj",
        id: "#SK-8756",
        time: "Yesterday",
        avatar: "👩🏽",
    },
];

export default function AssignedCaseList() {
    return (
        <div>
            <div className="bg-white rounded-2xl shadow-sm py-3 text-center text-slate-700 font-bold mb-8 border border-slate-100">
                Assigned
            </div>

            <div className="space-y-4">
                {assignedCases.map((item, index) => (
                    <AssignedCaseCard
                        key={`${item.id}-${index}`}
                        item={item}
                        active={index === 0}
                    />
                ))}
            </div>
        </div>
    );
}