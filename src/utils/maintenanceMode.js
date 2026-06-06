const MAINTENANCE_MODE_KEY = "maintenanceMode";

export function isMaintenanceModeEnabled() {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(MAINTENANCE_MODE_KEY) === "true";
}

export function setMaintenanceMode(enabled) {
    if (typeof sessionStorage === "undefined") return;

    if (enabled) {
        sessionStorage.setItem(MAINTENANCE_MODE_KEY, "true");
        return;
    }

    sessionStorage.removeItem(MAINTENANCE_MODE_KEY);
}

export function isMaintenanceError(error) {
    const status = error?.response?.status;
    const payload = error?.response?.data || {};
    const message = String(payload.message || payload.error || "").toLowerCase();
    const code = String(payload.code || "").toLowerCase();

    return status === 503 || code === "maintenance_mode" || message.includes("maintenance");
}
