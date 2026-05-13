import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import GuestLayout from "../layouts/GuestLayout";

import LandingPage from "../features/guest/pages/LandingPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import { getCurrentUser } from "../features/auth/services/authService";

import DoctorDashboardPage from "../features/doctor/pages/DoctorDashboardPage";
import HistoricalCasePage from "../features/doctor/pages/HistoricalCasePage";
import DoctorSettingsPage from "../features/doctor/pages/DoctorSettingsPage";

import PatientDashboardPage from "../features/patient/pages/PatientDashboardPage";
import HistoricalDataPage from "../features/patient/pages/HistoricalDataPage";
import PatientReportPage from "../features/patient/pages/PatientReportPage";
import SystemSettingsPatient from "../features/patient/pages/SystemSettingsPatient";

import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import DoctorDetailsPage from "../features/admin/pages/DoctorDetailsPage";
import UserManagementPage from "../features/admin/pages/UserManagementPage";
import SystemSettingsDoctorPage from "../features/admin/pages/SystemSettingsDoctorPage";
import GuestDetectionPage from "../features/guest/pages/GuestDetectionPage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<GuestLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="detection" element={<GuestDetectionPage />}></Route>
            </Route>

            <Route path="/auth" element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
            </Route>

            <Route path="/:role" element={<ProtectedDashboardLayout />}>
                <Route path="dashboard" element={<RoleDashboard />} />

                <Route path="history" element={<HistoricalCasePage />} />

                <Route path="/patient" element={<DashboardLayout />}>
                    <Route path="dashboard" element={<PatientDashboardPage />} />
                    <Route path="history" element={<HistoricalDataPage />} />
                    <Route path="reports" element={<PatientReportPage />} />

                    <Route path="/admin" element={<DashboardLayout />}>
                        <Route path="dashboard" element={<AdminDashboardPage />} />
                        <Route path="users" element={<UserManagementPage />} />
                        <Route path="verification" element={<DoctorDetailsPage />} />
                        <Route path="settings" element={<RoleSettings />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                );
}

                function RoleDashboard() {
    const role = window.location.pathname.split("/")[1];

                if (role === "doctor") return <DoctorDashboardPage />;
                if (role === "patient") return <PatientDashboardPage />;
                if (role === "admin") return <AdminDashboardPage />;

                return <Navigate to="/auth/login" replace />;
}

                function ProtectedDashboardLayout() {
    const [status, setStatus] = useState("checking");

    useEffect(() => {
                    let isMounted = true;

                getCurrentUser()
            .then(() => {
                if (isMounted) {
                    setStatus("authenticated");
                }
            })
            .catch((error) => {
                    localStorage.removeItem("token");
                localStorage.removeItem("role");

                if (error.response?.status === 401) {
                    window.location.replace("/auth/login");
                return;
                }

                if (isMounted) {
                    setStatus("authenticated");
                }
            });

        return () => {
                    isMounted = false;
        };
    }, []);

                if (status === "checking") {
        return (
                <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500">
                    Loading session...
                </div>
                );
    }

                return <DashboardLayout />;
}

                function RoleSettings() {
    const role = window.location.pathname.split("/")[1];

                if (role === "doctor") return <DoctorSettingsPage />;
                if (role === "patient") return <SystemSettingsPatient />;
                if (role === "admin") return <SystemSettingsDoctorPage />;

                return <Navigate to="/auth/login" replace />;
}
