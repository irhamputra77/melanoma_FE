import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleCheck, Upload } from "lucide-react";
import profileDoctor from "../../../assets/login_doctor_profile.png";
import { getEmailValidationError, normalizeEmail } from "../../../utils/emailValidation";
import { getActiveClinics, register } from "../services/authService";

const initialForm = {
    role: "patient",
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
    password: "",
    confirmPassword: "",
    agreed: false,
};

const initialDoctorProfile = {
    specialization: "",
    licenseNumber: "",
    medicalLicense: null,
    profilePhoto: null,
    clinicId: "",
};

export default function RegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState("main");
    const [form, setForm] = useState(initialForm);
    const [doctorProfile, setDoctorProfile] = useState(initialDoctorProfile);
    const [clinics, setClinics] = useState([]);
    const [clinicLoading, setClinicLoading] = useState(false);
    const [clinicFetchError, setClinicFetchError] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const isDoctorProfileStep = form.role === "doctor" && step === "doctorProfile";

    useEffect(() => {
        const fetchClinics = async () => {
            setClinicFetchError("");
            setClinicLoading(true);

            try {
                const list = await getActiveClinics();
                setClinics(list);
            } catch (error) {
                setClinicFetchError("Gagal memuat daftar clinic. Silakan muat ulang halaman.");
            } finally {
                setClinicLoading(false);
            }
        };

        fetchClinics();
    }, []);

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
        const file = files?.[0];

        if (name === "medicalLicense" && file) {
            const fileError = validateMedicalLicenseFile(file);
            if (fileError) {
                setError(fileError);
                event.target.value = "";
                return;
            }
        }

        setDoctorProfile((current) => ({
            ...current,
            [name]: file || value,
        }));
        setError("");
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

        if (!doctorProfile.clinicId) {
            setError("Clinic wajib dipilih untuk registrasi dokter.");
            return;
        }

        await submitRegistration();
    };

    const submitRegistration = async () => {
        setLoading(true);

        try {
            await register(buildRegisterPayload(form, doctorProfile));

            if (form.role === "doctor") {
                setStep("success");
                return;
            }

            navigate("/auth/login");
        } catch (error) {
            setError(
                getRegisterErrorMessage(error) ||
                error.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (step === "success" && form.role === "doctor") {
        return (
            <div className="w-full max-w-md mx-auto pt-24 text-center font-inter">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl font-bold text-emerald-600">
                    <CircleCheck size={32} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3 font-jakarta">
                    Registration successful
                </h2>
                <p className="mx-auto max-w-sm text-slate-600 leading-relaxed">
                    Your account has been created successfully. Your doctor registration will be reviewed and processed by the admin team.
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/auth/login")}
                    className="mt-8 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                >
                    Back to Login
                </button>
            </div>
        );
    }

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
                            Clinic
                        </label>
                        <select
                            name="clinicId"
                            value={doctorProfile.clinicId}
                            onChange={handleDoctorProfileChange}
                            className="w-full h-10 rounded-lg border border-slate-300 bg-slate-100 px-3 outline-none focus:border-blue-500 focus:bg-white"
                        >
                            <option value="">Select a clinic</option>
                            {Array.isArray(clinics) && clinics.map((clinic) => (
                                <option key={clinic.clinicId} value={clinic.clinicId}>
                                    {clinic.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-2 text-xs text-slate-500">
                            Klinik Anda tidak terdaftar?{' '}
                            <Link to="/auth/register-clinic" className="font-bold text-blue-600">Daftarkan klinik Anda di sini</Link>
                        </p>
                        {clinicLoading && (
                            <p className="mt-2 text-xs text-slate-500">Loading clinics...</p>
                        )}
                        {clinicFetchError && (
                            <p className="mt-2 text-xs text-red-600">{clinicFetchError}</p>
                        )}
                    </div>

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
                            Medical License Number
                        </label>
                        <input
                            type="text"
                            name="licenseNumber"
                            value={doctorProfile.licenseNumber}
                            onChange={handleDoctorProfileChange}
                            placeholder="e.g. DRS-2023-001"
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
                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 text-slate-700">
                                <img src={profileDoctor} alt="Doctor profile" className="h-full w-full object-cover" />
                            </div>
                            <div>
                                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-4 text-sm font-medium text-slate-700 hover:bg-blue-50">
                                    <Upload size={17} />
                                    <span>{doctorProfile.profilePhoto?.name || "Add Photo profile"}</span>
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

            <form noValidate onSubmit={handleMainSubmit} className="space-y-4">
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
                    maxLength={254}
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border-b border-slate-300 py-3 outline-none text-sm"
                />
                <input
                    name="phone"
                    placeholder="Phone Number"
                    value={form.phone}
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
                    {loading ? "Registering..." : "Register"}
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
        form.gender,
        form.password,
        form.confirmPassword,
    ];

    if (requiredFields.some((field) => !field.trim())) {
        return "Semua field utama wajib diisi.";
    }

    const emailError = getEmailValidationError(form.email);
    if (emailError) return emailError;

    if (form.password.length < 6) {
        return "Password minimal 6 karakter.";
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
    const email = normalizeEmail(form.email);

    if (form.role === "doctor") {
        const payload = new FormData();
        payload.append("role", "doctor");
        payload.append("fullName", form.name);
        payload.append("email", email);
        payload.append("gender", form.gender);
        payload.append("password", form.password);
        payload.append("clinicId", doctorProfile.clinicId);

        if (doctorProfile.specialization.trim()) {
            payload.append("specialization", doctorProfile.specialization);
        }

        if (doctorProfile.licenseNumber.trim()) {
            payload.append("licenseNumber", doctorProfile.licenseNumber);
        }

        if (form.phone.trim()) payload.append("phoneNumber", form.phone);
        if (form.birthDate) payload.append("birthDate", form.birthDate);
        if (doctorProfile.medicalLicense) payload.append("medicalLicense", doctorProfile.medicalLicense);

        return payload;
    }

    const payload = {
        role: "patient",
        name: form.name,
        email,
        gender: form.gender,
        password: form.password,
    };

    if (form.phone.trim()) {
        payload.phone = form.phone;
    }

    if (form.birthDate) {
        payload.birthDate = form.birthDate;
    }

    return payload;
}

function validateMedicalLicenseFile(file) {
    if (file.type !== "application/pdf") {
        return "Medical license harus berupa file PDF.";
    }

    if (file.size > 5 * 1024 * 1024) {
        return "Ukuran medical license maksimal 5MB.";
    }

    return "";
}

function getRegisterErrorMessage(error) {
    const payload = error.response?.data;
    const message =
        payload?.message ||
        payload?.error ||
        payload?.data?.message ||
        payload?.data?.error;

    if (message) {
        if (message.includes("clinicId harus disediakan untuk registrasi dokter")) {
            return "Dokter wajib memilih clinic.";
        }

        if (message.includes("Clinic tidak ditemukan atau tidak aktif")) {
            return "Clinic yang dipilih tidak valid atau sudah tidak aktif.";
        }

        return message;
    }

    const errors = payload?.errors || payload?.data?.errors;

    if (!errors || typeof errors !== "object") {
        return "";
    }

    return Object.values(errors)
        .flat()
        .filter(Boolean)
        .join(" ");
}
