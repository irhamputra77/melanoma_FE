import api from './api';
import { ENDPOINTS } from './endpoints';

export const createClinicRequest = async (payload) => {
    const response = await api.post(ENDPOINTS.CLINIC_REQUESTS.CREATE, payload);
    return response.data?.data ?? response.data;
};

export const getClinicRequests = async (query = {}) => {
    const response = await api.get(ENDPOINTS.CLINIC_REQUESTS.LIST, {
        params: query,
    });
    return response.data?.data ?? response.data;
};

export const resolveClinicRequest = async (id, payload) => {
    const response = await api.patch(ENDPOINTS.CLINIC_REQUESTS.ACTION(id), payload);
    return response.data?.data ?? response.data;
};
