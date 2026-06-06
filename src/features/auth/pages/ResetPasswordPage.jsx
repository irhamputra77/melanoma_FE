import { Link, useSearchParams } from "react-router-dom";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { resetPassword } from "../services/authService";

const initialForm = {
    password: "",
    confirmPassword: "",
};

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const [form, setForm] = useState(initialForm);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [resetComplete, setResetComplete] = useState(false);
    const token = searchParams.get("token") || "";

    const handleChange = (event) => {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        const validationError = validateResetForm(token, form);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const response = await resetPassword({
                token,
                password: form.password,
            });
            setSuccess(response?.message || "Password berhasil direset");
            setResetComplete(true);
            setForm(initialForm);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                error.message ||
                "Failed to reset password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto pt-16 font-inter">
            <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl ${resetComplete ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                {resetComplete ? <CheckCircle2 size={29} /> : <ShieldCheck size={29} />}
            </div>

            <h2 className="mb-2 text-3xl font-bold text-slate-900 font-jakarta">
                {resetComplete ? "Password updated" : "Create new password"}
            </h2>
            <p className="mb-10 leading-relaxed text-[#414753]">
                {resetComplete
                    ? "Your password has been changed successfully. Please login again with your new password."
                    : "Set a secure new password for your MySkin account."}
            </p>

            {resetComplete ? (
                <div className="space-y-6">
                    <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                        {success || "Password berhasil direset"}
                    </div>

                    <Link
                        to="/auth/login"
                        className="block w-full rounded-xl bg-[#005AB6] py-4 text-center font-semibold text-white shadow-lg"
                    >
                        Back to login
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <ErrorMessage message={error} />}

                    {!token && (
                        <div className="rounded-2xl bg-amber-50 px-5 py-4 text-sm font-medium text-amber-700">
                            Token reset password harus disediakan
                        </div>
                    )}

                    <PasswordField
                        name="password"
                        placeholder="New Password"
                        autoComplete="new-password"
                        value={form.password}
                        showPassword={showPassword}
                        onChange={handleChange}
                        onToggle={() => setShowPassword((current) => !current)}
                    />

                    <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm New Password"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className="w-full border-b border-slate-300 py-3 outline-none"
                    />

                    <button
                        type="submit"
                        disabled={loading || !token}
                        className="w-full rounded-xl bg-[#005AB6] py-4 font-semibold text-white shadow-lg disabled:bg-blue-300"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            )}

            {!resetComplete && (
                <p className="mt-8 text-center text-sm">
                    Back to{" "}
                    <Link to="/auth/login" className="font-bold text-[#005AB6]">
                        Login
                    </Link>
                </p>
            )}
        </div>
    );
}

function PasswordField({
    name,
    placeholder,
    autoComplete,
    value,
    showPassword,
    onChange,
    onToggle,
}) {
    return (
        <div className="relative">
            <input
                type={showPassword ? "text" : "password"}
                name={name}
                placeholder={placeholder}
                autoComplete={autoComplete}
                value={value}
                onChange={onChange}
                className="w-full border-b border-slate-300 py-3 pr-8 outline-none"
            />
            <button
                type="button"
                className="absolute right-0 top-[calc(50%-12px)] cursor-pointer text-[#414753]"
                onClick={onToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
            </button>
        </div>
    );
}

function ErrorMessage({ message }) {
    const messages = splitErrorMessage(message);

    return (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {messages.length > 1 ? (
                <ul className="list-disc space-y-1 pl-5">
                    {messages.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            ) : (
                <p>{messages[0] || message}</p>
            )}
        </div>
    );
}

function splitErrorMessage(message) {
    return String(message || "")
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean);
}

function validateResetForm(token, form) {
    if (!token) {
        return "Token reset password harus disediakan";
    }

    if (!form.password) {
        return "Password baru wajib diisi.";
    }

    if (form.password !== form.confirmPassword) {
        return "Konfirmasi password tidak sama.";
    }

    return "";
}
