import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Upload, UserCircle } from "lucide-react";
import { register } from "../services/authService";

const initialForm = {
    role: "patient",
    name: "",
    email: "",
    phoneNumber: "",
    birthDate: "",
    gender: "",
    password: "",
    confirmPassword: "",
    agreed: false,
};

const initialDoctorProfile = {
    specialization: "",
    medicalLicense: null,
    profilePhoto: null,
};

export default function RegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState("main");
    const [form, setForm] = useState(initialForm);
    const [doctorProfile, setDoctorProfile] = useState(initialDoctorProfile);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isDoctorProfileStep = form.role === "doctor" && step === "doctorProfile";

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleRoleChange = (role) => {
        setError("");
        setStep("main");
        setForm((current) => ({
            ...current,
            role,
        }));
    };

    const handleDoctorProfileChange = (event) => {
        const { name, value, files } = event.target;

        setDoctorProfile((current) => ({
            ...current,
            [name]: files ? files[0] : value,
        }));
    };

    const handleMainSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const validationError = validateMainForm(form);

        if (validationError) {
            setError(validationError);
            return;
        }

        if (form.role === "doctor") {
            setStep("doctorProfile");
            return;
        }

        await submitRegistration();
    };

    const handleDoctorProfileSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!doctorProfile.specialization.trim()) {
            setError("Specialization wajib diisi.");
            return;
        }

        if (!doctorProfile.medicalLicense) {
            setError("Medical license PDF wajib diunggah.");
            return;
        }

        if (!doctorProfile.profilePhoto) {
            setError("Profile photo wajib diunggah.");
            return;
        }

        await submitRegistration();
    };

    const submitRegistration = async () => {
        setLoading(true);

        try {
            await register(buildRegisterPayload(form, doctorProfile));
            navigate("/auth/login");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                error.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (isDoctorProfileStep) {
        return (
            <div className="w-full max-w-md mx-auto pt-10 font-inter">
                <h2 className="text-3xl font-bold text-slate-900 mb-3 font-jakarta">
                    Complete your profile
                </h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                    Please provide additional information to verify your account.
                </p>

                <form onSubmit={handleDoctorProfileSubmit} className="space-y-5">
                    {error && (
                        <p className="text-sm font-medium text-red-600">
                            {error}
                        </p>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                            Specialization
                        </label>
                        <input
                            type="text"
                            name="specialization"
                            value={doctorProfile.specialization}
                            onChange={handleDoctorProfileChange}
                            className="w-full h-10 rounded-lg border border-slate-300 bg-slate-100 px-3 outline-none focus:border-blue-500 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                            Medical License (PDF)
                        </label>
                        <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50">
                            <Upload size={17} />
                            <span>{doctorProfile.medicalLicense?.name || "Upload PDF file"}</span>
                            <input
                                type="file"
                                name="medicalLicense"
                                accept="application/pdf,.pdf"
                                onChange={handleDoctorProfileChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-3">
                            Profile Photo
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-slate-700">
                                <UserCircle size={42} />
                            </div>
                            <div>
                                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-4 text-sm font-medium text-slate-700 hover:bg-blue-50">
                                    <Upload size={17} />
                                    <span>{doctorProfile.profilePhoto?.name || "Upload Photo"}</span>
                                    <input
                                        type="file"
                                        name="profilePhoto"
                                        accept="image/jpeg,image/png,image/gif"
                                        onChange={handleDoctorProfileChange}
                                        className="hidden"
                                    />
                                </label>
                                <p className="mt-2 text-xs text-slate-500">
                                    JPG, PNG or GIF (max. 5MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {loading ? "Completing..." : "Complete Registration"}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Need to edit previous details?{" "}
                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setStep("main");
                        }}
                        className="font-bold text-blue-600"
                    >
                        Go Back
                    </button>
                </p>
            </div>
        );
    }

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
                    <RoleButton
                        active={form.role === "patient"}
                        title="Patient"
                        description="Personal health tracking"
                        onClick={() => handleRoleChange("patient")}
                    />
                    <RoleButton
                        active={form.role === "doctor"}
                        title="Doctor"
                        description="Clinical management"
                        onClick={() => handleRoleChange("doctor")}
                    />
                </div>
            </div>

            <form onSubmit={handleMainSubmit} className="space-y-4">
                {error && (
                    <p className="text-sm font-medium text-red-600">
                        {error}
                    </p>
                )}

                <input
                    name="name"
                    placeholder="Name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border-b border-slate-300 py-3 outline-none text-sm"
                />
                <input
                    name="email"
                    placeholder="Email Address"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border-b border-slate-300 py-3 outline-none text-sm"
                />
                <input
                    name="phoneNumber"
                    placeholder="Phone Number"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    className="w-full border-b border-slate-300 py-3 outline-none text-sm"
                />
                <input
                    name="birthDate"
                    placeholder="Birth Date"
                    type="text"
                    value={form.birthDate}
                    onChange={handleChange}
                    onFocus={(event) => {
                        event.target.type = "date";
                    }}
                    onBlur={(event) => {
                        if (!event.target.value) {
                            event.target.type = "text";
                        }
                    }}
                    className="w-full border-b border-slate-300 py-3 outline-none text-sm"
                />
                <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full border-b border-slate-300 py-3 outline-none text-sm text-slate-500 bg-white"
                >
                    <option value="">Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
                <input
                    name="password"
                    placeholder="Password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full border-b border-slate-300 py-3 outline-none text-sm"
                />
                <input
                    name="confirmPassword"
                    placeholder="Re-enter Password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="w-full border-b border-slate-300 py-3 outline-none text-sm"
                />

                <label className="flex gap-2 text-xs text-slate-500">
                    <input
                        type="checkbox"
                        name="agreed"
                        checked={form.agreed}
                        onChange={handleChange}
                    />
                    I agree to the Terms of Service and Privacy Policy.
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold disabled:bg-blue-300"
                >
                    {form.role === "doctor" ? "Continue" : loading ? "Registering..." : "Register"}
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

function RoleButton({ active, title, description, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`bg-slate-100 p-4 rounded-xl text-left border ${active ? "border-blue-500" : "border-transparent"}`}
        >
            <p className="font-bold">{title}</p>
            <p className="text-xs text-slate-500">{description}</p>
        </button>
    );
}

function validateMainForm(form) {
    const requiredFields = [
        form.name,
        form.email,
        form.phoneNumber,
        form.birthDate,
        form.gender,
        form.password,
        form.confirmPassword,
    ];

    if (requiredFields.some((field) => !field.trim())) {
        return "Semua field utama wajib diisi.";
    }

    if (form.password !== form.confirmPassword) {
        return "Password dan konfirmasi password tidak sama.";
    }

    if (!form.agreed) {
        return "Anda harus menyetujui Terms of Service dan Privacy Policy.";
    }

    return "";
}

function buildRegisterPayload(form, doctorProfile) {
    const basePayload = {
        role: form.role,
        name: form.name,
        email: form.email,
        phoneNumber: form.phoneNumber,
        birthDate: form.birthDate,
        gender: form.gender,
        password: form.password,
        password_confirmation: form.confirmPassword,
    };

    if (form.role !== "doctor") {
        return basePayload;
    }

    const payload = new FormData();

    Object.entries(basePayload).forEach(([key, value]) => {
        payload.append(key, value);
    });

    payload.append("specialization", doctorProfile.specialization);
    payload.append("medicalLicense", doctorProfile.medicalLicense);
    payload.append("profilePhoto", doctorProfile.profilePhoto);

    return payload;
}
