import api from './api';
import { ENDPOINTS } from './endpoints';

const unwrap = (response) => response.data?.data ?? response.data;
const normalizeQuery = (query = {}) => Object.fromEntries(
    Object.entries(query).filter(([, value]) => (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
    ))
);

export const getClinics = async (query = {}) => {
    const response = await api.get(ENDPOINTS.CLINICS.ACTIVE, {
        params: normalizeQuery(query),
    });
    return unwrap(response);
};

export const createClinic = async (payload) => {
    const response = await api.post(ENDPOINTS.CLINICS.CREATE, payload);
    return unwrap(response);
};

export const updateClinic = async (clinicId, payload) => {
    const response = await api.patch(ENDPOINTS.CLINICS.ACTION(clinicId), payload);
    return unwrap(response);
};

export const deleteClinic = async (clinicId) => {
    const response = await api.delete(ENDPOINTS.CLINICS.ACTION(clinicId));
    return unwrap(response);
};
