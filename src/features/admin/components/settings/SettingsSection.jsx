export default function SettingsSection({ icon, title, children, className = "" }) {
    return (
        <section className={`rounded-[28px] bg-slate-200/45 p-8 ${className}`}>
            <div className="mb-7 flex items-center gap-3">
                <span className="text-blue-600">{icon}</span>
                <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
            </div>

            {children}
        </section>
    );
}
