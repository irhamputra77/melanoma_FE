import api from '../../../services/api';
import { ENDPOINTS } from '../../../services/endpoints';

export const login = async (payload) => {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, payload);
    return response.data;
};

export const register = async (payload) => {
    const config = payload instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined;
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, payload, config);
    return response.data;
}

export const getCurrentUser = async () => {
    const response = await api.get(ENDPOINTS.AUTH.ME);
    return response.data;
};
