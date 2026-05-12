import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import GuestLayout from "../layouts/GuestLayout";

import LandingPage from "../features/guest/pages/LandingPage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";

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

            <Route path="/doctor" element={<DashboardLayout />}>
                <Route path="dashboard" element={<DoctorDashboardPage />} />
                <Route path="history" element={<HistoricalCasePage />} />
                <Route path="settings" element={<DoctorSettingsPage />} />
            </Route>

            <Route path="/patient" element={<DashboardLayout />}>
                <Route path="dashboard" element={<PatientDashboardPage />} />
                <Route path="history" element={<HistoricalDataPage />} />
                <Route path="reports" element={<PatientReportPage />} />
                <Route path="settings" element={<SystemSettingsPatient />} />
            </Route>

            <Route path="/admin" element={<DashboardLayout />}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="verification" element={<DoctorDetailsPage />} />
                <Route path="settings" element={<SystemSettingsDoctorPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}