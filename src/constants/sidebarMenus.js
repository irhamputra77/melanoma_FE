export const sidebarMenus = {
    doctor: [
        { label: "Overview", path: "/doctor/dashboard" },
        { label: "Historical Case", path: "/doctor/history" },
        { label: "System Settings", path: "/doctor/settings" },
    ],
    patient: [
        { label: "Overview", path: "/patient/dashboard" },
        { label: "Historical Data", path: "/patient/history" },
        { label: "Patient Reports", path: "/patient/reports" },
        { label: "System Settings", path: "/patient/settings" },
    ],
    admin: [
        { label: "Overview", path: "/admin/dashboard" },
        { label: "Users Management", path: "/admin/users" },
        { label: "Doctor Details", path: "/admin/verification" },
        { label: "System Settings", path: "/admin/settings" },
    ],
}