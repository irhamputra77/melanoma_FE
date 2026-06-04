export const sidebarMenus = {
    doctor: [
        { label: "Overview", path: "/doctor/dashboard" },
        { label: "Historical Case", path: "/doctor/history", title: "Historical Case Reviews" },
        { label: "System Settings", path: "/doctor/settings", hideHeaderTitle: true },
        { label: "Messages", path: "/doctor/messages" },
    ],
    patient: [
        { label: "Overview", path: "/patient/dashboard" },
        { label: "Historical Data", path: "/patient/history" },
        { label: "Patient Reports", path: "/patient/reports" },
        { label: "System Settings", path: "/patient/settings" },
    ],
    admin: [
        { label: "Overview", path: "/admin/dashboard", hideHeaderTitle: true },
        { label: "Admin Users", path: "/admin/admins", hideHeaderTitle: true },
        { label: "Patient Users", path: "/admin/patients", hideHeaderTitle: true },
        { label: "Doctor Management", path: "/admin/doctors", hideHeaderTitle: true },
        { label: "Doctor Approval", path: "/admin/doctor-approvals", hideHeaderTitle: true },
        { label: "Clinic Management", path: "/admin/clinic-requests", hideHeaderTitle: true },
        { label: "System Activity", path: "/admin/activity", hideHeaderTitle: true },
        { label: "System Settings", path: "/admin/settings", hideHeaderTitle: true },
    ],
}
