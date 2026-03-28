import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { QuizPage } from './pages/QuizPage';
import { TestCenterPage } from './pages/TestCenterPage';
import { CreateStudyPlanPage } from './pages/CreateStudyPlanPage';
import { StudyPlansPage } from './pages/StudyPlansPage';
import { StudyPlanDetailPage } from './pages/StudyPlanDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { Loading } from './components/ui/Loading';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AdminForgotPasswordPage } from './pages/AdminForgotPasswordPage';
import { AdminResetPasswordPage } from './pages/AdminResetPasswordPage';
import AdminPage from './pages/AdminPage';
import GamificationHub from './pages/GamificationHub';
import BossBattleQuiz from './pages/BossBattleQuiz';
import DungeonDelver from './pages/DungeonDelver';
import WisdomTrials from './pages/WisdomTrials';
import WorldMapDashboard from './pages/WorldMapDashboard';

// Lazy-load 3D Visualize page — keeps main bundle size unchanged
const VisualizePage = React.lazy(() => import('./pages/VisualizePage'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};



const ResourcesPage = () => (
  <div>
    <h1 className="text-3xl font-bold mb-4">Resources</h1>
    <p className="text-muted-foreground">Resources page coming soon...</p>
  </div>
);

const SettingsPage = () => (
  <div>
    <h1 className="text-3xl font-bold mb-4">Settings</h1>
    <p className="text-muted-foreground">Settings page coming soon...</p>
  </div>
);

function App() {
  const { isAuthenticated, fetchProfile } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) {
        try {
          await fetchProfile();
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/admin/forgot-password"
          element={<AdminForgotPasswordPage />}
        />
        <Route
          path="/admin/reset-password"
          element={<AdminResetPasswordPage />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-plans"
          element={
            <ProtectedRoute>
              <Layout>
                <StudyPlansPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-plans/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateStudyPlanPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-plans/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <StudyPlanDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Layout>
                <QuizPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-center"
          element={
            <ProtectedRoute>
              <Layout>
                <TestCenterPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <AnalyticsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gamification"
          element={
            <ProtectedRoute>
              <Layout>
                <GamificationHub />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/boss-battle"
          element={
            <ProtectedRoute>
              <Layout>
                <BossBattleQuiz />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dungeon-delver"
          element={
            <ProtectedRoute>
              <Layout>
                <DungeonDelver />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wisdom-trials"
          element={
            <ProtectedRoute>
              <Layout>
                <WisdomTrials />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/world-map"
          element={
            <ProtectedRoute>
              <Layout>
                <WorldMapDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <Layout>
                <ResourcesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/visualize"
          element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loading size="lg" text="Loading visualizer..." /></div>}>
                  <VisualizePage />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
