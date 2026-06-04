export const DEFAULT_ADMIN_PAGE_SIZE = 8;

const OPERATIONS_KEY = "adminOperationsSettings";
const PREFERENCES_KEY = "adminPreferences";

const defaultOperations = {
    defaultPageSize: DEFAULT_ADMIN_PAGE_SIZE,
    auditLogRetentionDays: 180,
    maintenanceMode: false,
    deleteConfirmationRequired: true,
};

const defaultPreferences = {
    language: "English (US)",
    timezone: "Asia/Jakarta",
};

export const saveAdminOperationsSettings = (operations = {}) => {
    sessionStorage.setItem(OPERATIONS_KEY, JSON.stringify({
        ...defaultOperations,
        ...operations,
    }));
};

export const getAdminOperationsSettings = () => {
    try {
        return {
            ...defaultOperations,
            ...JSON.parse(sessionStorage.getItem(OPERATIONS_KEY) || "{}"),
        };
    } catch {
        return defaultOperations;
    }
};

export const saveAdminPreferences = (preferences = {}) => {
    const nextPreferences = {
        ...defaultPreferences,
        ...preferences,
    };

    sessionStorage.setItem(PREFERENCES_KEY, JSON.stringify(nextPreferences));
    sessionStorage.setItem("appLanguage", nextPreferences.language);
};

export const getAdminPreferences = () => {
    try {
        return {
            ...defaultPreferences,
            ...JSON.parse(sessionStorage.getItem(PREFERENCES_KEY) || "{}"),
        };
    } catch {
        return defaultPreferences;
    }
};

export const isStrictDeleteConfirmationEnabled = () => (
    getAdminOperationsSettings().deleteConfirmationRequired !== false
);

export const formatAdminDate = (value, options = {}) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    const preferences = getAdminPreferences();
    const locale = preferences.language === "Bahasa Indonesia" ? "id-ID" : "en-US";

    try {
        return date.toLocaleDateString(locale, {
            timeZone: preferences.timezone,
            month: "short",
            day: "numeric",
            year: "numeric",
            ...options,
        });
    } catch {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            ...options,
        });
    }
};
