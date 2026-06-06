import { Link, useNavigate } from "react-router-dom";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import React, { useState } from "react";
import { getGoogleLoginUrl, login } from "../services/authService";
import { isMaintenanceModeEnabled, setMaintenanceMode } from "../../../utils/maintenanceMode";
import {
    clearStoredAuth,
    getDoctorVerificationMessage,
    getDoctorVerificationStatus,
    getRoleFromAuthResponse,
    getTokenFromAuthResponse,
} from "../utils/authFlow";

export default function LoginPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = React.useState(false);

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const loginData = await login(form);
            const token = getTokenFromAuthResponse(loginData);

            if (token) {
                sessionStorage.setItem("token", token);
            }

            const role = getRoleFromAuthResponse(loginData);

            if (role) {
                sessionStorage.setItem("role", role);
            }

            if (role === "admin") {
                setMaintenanceMode(false);
            }

            if (role !== "admin" && isMaintenanceModeEnabled()) {
                navigate("/maintenance", { replace: true });
                return;
            }

            if (role === "doctor") {
                const verificationStatus = await getDoctorVerificationStatus(loginData);

                if (verificationStatus !== "verified") {
                    clearStoredAuth();
                    setError(getDoctorVerificationMessage(verificationStatus));
                    return;
                }

                navigate("/doctor/dashboard");
            } else if (role === "patient") {
                navigate("/patient/dashboard");
            } else if (role === "admin") {
                navigate("/admin/dashboard");
            } else {
                throw new Error("User role is missing from the authentication response.");
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                error.message ||
                "Login failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    }

    const handleGoogleLogin = () => {
        setGoogleLoading(true);
        setError("");
        window.location.assign(getGoogleLoginUrl());
    };

    return (
        <div className="w-full max-w-md mx-auto pt-10 font-inter">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 font-jakarta">Welcome Back</h2>
            <p className="text-[#414753] mb-10">
                Please enter your details to continue your journey.
            </p>

            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <p className="text-sm font-medium text-red-600">
                        {error}
                    </p>
                )}

                <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full border-b border-slate-300 py-3 outline-none"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                />
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="w-full border-b border-slate-300 py-3 outline-none"
                        name="password"
                        autoComplete="current-password"
                        value={form.password}
                        onChange={handleChange}
                    />
                    <span
                        className="absolute right-0 top-[calc(50%-12px)] cursor-pointer text-[#414753]"
                        onClick={togglePasswordVisibility}
                    >
                        {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                    </span>
                </div>


                <div className="flex justify-between text-sm">
                    <label className="flex gap-2 items-center">
                        <input type="checkbox" />
                        Remember me
                    </label>
                    <Link to="/auth/forgot-password" className="text-blue-600 font-semibold">
                        Forgot password?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#005AB6] text-white py-4 rounded-xl font-semibold shadow-lg"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            <div className="my-8 text-center text-xs font-bold text-[#414753]">
                OR CONTINUE WITH
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold disabled:text-slate-400"
            >
                {googleLoading ? "Redirecting..." : "Google"}
            </button>

            <p className="text-center mt-8 text-sm">
                New to MySkin?{" "}
                <Link to="/auth/register" className="text-[#005AB6] font-bold">
                    Create an account
                </Link>
            </p>
        </div>
    );
}
