import { Link, useNavigate } from "react-router-dom";

export default function LoginPage() {
    const navigate = useNavigate();

    return (
        <div className="max-w-md mx-auto pt-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 mb-10">
                Please enter your details to continue your journey.
            </p>

            <form className="space-y-6">
                <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full border-b border-slate-300 py-3 outline-none"
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full border-b border-slate-300 py-3 outline-none"
                />

                <div className="flex justify-between text-sm">
                    <label className="flex gap-2 items-center">
                        <input type="checkbox" />
                        Remember me
                    </label>
                    <a className="text-blue-600 font-semibold">Forgot password?</a>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/doctor/dashboard")}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold shadow-lg"
                >
                    Sign In
                </button>
            </form>

            <div className="my-8 text-center text-xs font-bold text-slate-400">
                OR CONTINUE WITH
            </div>

            <button className="w-full bg-slate-100 py-3 rounded-xl font-semibold text-sm">
                Google
            </button>

            <p className="text-center mt-8 text-sm">
                New to MySkin?{" "}
                <Link to="/auth/register" className="text-blue-600 font-bold">
                    Create an account
                </Link>
            </p>
        </div>
    );
}