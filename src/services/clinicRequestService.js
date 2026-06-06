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

export const createClinicRequest = async (payload) => {
    const response = await api.post(ENDPOINTS.CLINIC_REQUESTS.CREATE, payload);
    return unwrap(response);
};

export const getClinicRequests = async (query = {}) => {
    const response = await api.get(ENDPOINTS.CLINIC_REQUESTS.LIST, {
        params: normalizeQuery(query),
    });
    return unwrap(response);
};

export const resolveClinicRequest = async (id, payload) => {
    const response = await api.patch(ENDPOINTS.CLINIC_REQUESTS.ACTION(id), payload);
    return unwrap(response);
};
