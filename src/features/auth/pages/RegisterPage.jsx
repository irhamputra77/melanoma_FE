import { Link } from "react-router-dom";

export default function RegisterPage() {
    return (
        <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Create your account
            </h2>
            <p className="text-slate-500 mb-8">
                Start your journey toward clinical excellence.
            </p>

            <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 mb-3">SELECT YOUR ROLE</p>
                <div className="grid grid-cols-2 gap-3">
                    <button className="bg-slate-100 p-4 rounded-xl text-left border border-blue-500">
                        <p className="font-bold">Patient</p>
                        <p className="text-xs text-slate-500">Personal health tracking</p>
                    </button>
                    <button className="bg-slate-100 p-4 rounded-xl text-left">
                        <p className="font-bold">Doctor</p>
                        <p className="text-xs text-slate-500">Clinical management</p>
                    </button>
                </div>
            </div>

            <form className="space-y-4">
                {[
                    "Name",
                    "Email Address",
                    "Phone Number",
                    "Birth Date",
                    "Gender",
                    "Password",
                    "Re-enter Password",
                ].map((item) => (
                    <input
                        key={item}
                        placeholder={item}
                        type={item.toLowerCase().includes("password") ? "password" : "text"}
                        className="w-full border-b border-slate-300 py-3 outline-none text-sm"
                    />
                ))}

                <label className="flex gap-2 text-xs text-slate-500">
                    <input type="checkbox" />
                    I agree to the Terms of Service and Privacy Policy.
                </label>

                <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold">
                    Register
                </button>
            </form>

            <p className="text-center mt-6 text-sm">
                Already have an account?{" "}
                <Link to="/auth/login" className="text-blue-600 font-bold">
                    Sign In
                </Link>
            </p>
        </div>
    );
}