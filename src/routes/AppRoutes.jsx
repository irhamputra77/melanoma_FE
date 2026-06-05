import { Navigate, Route, Routes, useParams } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import GuestLayout from "../layouts/GuestLayout";
import PatientLayout from "../layouts/PatientLayout";

import LandingPage from "../features/guest/pages/LandingPage";
import GuestDetectionPage from "../features/guest/pages/GuestDetectionPage";
import MaintenancePage from "../features/guest/pages/MaintenancePage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import GoogleAuthCallbackPage from "../features/auth/pages/GoogleAuthCallbackPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";

import DoctorDashboardPage from "../features/doctor/pages/DoctorDashboardPage";
import HistoricalCasePage from "../features/doctor/pages/HistoricalCasePage";
import DoctorProfilePage from "../features/doctor/pages/DoctorProfilePage";
import DoctorSettingsPage from "../features/doctor/pages/DoctorSettingsPage";
import DoctorMessagesPage from "../features/doctor/pages/DoctorMessagesPage";
import ClinicRequestPage from "../features/auth/pages/ClinicRequestPage";

import PatientDashboardPage from "../features/patient/pages/PatientDashboardPage";
import PatientReportPage from "../features/patient/pages/PatientReportPage";
import SystemSettingsPatient from "../features/patient/pages/SystemSettingsPatient";
import HistoricalDetailPage from "../features/patient/pages/HistoricalDetailPage";
import HistoricalListPage from "../features/patient/pages/HistoricalListPage";
import ProfilePage from "../features/patient/pages/ProfilePage";

// IMPORT SEMENTARA (Akan error jika file belum dibuat di Tahap 3, abaikan dulu error-nya)
import PatientMessageRouter from "../features/patient/pages/PatientMessageRouter";
import PatientChatPage from "../features/patient/pages/PatientChatPage";

import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import AdminProfilePage from "../features/admin/pages/AdminProfilePage";
import DoctorDetailsPage from "../features/admin/pages/DoctorDetailsPage";
import UserManagementPage from "../features/admin/pages/UserManagementPage";
import SystemSettingsDoctorPage from "../features/admin/pages/SystemSettingsDoctorPage";
import ClinicRequestsPage from "../features/admin/pages/ClinicRequestsPage";
import RoleUsersPage from "../features/admin/pages/RoleUsersPage";
import DoctorApprovalPage from "../features/admin/pages/DoctorApprovalPage";
import SystemActivityPage from "../features/admin/pages/SystemActivityPage";
import { isMaintenanceModeEnabled } from "../utils/maintenanceMode";

const dashboardRoutes = {
    doctor: {
        dashboard: <DoctorDashboardPage />,
        history: <HistoricalCasePage />,
        profile: <DoctorProfilePage />,
        settings: <DoctorSettingsPage />,
        messages: <DoctorMessagesPage />,
    },
    patient: {
        dashboard: <PatientDashboardPage />,
        history: <HistoricalListPage />,
        "history-detail": <HistoricalDetailPage />,
        reports: <PatientReportPage />,
        settings: <SystemSettingsPatient />,
        profile: <ProfilePage />,
        
        // ===== ROUTE BARU UNTUK CHAT =====
        messages: <PatientMessageRouter />, 
        "messages-detail": <PatientChatPage />
    },
    admin: {
        dashboard: <AdminDashboardPage />,
        profile: <AdminProfilePage />,
        users: <UserManagementPage />,
        admins: <RoleUsersPage role="admin" />,
        patients: <RoleUsersPage role="patient" />,
        doctors: <DoctorDetailsPage />,
        verification: <DoctorDetailsPage />,
        "doctor-approvals": <DoctorApprovalPage />,
        "clinic-requests": <ClinicRequestsPage />,
        activity: <SystemActivityPage />,
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
            <Route path="/maintenance" element={<MaintenancePage />} />

            <Route path="/auth" element={<AuthLayout />}>
                <Route index element={<Navigate to="login" replace />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="google/callback" element={<GoogleAuthCallbackPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="register-clinic" element={<ClinicRequestPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route path="/:role" element={<ProtectedDashboardLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<RolePage page="dashboard" />} />
                <Route path="history" element={<RolePage page="history" />} />
                <Route path="history-detail/:id" element={<RolePage page="history-detail" />} />
                <Route path="profile" element={<RolePage page="profile" />} />
                <Route path="reports" element={<RolePage page="reports" />} />
                <Route path="users" element={<Navigate to="/admin/admins" replace />} />
                <Route path="admins" element={<RolePage page="admins" />} />
                <Route path="patients" element={<RolePage page="patients" />} />
                <Route path="doctors" element={<RolePage page="doctors" />} />
                <Route path="verification" element={<RolePage page="verification" />} />
                <Route path="doctor-approvals" element={<RolePage page="doctor-approvals" />} />
                <Route path="clinic-requests" element={<RolePage page="clinic-requests" />} />
                <Route path="activity" element={<RolePage page="activity" />} />
                <Route path="settings" element={<RolePage page="settings" />} />
                <Route path="messages" element={<RolePage page="messages" />} />
                <Route path="messages/:id" element={<RolePage page="messages-detail" />} />
                <Route path="messages" element={<RolePage page="messages" />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function ProtectedDashboardLayout() {
    const { role } = useParams();
    const token = sessionStorage.getItem("token");
    const storedRole = sessionStorage.getItem("role");

    if (!dashboardRoutes[role]) {
        return <Navigate to="/auth/login" replace />;
    }

    if (!token || storedRole !== role) {
        return <Navigate to="/auth/login" replace />;
    }

    if (role !== "admin" && isMaintenanceModeEnabled()) {
        return <Navigate to="/maintenance" replace />;
    }

    return role === "patient" ? <PatientLayout /> : <DashboardLayout />;
}

function RolePage({ page }) {
    const { role } = useParams();
    const element = dashboardRoutes[role]?.[page];

    return element || <Navigate to={`/${role}/dashboard`} replace />;
}