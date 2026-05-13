import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
const withCredentials = import.meta.env.VITE_API_WITH_CREDENTIALS === "true";

const api = axios.create({
    baseURL,
    withCredentials,
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
