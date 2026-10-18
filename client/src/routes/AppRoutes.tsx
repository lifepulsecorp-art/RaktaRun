import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));
const PublicDonorRegisterPage = lazy(() => import('../pages/register/DonorRegisterPage'));
const HospitalRegisterPage = lazy(() => import('../pages/register/HospitalRegisterPage'));
const DonorPendingPage = lazy(() => import('../pages/donor/DonorPendingPage'));
const HospitalPendingPage = lazy(() => import('../pages/hospital/HospitalPendingPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const AdminHospitalsPage = lazy(() => import('../pages/admin/AdminHospitalsPage'));
const AdminDonorsPage = lazy(() => import('../pages/admin/AdminDonorsPage'));
const AdminBuddyReportsPage = lazy(() => import('../pages/admin/AdminBuddyReportsPage'));
const HospitalDashboardPage = lazy(() => import('../pages/HospitalDashboardPage'));
const HospitalProfilePage = lazy(() => import('../pages/hospital/HospitalProfilePage'));
const DonorDashboardPage = lazy(() => import('../pages/DonorDashboardPage'));
const DonorMedicalProfilePage = lazy(() => import('../pages/donor/DonorRegisterPage'));
const LiveTrackingPage = lazy(() => import('../pages/LiveTrackingPage'));
const EmergencyRequestPage = lazy(() => import('../pages/hospital/EmergencyRequestPage'));
const HeroWallPage = lazy(() => import('../pages/HeroWallPage'));
const DonorHeroCardPage = lazy(() => import('../pages/donor/DonorHeroCardPage'));
const BuddyPage = lazy(() => import('../pages/BuddyPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm text-slate-500">Loading page…</div>}>
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/donor" element={<PublicDonorRegisterPage />} />
      <Route path="/register/hospital" element={<HospitalRegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/hero-wall" element={<HeroWallPage />} />
      <Route path="/heroes" element={<HeroWallPage />} />
      <Route path="/buddy/:token" element={<BuddyPage />} />

      {/* PENDING (logged in but not verified) */}
      <Route path="/donor/pending" element={<ProtectedRoute><DonorPendingPage /></ProtectedRoute>} />
      <Route path="/hospital/pending" element={<ProtectedRoute><HospitalPendingPage /></ProtectedRoute>} />

      {/* DONOR (verified) */}
      <Route path="/donor" element={<ProtectedRoute allowedRoles={['donor']}><DonorDashboardPage /></ProtectedRoute>} />
      <Route path="/donor/dashboard" element={<ProtectedRoute allowedRoles={['donor']}><DonorDashboardPage /></ProtectedRoute>} />
      <Route path="/donor/register" element={<ProtectedRoute allowedRoles={['donor']}><DonorMedicalProfilePage /></ProtectedRoute>} />
      <Route path="/donor/profile" element={<ProtectedRoute allowedRoles={['donor']}><DonorMedicalProfilePage /></ProtectedRoute>} />
      <Route path="/donor/hero-card" element={<ProtectedRoute allowedRoles={['donor']}><DonorHeroCardPage /></ProtectedRoute>} />
      <Route path="/donor/hero-studio" element={<ProtectedRoute allowedRoles={['donor']}><DonorHeroCardPage /></ProtectedRoute>} />

      {/* HOSPITAL (verified) */}
      <Route path="/hospital" element={<ProtectedRoute allowedRoles={['hospital']}><HospitalDashboardPage /></ProtectedRoute>} />
      <Route path="/hospital/profile" element={<ProtectedRoute allowedRoles={['hospital']}><HospitalProfilePage /></ProtectedRoute>} />
      <Route path="/hospital/request/new" element={<ProtectedRoute allowedRoles={['hospital']}><EmergencyRequestPage /></ProtectedRoute>} />

      {/* ADMIN */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/hospitals" element={<ProtectedRoute allowedRoles={['admin']}><AdminHospitalsPage /></ProtectedRoute>} />
      <Route path="/admin/donors" element={<ProtectedRoute allowedRoles={['admin']}><AdminDonorsPage /></ProtectedRoute>} />
      <Route path="/admin/buddy-reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminBuddyReportsPage /></ProtectedRoute>} />

      {/* SHARED */}
      <Route path="/live-tracking/:requestId" element={<ProtectedRoute><LiveTrackingPage /></ProtectedRoute>} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
