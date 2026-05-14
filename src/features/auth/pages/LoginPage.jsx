import { Link, useNavigate } from "react-router-dom";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import React, { useState } from "react";
import { login } from "../services/authService";

export default function LoginPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = React.useState(false);

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
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
                localStorage.setItem("token", token);
            }

            const role = getRoleFromAuthResponse(loginData);

            if (role) {
                localStorage.setItem("role", role);
            }

            if (role === "doctor") {
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
                    <a className="text-blue-600 font-semibold">Forgot password?</a>
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

            <button className="w-full bg-slate-100 py-3 rounded-xl font-semibold text-sm">
                Google
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

function getRoleFromAuthResponse(payload) {
    const role =
        payload?.role ||
        payload?.user?.role ||
        payload?.data?.role ||
        payload?.data?.user?.role;

    return typeof role === "string" ? role.toLowerCase() : "";
}

function getTokenFromAuthResponse(payload) {
    const token =
        payload?.token ||
        payload?.accessToken ||
        payload?.access_token ||
        payload?.data?.token ||
        payload?.data?.accessToken ||
        payload?.data?.access_token;

    return typeof token === "string" ? token : "";
}
