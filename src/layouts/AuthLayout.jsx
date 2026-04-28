import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-6xl min-h-[720px] bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                <section className="bg-gradient-to-br from-blue-700 to-blue-500 text-white p-12 flex flex-col justify-between">
                    <div>
                        <h1 className="font-bold text-xl mb-14">MySkin</h1>
                        <h2 className="text-4xl font-bold leading-tight mb-6">
                            Precision Skin Health <br /> for Everyone.
                        </h2>
                        <p className="text-blue-100 max-w-md leading-relaxed">
                            Access the clinical atelier of dermatology. AI-powered diagnostics
                            and professional patient management in one secure platform.
                        </p>
                    </div>

                    <p className="text-sm text-blue-100">
                        Joined by 2,000+ clinicians worldwide
                    </p>
                </section>

                <section className="p-10 lg:p-16">
                    <Outlet />
                </section>
            </div>
        </main>
    );
}