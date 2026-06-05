import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";

export const analyzeGuestScan = async (file, complaint, bodySite) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("complaint", complaint);
    formData.append("bodySite", bodySite);

    const response = await api.post(ENDPOINTS.GUEST.SCAN, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    
    return response.data?.data || response.data;
};

export const getGuestScanResult = async (scanId) => {
    const response = await api.get(ENDPOINTS.GUEST.SCAN_RESULT(scanId));
    
    return response.data?.data || response.data;
};