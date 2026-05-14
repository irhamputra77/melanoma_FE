import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import GuestLayout from "../layouts/GuestLayout";

import LandingPage from "../features/guest/pages/LandingPage";
import GuestDetectionPage from "../features/guest/pages/GuestDetectionPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";

import DoctorDashboardPage from "../features/doctor/pages/DoctorDashboardPage";
import HistoricalCasePage from "../features/doctor/pages/HistoricalCasePage";
import DoctorProfilePage from "../features/doctor/pages/DoctorProfilePage";
import DoctorSettingsPage from "../features/doctor/pages/DoctorSettingsPage";

import PatientDashboardPage from "../features/patient/pages/PatientDashboardPage";
import HistoricalDataPage from "../features/patient/pages/HistoricalDataPage";
import PatientReportPage from "../features/patient/pages/PatientReportPage";
import SystemSettingsPatient from "../features/patient/pages/SystemSettingsPatient";

import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import DoctorDetailsPage from "../features/admin/pages/DoctorDetailsPage";
import UserManagementPage from "../features/admin/pages/UserManagementPage";
import SystemSettingsDoctorPage from "../features/admin/pages/SystemSettingsDoctorPage";

const dashboardRoutes = {
    doctor: {
        dashboard: <DoctorDashboardPage />,
        history: <HistoricalCasePage />,
        profile: <DoctorProfilePage />,
        settings: <DoctorSettingsPage />,
    },
    patient: {
        dashboard: <PatientDashboardPage />,
        history: <HistoricalDataPage />,
        reports: <PatientReportPage />,
        settings: <SystemSettingsPatient />,
    },
    admin: {
        dashboard: <AdminDashboardPage />,
        users: <UserManagementPage />,
        verification: <DoctorDetailsPage />,
        settings: <SystemSettingsDoctorPage />,
    },
};

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<GuestLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="detection" element={<GuestDetectionPage />} />
            </Route>

            <Route path="/auth" element={<AuthLayout />}>
                <Route index element={<Navigate to="login" replace />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
            </Route>

            <Route path="/:role" element={<ProtectedDashboardLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<RolePage page="dashboard" />} />
                <Route path="history" element={<RolePage page="history" />} />
                <Route path="profile" element={<RolePage page="profile" />} />
                <Route path="reports" element={<RolePage page="reports" />} />
                <Route path="users" element={<RolePage page="users" />} />
                <Route path="verification" element={<RolePage page="verification" />} />
                <Route path="settings" element={<RolePage page="settings" />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function ProtectedDashboardLayout() {
    const { role } = useParams();
    const [status, setStatus] = useState(() => {
        const token = localStorage.getItem("token");
        const storedRole = localStorage.getItem("role");

        return token && storedRole === role ? "authenticated" : "unauthenticated";
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedRole = localStorage.getItem("role");

        setStatus(token && storedRole === role ? "authenticated" : "unauthenticated");
    }, [role]);

    if (!dashboardRoutes[role]) {
        return <Navigate to="/auth/login" replace />;
    }

    if (status === "unauthenticated") {
        return <Navigate to="/auth/login" replace />;
    }

    if (status === "checking") {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500">
                Loading session...
            </div>
        );
    }

    return <DashboardLayout />;
}

function RolePage({ page }) {
    const { role } = useParams();
    const element = dashboardRoutes[role]?.[page];

    return element || <Navigate to={`/${role}/dashboard`} replace />;
}
