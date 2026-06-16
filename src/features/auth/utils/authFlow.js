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
        payload?.jwt ||
        payload?.data?.token ||
        payload?.data?.accessToken ||
        payload?.data?.access_token ||
        payload?.data?.jwt;

    return typeof token === "string" ? token : "";
}

export async function getDoctorVerificationStatus(payload) {
    const statusFromLogin = normalizeFirstVerificationStatus([
        payload?.verificationStatus,
        payload?.doctorVerificationStatus,
        payload?.practitionerStatus?.status,
        payload?.practitionerStatus,
        payload?.doctorStatus,
        payload?.isVerified,
        payload?.doctorProfile?.verificationStatus,
        payload?.doctorProfile?.status,
        payload?.doctorProfile?.practitionerStatus?.status,
        payload?.doctorProfile?.practitionerStatus,
        payload?.doctorProfile?.isVerified,
        payload?.user?.verificationStatus,
        payload?.user?.doctorStatus,
        payload?.user?.isVerified,
        payload?.user?.doctorProfile?.verificationStatus,
        payload?.user?.doctorProfile?.status,
        payload?.user?.doctorProfile?.practitionerStatus?.status,
        payload?.user?.doctorProfile?.practitionerStatus,
        payload?.user?.doctorProfile?.isVerified,
        payload?.data?.verificationStatus,
        payload?.data?.doctorVerificationStatus,
        payload?.data?.practitionerStatus?.status,
        payload?.data?.practitionerStatus,
        payload?.data?.doctorStatus,
        payload?.data?.isVerified,
        payload?.data?.doctorProfile?.verificationStatus,
        payload?.data?.doctorProfile?.status,
        payload?.data?.doctorProfile?.practitionerStatus?.status,
        payload?.data?.doctorProfile?.practitionerStatus,
        payload?.data?.doctorProfile?.isVerified,
        payload?.data?.user?.verificationStatus,
        payload?.data?.user?.doctorStatus,
        payload?.data?.user?.isVerified,
        payload?.data?.user?.doctorProfile?.verificationStatus,
        payload?.data?.user?.doctorProfile?.status,
        payload?.data?.user?.doctorProfile?.practitionerStatus?.status,
        payload?.data?.user?.doctorProfile?.practitionerStatus,
        payload?.data?.user?.doctorProfile?.isVerified,
    ]);

    if (statusFromLogin) {
        return statusFromLogin;
    }

    const profile = await getDoctorProfile();

    return normalizeFirstVerificationStatus([
        profile?.verificationStatus,
        profile?.status,
        profile?.doctorStatus,
        profile?.isVerified,
        profile?.practitionerStatus?.status,
        profile?.practitionerStatus,
        profile?.doctorProfile?.verificationStatus,
        profile?.doctorProfile?.status,
        profile?.doctorProfile?.doctorStatus,
        profile?.doctorProfile?.isVerified,
        profile?.doctorProfile?.practitionerStatus?.status,
        profile?.doctorProfile?.practitionerStatus,
        profile?.user?.verificationStatus,
        profile?.user?.doctorStatus,
        profile?.user?.isVerified,
        profile?.user?.doctorProfile?.verificationStatus,
        profile?.user?.doctorProfile?.status,
        profile?.user?.doctorProfile?.isVerified,
        profile?.user?.doctorProfile?.practitionerStatus?.status,
        profile?.user?.doctorProfile?.practitionerStatus,
    ]);
}

function normalizeFirstVerificationStatus(values) {
    for (const value of values) {
        const status = normalizeVerificationStatus(value);
        if (status) return status;
    }

    return "";
}

export function normalizeVerificationStatus(value) {
    if (value === true) return "verified";
    if (value === false) return "pending";

    const status = String(value || "").trim().toLowerCase();
    const normalizedStatus = status.replace(/[\s-]+/g, "_");

    if (["approved", "active", "accepted", "verified", "approved_by_admin"].includes(normalizedStatus)) return "verified";
    if (["pending", "pending_review", "waiting", "unverified", "inactive"].includes(normalizedStatus)) return "pending";
    if (["rejected", "declined", "denied", "blocked", "suspended"].includes(normalizedStatus)) return "rejected";

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
