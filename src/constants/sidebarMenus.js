export const sidebarMenus = {
    doctor: [
        { label: "Overview", path: "/doctor/dashboard" },
        { label: "Historical Case", path: "/doctor/history", title: "Historical Case Reviews" },
        { label: "System Settings", path: "/doctor/settings", hideHeaderTitle: true },
    ],
    patient: [
        { label: "Overview", path: "/patient/dashboard" },
        { label: "Historical Data", path: "/patient/history" },
        { label: "Patient Reports", path: "/patient/reports" },
        { label: "System Settings", path: "/patient/settings" },
    ],
    admin: [
        { label: "Overview", path: "/admin/dashboard", hideHeaderTitle: true },
        { label: "User Management", path: "/admin/users", hideHeaderTitle: true },
        { label: "Historical Data", path: "/admin/verification", hideHeaderTitle: true },
        { label: "System Settings", path: "/admin/settings", hideHeaderTitle: true },
    ],
}
