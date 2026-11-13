import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute.tsx';
import { DashboardLayout } from '../layouts/DashboardLayout.tsx';
import { LoginPage } from '../pages/LoginPage.tsx';
import { RegisterPage } from '../pages/RegisterPage.tsx';
import { MainDashboardPage } from '../pages/MainDashboardPage.tsx';
import { SubmitReportPage } from '../pages/SubmitReportPage.tsx';
import { AllReportsPage } from '../pages/AllReportsPage.tsx';
import { ReportDetailsPage } from '../pages/ReportDetailsPage.tsx';
import { TrackReportPage } from '../pages/TrackReportPage.tsx';
import { HandlerDashboardPage } from '../pages/HandlerDashboardPage.tsx';
import { RoutingManagementPage } from '../pages/RoutingManagementPage.tsx';
import { AnalyticsDashboardPage } from '../pages/AnalyticsDashboardPage.tsx';
import { NotificationsPage } from '../pages/NotificationsPage.tsx';
import { UserProfilePage } from '../pages/UserProfilePage.tsx';
import { SettingsPage } from '../pages/SettingsPage.tsx';
import type { UserRole } from '../types/index.ts';

function ProtectedPage({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/track-public" element={<TrackReportPage publicMode />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedPage>
            <MainDashboardPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/submit-report"
        element={
          <ProtectedPage>
            <SubmitReportPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedPage>
            <AllReportsPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/reports/:id"
        element={
          <ProtectedPage>
            <ReportDetailsPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/track"
        element={
          <ProtectedPage>
            <TrackReportPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/handler-dashboard"
        element={
          <ProtectedPage allowedRoles={['Handler', 'Admin', 'Routing Manager']}>
            <HandlerDashboardPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/routing"
        element={
          <ProtectedPage allowedRoles={['Admin', 'Routing Manager']}>
            <RoutingManagementPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedPage>
            <AnalyticsDashboardPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedPage>
            <NotificationsPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedPage>
            <UserProfilePage />
          </ProtectedPage>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedPage>
            <SettingsPage />
          </ProtectedPage>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
