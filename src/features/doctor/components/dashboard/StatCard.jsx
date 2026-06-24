export default function StatCard({ title, value, icon, badge, color = "blue" }) {
    const colorMap = {
        blue: "bg-blue-100 text-blue-600",
        orange: "bg-orange-100 text-orange-600",
        green: "bg-green-100 text-green-600",
    };

    return (
        <div className="min-h-[152px] rounded-3xl bg-white p-5 sm:p-6 lg:min-h-[188px] lg:p-8">
            <div className="mb-6 flex items-start justify-between gap-3 lg:mb-8">
                <img
                    className={`h-11 rounded-2xl p-3 object-contain ${colorMap[color]}`}
                    src={icon}
                    alt={title}
                />


                {badge && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-600 sm:px-4 sm:text-sm">
                        {badge}
                    </span>
                )}
            </div>

            <p className="text-slate-600 text-base mb-2">{title}</p>
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">{value}</h2>
        </div >
    );
}
