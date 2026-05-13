export default function StatCard({ title, value, icon, badge, color = "blue" }) {
    const colorMap = {
        blue: "bg-blue-100 text-blue-600",
        orange: "bg-orange-100 text-orange-600",
        green: "bg-green-100 text-green-600",
    };

    return (
        <div className="bg-white rounded-3xl p-8 min-h-[188px]">
            <div className="flex items-start justify-between mb-8">
                <img
                    className={`h-11 rounded-2xl p-3 object-contain ${colorMap[color]}`}
                    src={icon}
                    alt={title}
                />


                {badge && (
                    <span className="text-sm font-bold text-green-600 bg-green-100 px-4 py-1 rounded-full">
                        {badge}
                    </span>
                )}
            </div>

            <p className="text-slate-600 text-base mb-2">{title}</p>
            <h2 className="text-4xl font-bold text-slate-900">{value}</h2>
        </div >
    );
}
