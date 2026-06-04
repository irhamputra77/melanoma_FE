import { getDoctorProfile } from "../../doctor/services/doctorService";

export function getRoleFromAuthResponse(payload) {
    const role =
        payload?.role ||
        payload?.user?.role ||
        payload?.data?.role ||
        payload?.data?.user?.role;

    return typeof role === "string" ? role.toLowerCase() : "";
}

export function getTokenFromAuthResponse(payload) {
    const token =
        payload?.token ||
        payload?.accessToken ||
        payload?.access_token ||
        payload?.data?.token ||
        payload?.data?.accessToken ||
        payload?.data?.access_token;

    return typeof token === "string" ? token : "";
}

export async function getDoctorVerificationStatus(payload) {
    const statusFromLogin = normalizeVerificationStatus(
        payload?.verificationStatus ||
        payload?.doctorVerificationStatus ||
        payload?.doctorProfile?.verificationStatus ||
        payload?.doctorProfile?.status ||
        payload?.user?.verificationStatus ||
        payload?.user?.doctorProfile?.verificationStatus ||
        payload?.data?.verificationStatus ||
        payload?.data?.doctorVerificationStatus ||
        payload?.data?.doctorProfile?.verificationStatus ||
        payload?.data?.doctorProfile?.status ||
        payload?.data?.user?.verificationStatus ||
        payload?.data?.user?.doctorProfile?.verificationStatus
    );

    if (statusFromLogin) {
        return statusFromLogin;
    }

    const profile = await getDoctorProfile();

    return normalizeVerificationStatus(
        profile?.verificationStatus ||
        profile?.status ||
        profile?.practitionerStatus?.status ||
        profile?.doctorProfile?.verificationStatus ||
        profile?.doctorProfile?.status
    );
}

export function normalizeVerificationStatus(value) {
    const status = String(value || "").trim().toLowerCase();

    if (status === "approved") return "verified";
    if (status === "verified" || status === "pending" || status === "rejected") return status;

    return "";
}

export function getDoctorVerificationMessage(status) {
    if (status === "rejected") {
        return "Akun dokter Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut.";
    }

    if (status === "pending") {
        return "Akun dokter Anda masih menunggu verifikasi admin.";
    }

    return "Status verifikasi akun dokter belum dapat dikonfirmasi. Silakan coba lagi.";
}

export function clearStoredAuth() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
}
