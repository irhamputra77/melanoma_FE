import {
    ActivitySquare,
    BadgeCheck,
    Bell,
    Clock3,
    FileText,
    LayoutGrid,
    LogOut,
    MessageSquare,
    Microscope,
    Settings,
    ShieldCheck,
    UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { sidebarMenus } from "../constants/sidebarMenus";
import profileDoctor from "../assets/login_doctor_profile.png";
import {
    getRoleNotifications,
    markAllRoleNotificationsAsRead,
    markRoleNotificationAsRead,
} from "../services/notificationService";
import { getAdminSettings } from "../features/admin/services/adminService";
import { useLanguage } from "../contexts/LanguageContext";
import {
    saveAdminOperationsSettings,
    saveAdminPreferences,
} from "../utils/adminSettings";

const menuIcons = {
    Overview: LayoutGrid,
    "Historical Case": Clock3,
    "Historical Data": Clock3,
    "Patient Reports": FileText,
    "System Settings": Settings,
    "User Management": UsersRound,
    "Users Management": UsersRound,
    "Admin Users": ShieldCheck,
    "Patient Users": UsersRound,
    "Doctor Management": UsersRound,
    "Doctor Approval": BadgeCheck,
    "Clinic Management": Microscope,
    "Doctor Details": UsersRound,
    Messages: MessageSquare,
};

export default function DashboardLayout() {
    const { role } = useParams();
    const { changeLanguage = () => {} } = useLanguage() || {};
    const location = useLocation();
    const navigate = useNavigate();
    const notificationRef = useRef(null);
    const isAdmin = role === "admin";
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsError, setNotificationsError] = useState("");

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
    const unreadCount = notificationUnreadCount;

    const fetchNotifications = useCallback(async () => {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        const storedRole = sessionStorage.getItem("role") || localStorage.getItem("role");

        if (!token || storedRole !== role || !["doctor", "admin"].includes(role)) return;

        setNotificationsLoading(true);
        setNotificationsError("");

        try {
            const response = await getRoleNotifications(role, { page: 1, limit: 5 });
            setNotifications(Array.isArray(response.data) ? response.data : []);
            setNotificationUnreadCount(Number(response.unreadCount || 0));
        } catch (error) {
            if (error.response?.status === 401) {
                clearAuthSession();
                navigate("/auth/login", { replace: true });
                return;
            }

            setNotificationsError(error.response?.data?.message || error.message || "Failed to fetch notifications.");
        } finally {
            setNotificationsLoading(false);
        }
    }, [navigate, role]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (role !== "doctor") return undefined;

        const intervalId = window.setInterval(fetchNotifications, 15_000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [fetchNotifications, role]);

    useEffect(() => {
        if (!isAdmin) return;

        let isMounted = true;

        getAdminSettings()
            .then((settings) => {
                if (!isMounted) return;

                if (settings?.operations) {
                    saveAdminOperationsSettings(settings.operations);
                }
                if (settings?.preferences) {
                    saveAdminPreferences(settings.preferences);
                    changeLanguage(settings.preferences.language);
                }
            })
            .catch(() => {});

        return () => {
            isMounted = false;
        };
    }, [isAdmin]);

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (!notificationRef.current?.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, []);

    const toggleNotifications = () => {
        setNotificationsOpen((current) => {
            const next = !current;
            if (next) {
                fetchNotifications();
            }
            return next;
        });
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;

        const previousNotifications = notifications;
        const previousUnreadCount = notificationUnreadCount;
        setNotifications((current) => current.map(markNotificationReadLocally));
        setNotificationUnreadCount(0);
        setNotificationsError("");

        try {
            await markAllRoleNotificationsAsRead(role);
        } catch (error) {
            if (error.response?.status === 401) {
                clearAuthSession();
                navigate("/auth/login", { replace: true });
                return;
            }

            setNotifications(previousNotifications);
            setNotificationUnreadCount(previousUnreadCount);
            setNotificationsError(error.response?.data?.message || "Failed to mark notifications as read.");
        }
    };

    const handleNotificationClick = async (notification) => {
        const notificationId = getNotificationId(notification);
        const wasUnread = !isNotificationRead(notification);

        if (notificationId && wasUnread) {
            setNotifications((current) =>
                current.map((item) =>
                    getNotificationId(item) === notificationId ? markNotificationReadLocally(item) : item
                )
            );
            setNotificationUnreadCount((current) => Math.max(current - 1, 0));

            try {
                await markRoleNotificationAsRead(role, notificationId);
            } catch (error) {
                if (error.response?.status === 401) {
                    clearAuthSession();
                    navigate("/auth/login", { replace: true });
                    return;
                }

                setNotificationsError(error.response?.data?.message || "Failed to mark notification as read.");
                fetchNotifications();
            }
        }

        const targetPath = getNotificationTargetPath(role, notification);
        if (targetPath) {
            setNotificationsOpen(false);
            navigateWithTransition(targetPath);
        }
    };

    const handleLogout = () => {
        clearAuthSession();
        navigate("/auth/login", { replace: true });
    };

    const navigateWithTransition = (path, options) => {
        if (location.pathname === path && !options?.replace) return;

        if (document.startViewTransition) {
            document.startViewTransition(() => {
                flushSync(() => navigate(path, options));
            });
            return;
        }

        navigate(path, options);
    };

    const handleNavClick = (event, path) => {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.altKey ||
            event.ctrlKey ||
            event.shiftKey
        ) {
            return;
        }

        event.preventDefault();
        navigateWithTransition(path);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex">
            <aside className={`${isAdmin ? "w-64 bg-slate-50 border-r-0 p-4" : "w-64 bg-white border-r border-slate-200 p-6"} sticky top-0 h-screen shrink-0 overflow-y-auto flex flex-col`}>
                <div className={`mb-10 flex items-center gap-3 ${isAdmin ? "px-2 pt-7" : ""}`}>
                    <span className={`${isAdmin ? "flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white" : "hidden"}`}>
                        <Microscope size={23} />
                    </span>
                    <h1 className="text-2xl font-bold text-blue-600">MySkin</h1>
                </div>

                <nav className="space-y-2 flex-1">
                    {menus.map((menu) => (
                        <NavLink
                            key={menu.path}
                            to={menu.path}
                            onClick={(event) => handleNavClick(event, menu.path)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-out ${isActive
                                    ? "bg-white text-blue-600"
                                    : "text-slate-600 hover:bg-slate-100"
                                }`
                            }
                        >
                            {(() => {
                                const Icon = menuIcons[menu.label] || ShieldCheck;
                                return <Icon size={20} />;
                            })()}
                            {menu.label}
                        </NavLink>
                    ))}
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </aside>

            <main className="min-w-0 flex-1">
                <header className="relative z-40 flex h-[92px] items-center justify-between bg-slate-100 px-8">
                    <div>
                        {!activeMenu?.hideHeaderTitle && (
                            <h1 className="text-[28px] font-bold text-slate-900">
                                {pageTitle}
                            </h1>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        <div ref={notificationRef} className="relative z-50">
                            <button
                                type="button"
                                onClick={toggleNotifications}
                                onPointerDown={(event) => event.stopPropagation()}
                                className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                                aria-label="Notifications"
                                aria-expanded={notificationsOpen}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 px-1 text-[10px] font-extrabold leading-none text-white">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {notificationsOpen && (
                                    <NotificationPopover
                                        notifications={notifications}
                                        loading={notificationsLoading}
                                        error={notificationsError}
                                        unreadCount={unreadCount}
                                        onMarkAllAsRead={handleMarkAllAsRead}
                                        onNotificationClick={handleNotificationClick}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-9 w-px bg-slate-200" />

                        <button
                            type="button"
                            onClick={() => navigateWithTransition(role === "admin" ? "/admin/profile" : role === "doctor" ? "/doctor/profile" : `/${role}/settings`)}
                            className="flex items-center gap-4"
                        >
                            <div className="text-right">
                                <p className="font-semibold text-sm text-slate-900">{profile.name}</p>
                                <p className="text-xs text-slate-500">{profile.title}</p>
                            </div>
                            <img
                                src={profileDoctor}
                                alt={profile.name}
                                className="h-11 w-11 rounded-full border-2 border-blue-500 object-cover"
                            />
                        </button>
                    </div>
                </header>

                <section className="px-8 pb-8">
                    <div className="dashboard-page-transition">
                        <Outlet />
                    </div>
                </section>
            </main>
        </div>
    );
}

function NotificationPopover({
    notifications,
    loading,
    error,
    unreadCount,
    onMarkAllAsRead,
    onNotificationClick,
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-14 z-[60] w-[320px] overflow-hidden rounded-[22px] bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200"
        >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-extrabold text-slate-950">Notifications</h2>
                {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-600">
                        {unreadCount} NEW
                    </span>
                )}
            </div>

            <div className="max-h-[360px] overflow-y-auto">
                {loading && (
                    <div className="px-5 py-8 text-center text-sm font-semibold text-slate-500">
                        Loading notifications...
                    </div>
                )}

                {!loading && error && (
                    <div className="px-5 py-8 text-center text-sm font-semibold text-red-600">
                        {error}
                    </div>
                )}

                {!loading && !error && notifications.length === 0 && (
                    <div className="px-5 py-8 text-center text-sm font-semibold text-slate-500">
                        No notifications yet.
                    </div>
                )}

                {!loading && !error && notifications.map((notification, index) => (
                    <NotificationItem
                        key={getNotificationId(notification) || `${getNotificationTitle(notification)}-${index}`}
                        notification={notification}
                        onClick={() => onNotificationClick(notification)}
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={onMarkAllAsRead}
                disabled={loading || unreadCount === 0}
                className="flex h-16 w-full items-center justify-center border-t border-slate-100 text-sm font-extrabold text-blue-600 disabled:text-slate-400"
            >
                Mark all as read
            </button>
        </motion.div>
    );
}

function NotificationItem({ notification, onClick }) {
    const isRead = isNotificationRead(notification);
    const Icon = getNotificationIcon(notification);

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full gap-4 border-b border-slate-100 px-5 py-5 text-left transition hover:bg-slate-50 ${isRead ? "opacity-70" : "bg-blue-50/40"}`}
        >
            <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${getNotificationTone(notification)}`}>
                <Icon size={20} />
            </span>
            <span className="min-w-0">
                <span className="flex items-start gap-2">
                    {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                    <span className="block text-base font-extrabold leading-tight text-slate-950">
                        {getNotificationTitle(notification)}
                    </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-slate-500">
                    {getNotificationMessage(notification)}
                </span>
                <span className="mt-1 block text-xs font-medium text-slate-400">
                    {formatNotificationTime(notification)}
                </span>
            </span>
        </button>
    );
}

function getNotificationId(notification) {
    return notification?.id || notification?._id || notification?.notificationId;
}

function getNotificationTitle(notification) {
    return notification?.title || notification?.subject || notification?.typeLabel || "Notification";
}

function getNotificationMessage(notification) {
    return notification?.message || notification?.body || notification?.description || "You have a new update.";
}

function isNotificationRead(notification) {
    return Boolean(notification?.isRead || notification?.read || notification?.readAt);
}

function markNotificationReadLocally(notification) {
    return {
        ...notification,
        isRead: true,
        read: true,
        readAt: notification.readAt || new Date().toISOString(),
    };
}

function isAnalysisNotification(notification) {
    const source = `${notification?.type || ""} ${getNotificationTitle(notification)} ${getNotificationMessage(notification)}`.toLowerCase();
    return source.includes("scan") || source.includes("analysis");
}

function getNotificationIcon(notification) {
    const type = String(notification?.type || "").toLowerCase();

    if (type === "system_message") return MessageSquare;
    if (type === "verification_alert") return BadgeCheck;
    if (isAnalysisNotification(notification)) return ActivitySquare;

    return BadgeCheck;
}

function getNotificationTone(notification) {
    const type = String(notification?.type || "").toLowerCase();

    if (type === "system_message") {
        return "bg-blue-50 text-blue-600";
    }

    if (type === "verification_alert") {
        return "bg-orange-50 text-orange-600";
    }

    if (isAnalysisNotification(notification)) {
        return "bg-emerald-50 text-emerald-600";
    }

    return "bg-blue-50 text-blue-600";
}

function formatNotificationTime(notification) {
    const value = notification?.createdAt || notification?.created_at || notification?.date || notification?.time;
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hrs ago`;

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function getNotificationTargetPath(role, notification) {
    if (role !== "doctor") return "";

    const type = String(notification?.type || "").toLowerCase();

    if (type === "system_message") {
        return "/doctor/messages";
    }

    if (type === "verification_alert") {
        return "/doctor/dashboard";
    }

    return "";
}

function clearAuthSession() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
}
