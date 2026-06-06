import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";

export default function MaintenancePage() {
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");
    const isAdmin = Boolean(token) && role === "admin";

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
            <section className="w-full max-w-xl rounded-[28px] bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Wrench size={30} />
                </div>
                <h1 className="mt-7 text-3xl font-extrabold text-slate-950">
                    System Maintenance
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-relaxed text-slate-600">
                    MySkin sedang dalam pemeliharaan sementara. Admin masih dapat mengakses dashboard untuk menyelesaikan pekerjaan operasional.
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    {isAdmin && (
                        <Link
                            to="/admin/settings"
                            className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20"
                        >
                            Open Admin Settings
                        </Link>
                    )}
                    <Link
                        to="/auth/login"
                        className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-100 px-6 text-sm font-extrabold text-slate-700"
                    >
                        Back to Login
                    </Link>
                </div>
            </section>
        </main>
    );
}
