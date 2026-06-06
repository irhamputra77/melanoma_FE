export const ENDPOINTS = {
    AUTH: {
        LOGIN: "/auth/login",
        GOOGLE_LOGIN: "/auth/google",
        REGISTER: "/auth/register",
        FORGOT_PASSWORD: "/auth/forgot-password",
        RESET_PASSWORD: "/auth/reset-password",
        ME: "/auth/me",
    },
    GUEST: {
        SCAN: "/guest/scan",
        SCAN_RESULT: (scanId) => `/guest/scan/${scanId}`
    },
    CLINICS: {
        ACTIVE: "/v1/clinics",
        CREATE: "/v1/clinics",
        ACTION: (clinicId) => `/v1/clinics/${clinicId}`,
    },
    CLINIC_REQUESTS: {
        LIST: "/v1/clinic-requests",
        CREATE: "/v1/clinic-requests",
        ACTION: (id) => `/v1/clinic-requests/${id}`,
    },
    DOCTOR: {
        DASHBOARD_SUMMARY: "/dashboard/summary",
        ASSIGNED_CASES: "/cases/assigned",
        CASE_DETAIL: (caseId) => `/cases/${caseId}`,
        CASE_OBSERVATION: (caseId) => `/cases/${caseId}/observation`,
        CASE_APPROVE: (caseId) => `/cases/${caseId}/approve`,
        CASE_REJECT: (caseId) => `/cases/${caseId}/reject`,
        CASE_HISTORY: "/cases/history",
        CASE_HISTORY_DOWNLOAD: "/cases/history/download",
        CASE_REPORT_GENERATE: (caseId) => `/cases/${caseId}/report/generate`,
        CASE_REPORT_DOWNLOAD: (caseId) => `/cases/${caseId}/report/download`,
        PATIENT_EVOLUTION: (patientId) => `/patients/${patientId}/evolution`,
        CONSULTATIONS: "/consultations",
        CONSULTATION_DETAIL: (consultationId) => `/consultations/${consultationId}`,
        CONSULTATION_MESSAGES: (consultationId) => `/consultations/${consultationId}/messages`,
        CONSULTATION_CLOSE: (consultationId) => `/consultations/${consultationId}/close`,
        CONSULTATION_TYPING: (consultationId) => `/consultations/${consultationId}/typing`,
        CONSULTATION_READ: (consultationId) => `/consultations/${consultationId}/read`,
        CONSULTATION_READ_ALL: (consultationId) => `/consultations/${consultationId}/read-all`,
        PROFILE: "/profile",
        PROFILE_PHOTO: "/profile/photo",
        SETTINGS: "/settings",
        SETTINGS_ACCOUNT: "/settings/account",
        SETTINGS_NOTIFICATIONS: "/settings/notifications",
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
        SETTINGS_NOTIFICATIONS: "/settings/notifications",
        SETTINGS_PREFERENCES: "/settings/preferences",

        // Notifications
        NOTIFICATIONS: "/notifications",
        NOTIFICATION_READ: (notificationId) => `/notifications/${notificationId}/read`,
        NOTIFICATIONS_READ_ALL: "/notifications/read-all",

        // Doctors & Verification
        AVAILABLE_DOCTORS: "/doctors/available",
        VERIFICATION_REQUESTS: "/verification-requests",

        // Chat & Consultations
        CONSULTATIONS: "/consultations",
        CONSULTATION_INITIATE: "/consultations/initiate",
        CONSULTATION_DETAIL: (consultationId) => `/consultations/${consultationId}`,
        CONSULTATION_MESSAGES: (consultationId) => `/consultations/${consultationId}/messages`,
        CONSULTATION_READ: (consultationId) => `/consultations/${consultationId}/read`,
        CONSULTATION_READ_ALL: (consultationId) => `/consultations/${consultationId}/read-all`,
        CONSULTATION_EVENTS: (id) => `/consultations/${id}/events`,
        CONSULTATION_TYPING: (id) => `/consultations/${id}/typing`,
        CONSULTATION_AI_ANALYSIS: (id) => `/consultations/${id}/ai-analysis`,
    },
    USER_UI_STATE: "/user-ui-state",
}
