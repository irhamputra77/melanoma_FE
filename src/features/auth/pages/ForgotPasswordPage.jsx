import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { requestPasswordReset } from "../services/authService";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setResult(null);

        if (!email.trim()) {
            setError("Email harus disediakan");
            return;
        }

        setLoading(true);

        try {
            const response = await requestPasswordReset(email.trim());
            setResult(response);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                error.message ||
                "Failed to send reset instructions."
            );
        } finally {
            setLoading(false);
        }
    };

    const resetToken = result?.resetToken;

    return (
        <div className="w-full max-w-md mx-auto pt-16 font-inter">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <MailCheck size={28} />
            </div>

            <h2 className="mb-2 text-3xl font-bold text-slate-900 font-jakarta">
                Forgot password?
            </h2>
            <p className="mb-10 leading-relaxed text-[#414753]">
                Enter your account email and we will send reset instructions if it is registered.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <p className="text-sm font-medium text-red-600">
                        {error}
                    </p>
                )}

                {result?.message && (
                    <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                        {result.message}
                    </div>
                )}

                {resetToken && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">
                            Development Token
                        </p>
                        <p className="mt-3 break-all rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                            {resetToken}
                        </p>
                        {result?.expiresAt && (
                            <p className="mt-3 text-xs font-medium text-slate-500">
                                Expires at {new Date(result.expiresAt).toLocaleString()}
                            </p>
                        )}
                        <Link
                            to={`/auth/reset-password?token=${encodeURIComponent(resetToken)}`}
                            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"
                        >
                            Continue to reset password
                        </Link>
                    </div>
                )}

                <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full border-b border-slate-300 py-3 outline-none"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#005AB6] py-4 font-semibold text-white shadow-lg disabled:bg-blue-300"
                >
                    {loading ? "Sending..." : "Send Reset Link"}
                </button>
            </form>

            <p className="mt-8 text-center text-sm">
                Remember your password?{" "}
                <Link to="/auth/login" className="font-bold text-[#005AB6]">
                    Back to login
                </Link>
            </p>
        </div>
    );
}
