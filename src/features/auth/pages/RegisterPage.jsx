import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleCheck, Upload } from "lucide-react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
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
const minBirthDate = "1900-01-01";
const maxBirthDate = new Date().toISOString().slice(0, 10);
const minPhoneDigits = 10;
const maxPhoneDigits = 15;

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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        const nextValue = name === "phone" ? sanitizePhoneInput(value) : value;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : nextValue,
        }));
    };

    const handleBirthDateChange = (event) => {
        const { value } = event.target;

        if (value && !isNativeBirthDateAllowed(value)) {
            return;
        }

        setForm((current) => ({
            ...current,
            birthDate: value,
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
                    {error && <ErrorMessage message={error} />}

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
                {error && <ErrorMessage message={error} />}

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
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    minLength={minPhoneDigits}
                    maxLength={18}
                    pattern="^\+?[0-9\s().-]{10,18}$"
                    title="Nomor telepon harus berisi 10 sampai 15 digit. Boleh diawali +."
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border-b border-slate-300 py-3 outline-none text-sm"
                />
                <p className="-mt-2 text-[11px] font-medium text-slate-500">
                    Gunakan 10-15 digit, boleh diawali +. Contoh: +6281234567890.
                </p>
                <input
                    name="birthDate"
                    placeholder="Birth Date"
                    title="Birth Date"
                    type="date"
                    min={minBirthDate}
                    max={maxBirthDate}
                    value={form.birthDate}
                    onChange={handleBirthDateChange}
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
                <PasswordField
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    visible={showPassword}
                    onChange={handleChange}
                    onToggle={() => setShowPassword((current) => !current)}
                    autoComplete="new-password"
                />
                <PasswordField
                    name="confirmPassword"
                    placeholder="Re-enter Password"
                    value={form.confirmPassword}
                    visible={showConfirmPassword}
                    onChange={handleChange}
                    onToggle={() => setShowConfirmPassword((current) => !current)}
                    autoComplete="new-password"
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

function PasswordField({ name, placeholder, value, visible, onChange, onToggle, autoComplete }) {
    return (
        <div className="relative">
            <input
                name={name}
                placeholder={placeholder}
                type={visible ? "text" : "password"}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                className="w-full border-b border-slate-300 py-3 pr-9 outline-none text-sm"
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600"
                aria-label={visible ? `Hide ${placeholder}` : `Show ${placeholder}`}
            >
                {visible ? <AiFillEyeInvisible size={19} /> : <AiFillEye size={19} />}
            </button>
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

    const phoneError = getPhoneValidationError(form.phone);
    if (phoneError) return phoneError;

    if (form.birthDate.trim() && !normalizeBirthDateInput(form.birthDate)) {
        return "Tanggal lahir tidak valid.";
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
    const birthDate = normalizeBirthDateInput(form.birthDate);
    const phone = normalizePhoneNumber(form.phone);

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

        if (phone) payload.append("phoneNumber", phone);
        if (birthDate) payload.append("birthDate", birthDate);
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

    if (phone) {
        payload.phone = phone;
    }

    if (birthDate) {
        payload.birthDate = birthDate;
    }

    return payload;
}

function sanitizePhoneInput(value) {
    return String(value || "").replace(/[^\d+\s().-]/g, "").replace(/(?!^)\+/g, "");
}

function normalizePhoneNumber(value) {
    const text = sanitizePhoneInput(value).trim();
    if (!text) return "";

    const hasPlus = text.startsWith("+");
    const digits = text.replace(/\D/g, "");
    return `${hasPlus ? "+" : ""}${digits}`;
}

function getPhoneValidationError(value) {
    const text = String(value || "").trim();
    if (!text) return "";

    if (!/^\+?[\d\s().-]+$/.test(text)) {
        return "Nomor telepon hanya boleh berisi angka, spasi, tanda +, titik, strip, atau kurung.";
    }

    const normalized = normalizePhoneNumber(text);
    const digitCount = normalized.replace(/\D/g, "").length;

    if (digitCount < minPhoneDigits) {
        return `Nomor telepon minimal ${minPhoneDigits} digit.`;
    }

    if (digitCount > maxPhoneDigits) {
        return `Nomor telepon maksimal ${maxPhoneDigits} digit.`;
    }

    if (normalized.includes("+") && !normalized.startsWith("+")) {
        return "Tanda + hanya boleh berada di awal nomor telepon.";
    }

    return "";
}

function normalizeBirthDateInput(value) {
    const text = String(value || "").trim();
    if (!text) return "";

    const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (isoMatch) {
        return buildValidDate(isoMatch[1], isoMatch[2], isoMatch[3]);
    }

    const localMatch = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (localMatch) {
        return buildValidDate(localMatch[3], localMatch[2], localMatch[1]);
    }

    const compactMatch = text.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (compactMatch) {
        return buildValidDate(compactMatch[3], compactMatch[2], compactMatch[1]);
    }

    return "";
}

function isNativeBirthDateAllowed(value) {
    const normalized = normalizeBirthDateInput(value);
    return Boolean(normalized && normalized >= minBirthDate && normalized <= maxBirthDate);
}

function buildValidDate(yearValue, monthValue, dayValue) {
    const year = Number(yearValue);
    const month = Number(monthValue);
    const day = Number(dayValue);
    const currentYear = new Date().getFullYear();

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day) ||
        year < 1900 ||
        year > currentYear ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return "";
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return "";
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
