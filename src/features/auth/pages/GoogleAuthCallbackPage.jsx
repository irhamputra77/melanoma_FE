import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    clearStoredAuth,
    getDoctorVerificationMessage,
    getDoctorVerificationStatus,
    getRoleFromAuthResponse,
    getTokenFromAuthResponse,
} from "../utils/authFlow";
import { setMaintenanceMode } from "../../../utils/maintenanceMode";

export default function GoogleAuthCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const finishGoogleLogin = async () => {
            const callbackParams = getGoogleCallbackParams(searchParams);
            const errorMessage = callbackParams.get("error") || callbackParams.get("message");

            if (errorMessage) {
                setError(errorMessage);
                return;
            }

            const payload = {
                token: callbackParams.get("token") ||
                    callbackParams.get("accessToken") ||
                    callbackParams.get("access_token") ||
                    callbackParams.get("jwt"),
                role: callbackParams.get("role") || callbackParams.get("userRole"),
                verificationStatus: callbackParams.get("verificationStatus") ||
                    callbackParams.get("doctorVerificationStatus"),
            };
            const token = getTokenFromAuthResponse(payload);
            const role = getRoleFromAuthResponse(payload);

            if (!token || !role) {
                setError("Google login response is incomplete. Please try again.");
                return;
            }

            sessionStorage.setItem("token", token);
            sessionStorage.setItem("role", role);

            if (role === "admin") {
                setMaintenanceMode(false);
            }

            if (role === "doctor") {
                const verificationStatus = await getDoctorVerificationStatus(payload);

                if (verificationStatus !== "verified") {
                    clearStoredAuth();
                    if (isMounted) {
                        setError(getDoctorVerificationMessage(verificationStatus));
                    }
                    return;
                }
            }

            if (!isMounted) return;

            if (role === "doctor") navigate("/doctor/dashboard", { replace: true });
            else if (role === "patient") navigate("/patient/dashboard", { replace: true });
            else if (role === "admin") navigate("/admin/dashboard", { replace: true });
            else setError("User role is missing from the authentication response.");
        };

        finishGoogleLogin().catch((error) => {
            if (isMounted) {
                setError(error.response?.data?.message || error.message || "Google login failed. Please try again.");
            }
        });

        return () => {
            isMounted = false;
        };
    }, [navigate, searchParams]);

    return (
        <div className="mx-auto w-full max-w-md pt-10 font-inter">
            <h2 className="mb-2 font-jakarta text-3xl font-bold text-slate-900">Google Login</h2>
            {!error ? (
                <p className="text-[#414753]">Completing your sign in...</p>
            ) : (
                <>
                    <p className="text-sm font-medium text-red-600">{error}</p>
                    <Link to="/auth/login" className="mt-6 inline-block font-semibold text-blue-600">
                        Back to login
                    </Link>
                </>
            )}
        </div>
    );
}

function getGoogleCallbackParams(searchParams) {
    const params = new URLSearchParams(searchParams);

    if (typeof window === "undefined") {
        return params;
    }

    const hash = window.location.hash?.replace(/^#/, "");
    if (!hash) {
        return params;
    }

    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value, key) => {
        if (!params.has(key)) {
            params.set(key, value);
        }
    });

    return params;
}
