import api from './api';
import { ENDPOINTS } from './endpoints';

export const getClinics = async (query = {}) => {
    const response = await api.get(ENDPOINTS.CLINICS.ACTIVE, {
        params: query,
    });
    return response.data?.data ?? response.data;
};

export const createClinic = async (payload) => {
    const response = await api.post(ENDPOINTS.CLINICS.CREATE, payload);
    return response.data?.data ?? response.data;
};

export const updateClinic = async (clinicId, payload) => {
    const response = await api.patch(ENDPOINTS.CLINICS.ACTION(clinicId), payload);
    return response.data?.data ?? response.data;
};

export const deleteClinic = async (clinicId) => {
    const response = await api.delete(ENDPOINTS.CLINICS.ACTION(clinicId));
    return response.data?.data ?? response.data;
};
