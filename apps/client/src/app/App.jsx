import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { LoadingMessage } from '../components/StatusMessage';

const AuthLayout = lazy(() => import('../layouts/AuthLayout').then((module) => ({ default: module.AuthLayout })));
const LandingPage = lazy(() => import('../pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('../pages/SignupPage').then((module) => ({ default: module.SignupPage })));
const ExplorePage = lazy(() => import('../pages/ExplorePage').then((module) => ({ default: module.ExplorePage })));
const EventDetailsPage = lazy(() => import('../pages/EventDetailsPage').then((module) => ({ default: module.EventDetailsPage })));
const OrganizerHomePage = lazy(() => import('../pages/OrganizerHomePage').then((module) => ({ default: module.OrganizerHomePage })));
const OrganizerStartPage = lazy(() => import('../pages/OrganizerStartPage').then((module) => ({ default: module.OrganizerStartPage })));
const VolunteerStartPage = lazy(() => import('../pages/VolunteerStartPage').then((module) => ({ default: module.VolunteerStartPage })));
const CreateEventPage = lazy(() => import('../pages/CreateEventPage').then((module) => ({ default: module.CreateEventPage })));
const ApplicationsPage = lazy(() => import('../pages/ApplicationsPage').then((module) => ({ default: module.ApplicationsPage })));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));
const OrganizerApplicationsPage = lazy(() => import('../pages/OrganizerApplicationsPage').then((module) => ({ default: module.OrganizerApplicationsPage })));
const AdminHomePage = lazy(() => import('../pages/AdminHomePage').then((module) => ({ default: module.AdminHomePage })));
const VolunteerProfilePage = lazy(() => import('../pages/VolunteerProfilePage').then((module) => ({ default: module.VolunteerProfilePage })));

function RequireAuth({ children, role }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="app-loading"><LoadingMessage label="Getting your space ready…" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && !user.roles?.includes(role)) return <Navigate to={role === 'ORGANIZER' ? '/organizer/start' : '/events'} replace />;
  return children;
}

export function App() {
  const { user } = useAuth();
  const signedInPath = user?.roles?.includes('ADMIN') ? '/admin' : user?.activeRole === 'ORGANIZER' ? '/organizer' : '/events';
  return <Suspense fallback={<div className="app-loading"><LoadingMessage label="Opening Crewensia…" /></div>}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route element={<AuthLayout />}><Route path="/login" element={user ? <Navigate to={signedInPath} replace /> : <LoginPage />} /><Route path="/signup" element={user ? <Navigate to={signedInPath} replace /> : <SignupPage />} /></Route>
    <Route path="/events" element={<ExplorePage />} />
    <Route path="/events/:eventId" element={<EventDetailsPage />} />
    <Route path="/organizer/start" element={<RequireAuth><OrganizerStartPage /></RequireAuth>} />
    <Route path="/volunteer/start" element={<RequireAuth><VolunteerStartPage /></RequireAuth>} />
    <Route path="/organizer" element={<RequireAuth role="ORGANIZER"><OrganizerHomePage /></RequireAuth>} />
    <Route path="/organizer/events/new" element={<RequireAuth role="ORGANIZER"><CreateEventPage /></RequireAuth>} />
    <Route path="/organizer/events/:eventId/applications" element={<RequireAuth role="ORGANIZER"><OrganizerApplicationsPage /></RequireAuth>} />
    <Route path="/organizer/volunteers/:volunteerId" element={<RequireAuth role="ORGANIZER"><VolunteerProfilePage /></RequireAuth>} />
    <Route path="/admin" element={<RequireAuth role="ADMIN"><AdminHomePage /></RequireAuth>} />
    <Route path="/applications" element={<RequireAuth role="VOLUNTEER"><ApplicationsPage /></RequireAuth>} />
    <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>;
}
