import api from '../../../services/api';
import { ENDPOINTS } from '../../../services/endpoints';

const unwrapAuthResponse = (response) => response.data?.data ?? response.data;

export const login = async (payload) => {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, payload);
    return response.data;
};

export const getGoogleLoginUrl = () => {
    if (import.meta.env.VITE_GOOGLE_AUTH_URL) {
        return import.meta.env.VITE_GOOGLE_AUTH_URL;
    }

    const apiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3300/api';
    return `${apiBaseUrl.replace(/\/$/, '')}${ENDPOINTS.AUTH.GOOGLE_LOGIN}`;
};

export const register = async (payload) => {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, payload);
    return unwrapAuthResponse(response);
}

export const getActiveClinics = async () => {
    const response = await api.get(ENDPOINTS.CLINICS.ACTIVE, {
        params: { isActive: true },
    });
    return response.data?.data?.data ?? [];
};

export const requestPasswordReset = async (email) => {
    const response = await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    return unwrapAuthResponse(response);
};

export const resetPassword = async (payload) => {
    const response = await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload);
    return unwrapAuthResponse(response);
};

export const getCurrentUser = async () => {
    const response = await api.get(ENDPOINTS.AUTH.ME);
    return response.data;
};
