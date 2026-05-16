export const ENDPOINTS = {
    AUTH: {
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
        ME: "/auth/me",
    },
    DOCTOR: {
        DASHBOARD_SUMMARY: "/dashboard/summary",
        ASSIGNED_CASES: "/cases/assigned",
        CASE_DETAIL: (caseId) => `/cases/${caseId}`,
        CASE_OBSERVATION: (caseId) => `/cases/${caseId}/observation`,
        CASE_APPROVE: (caseId) => `/cases/${caseId}/approve`,
        CASE_REJECT: (caseId) => `/cases/${caseId}/reject`,
        CASE_HISTORY: "/cases/history",
        PATIENT_EVOLUTION: (patientId) => `/patients/${patientId}/evolution`,
        PROFILE: "/profile",
        PROFILE_PHOTO: "/profile/photo",
        SETTINGS: "/settings",
        SETTINGS_ACCOUNT: "/settings/account",
        SETTINGS_2FA: "/settings/2fa",
        SETTINGS_NOTIFICATIONS: "/settings/notifications",
        SETTINGS_PRIVACY: "/settings/privacy",
        SETTINGS_PREFERENCES: "/settings/preferences",
        NOTIFICATIONS: "/notifications",
        NOTIFICATION_READ: (notificationId) => `/notifications/${notificationId}/read`,
        NOTIFICATIONS_READ_ALL: "/notifications/read-all",
    },
    PATIENT: {
        DASHBOARD: "/dashboard",
        
        // Scans
        SCAN_UPLOAD: "/scans/upload",
        SCAN_ANALYZE: (scanId) => `/scans/${scanId}/analyze`,
        SCAN_ANALYSIS: (scanId) => `/scans/${scanId}/analysis`,
        RECENT_SCANS: "/scans/recent",
        SCAN_HISTORY: "/scans/history",
        SCAN_DETAIL: (scanId) => `/scans/${scanId}`,
        SCAN_EXPORT_PDF: (scanId) => `/scans/${scanId}/export-pdf`,
        SCAN_SHARE: (scanId) => `/scans/${scanId}/share`,
        
        // Reports
        REPORTS: "/reports",
        REPORT_DETAIL: (reportId) => `/reports/${reportId}`,
        REPORT_DOWNLOAD: (reportId) => `/reports/${reportId}/download`,
        REPORT_PREVIEW: (reportId) => `/reports/${reportId}/preview`,
        
        // Profile
        PROFILE: "/profile",
        PROFILE_PHOTO: "/profile/photo",
        
        // Settings
        SETTINGS: "/settings",
        SETTINGS_ACCOUNT: "/settings/account",
        SETTINGS_2FA: "/settings/2fa",
        SETTINGS_NOTIFICATIONS: "/settings/notifications",
        SETTINGS_PRIVACY: "/settings/privacy",
        SETTINGS_PREFERENCES: "/settings/preferences",
        
        // Notifications
        NOTIFICATIONS: "/notifications",
        NOTIFICATION_READ: (notificationId) => `/notifications/${notificationId}/read`,
        NOTIFICATIONS_READ_ALL: "/notifications/read-all",
        
        // Doctors & Verification
        AVAILABLE_DOCTORS: "/doctors/available",
        VERIFICATION_REQUESTS: "/verification-requests",
    },
    USER_UI_STATE: "/user-ui-state",
}
