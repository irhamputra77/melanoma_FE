import api from '../../../services/api';
import { ENDPOINTS } from '../../../services/endpoints';

const unwrapAuthResponse = (response) => response.data?.data ?? response.data;

export const login = async (payload) => {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, payload);
    return response.data;
};

export const register = async (payload) => {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, payload);
    return unwrapAuthResponse(response);
}

export const getCurrentUser = async () => {
    const response = await api.get(ENDPOINTS.AUTH.ME);
    return response.data;
};
