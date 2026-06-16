import axios from "axios";
import { isMaintenanceError, setMaintenanceMode } from "../utils/maintenanceMode";

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
const withCredentials = import.meta.env.VITE_API_WITH_CREDENTIALS === "true";

const api = axios.create({
    baseURL,
    withCredentials,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("token");

    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const role = sessionStorage.getItem("role");
        const skipMaintenanceRedirect = Boolean(error?.config?.skipMaintenanceRedirect);

        if (!skipMaintenanceRedirect && role !== "admin" && isMaintenanceError(error)) {
            setMaintenanceMode(true);
            window.location.assign("/maintenance");
        }

        return Promise.reject(error);
    }
);

export default api;
