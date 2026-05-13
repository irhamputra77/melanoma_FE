import { Bell } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { sidebarMenus } from "../constants/sidebarMenus";
import profileDoctor from "../assets/login_doctor_profile.png";

export default function DashboardLayout() {
    const { role } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const menus = sidebarMenus[role] || [];
    const activeMenu = menus.find((menu) => menu.path === location.pathname);
    const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
    const pageTitle = activeMenu?.title || (activeMenu?.label === "Overview"
        ? `${roleLabel} Dashboard`
        : activeMenu?.label || `${roleLabel} Dashboard`);
    const profile = {
        admin: {
            name: "Aryo Jaty",
            title: "Administrator",
        },
        doctor: {
            name: "Dr. Elena Aris",
            title: "Senior Dermatologist",
        },
        patient: {
            name: "Sarah Johnson",
            title: "Patient",
        },
    }[role] || {
        name: "Dr. Elena Aris",
        title: "Senior Dermatologist",
    };

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
                <header className="h-[109px] bg-slate-100 flex items-center justify-between px-10">
                    <div>
                        {!activeMenu?.hideHeaderTitle && (
                            <h1 className="text-[32px] font-bold text-slate-900">
                                {pageTitle}
                            </h1>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            type="button"
                            className="h-10 w-10 rounded-full bg-white text-slate-700 shadow-sm flex items-center justify-center"
                            aria-label="Notifications"
                        >
                            <Bell size={20} />
                        </button>

                        <div className="h-9 w-px bg-slate-200" />

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="font-semibold text-sm text-slate-900">{profile.name}</p>
                                <p className="text-xs text-slate-500">{profile.title}</p>
                            </div>
                            <img
                                src={profileDoctor}
                                alt={profile.name}
                                className="h-11 w-11 rounded-full border-2 border-blue-500 object-cover"
                            />
                        </div>
                    </div>
                </header>

                <section className="px-10 pb-10">
                    <Outlet />
                </section>
            </main>
        </div>
    );
}
