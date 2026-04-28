import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { sidebarMenus } from "../constants/sidebarMenus";

export default function DashboardLayout() {
    const { role } = useParams();
    const navigate = useNavigate();

    const menus = sidebarMenus[role] || [];

    return (
        <div className="min-h-screen bg-slate-100 flex">
            <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
                <h1 className="text-2xl font-bold text-blue-600 mb-10">MySkin</h1>

                <nav className="space-y-2 flex-1">
                    {menus.map((menu) => (
                        <NavLink
                            key={menu.path}
                            to={menu.path}
                            className={({ isActive }) =>
                                `block px-4 py-3 rounded-xl text-sm font-medium ${isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-slate-600 hover:bg-slate-100"
                                }`
                            }
                        >
                            {menu.label}
                        </NavLink>
                    ))}
                </nav>

                <button
                    onClick={() => navigate("/auth/login")}
                    className="bg-blue-600 text-white py-3 rounded-xl font-semibold"
                >
                    Logout
                </button>
            </aside>

            <main className="flex-1">
                <header className="h-20 bg-slate-100 flex items-center justify-end px-10">
                    <div className="text-right">
                        <p className="font-semibold text-sm">Dr. Elena Aris</p>
                        <p className="text-xs text-slate-500 capitalize">{role}</p>
                    </div>
                </header>

                <section className="px-10 pb-10">
                    <Outlet />
                </section>
            </main>
        </div>
    );
}