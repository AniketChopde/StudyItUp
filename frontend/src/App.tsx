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
import { SettingsPage } from './pages/SettingsPage';
import { Box } from 'lucide-react';


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
  <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
    <div className="relative mb-8 group">
      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 group-hover:scale-175 transition-transform duration-700"></div>
      <div className="relative h-32 w-32 bg-card border shadow-2xl rounded-3xl flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-500">
         <Box className="h-16 w-16 text-primary" />
      </div>
    </div>
    <h1 className="text-3xl md:text-3xl font-black mb-4 tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
      Resources Vault
    </h1>
    <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
      We're building a powerful new space for all your saved study materials, PDF notes, and external links. 
      Check back soon for an upgraded learning experience!
    </p>
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading size="lg" text="Booting StudyItUp..." />
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
            borderRadius: '1rem',
            padding: '1rem',
            fontWeight: '600'
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
        <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
        <Route path="/study-plans" element={<ProtectedRoute><Layout><StudyPlansPage /></Layout></ProtectedRoute>} />
        <Route path="/study-plans/create" element={<ProtectedRoute><Layout><CreateStudyPlanPage /></Layout></ProtectedRoute>} />
        <Route path="/study-plans/:id" element={<ProtectedRoute><Layout><StudyPlanDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Layout><ChatPage /></Layout></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><Layout><QuizPage /></Layout></ProtectedRoute>} />
        <Route path="/test-center" element={<ProtectedRoute><Layout><TestCenterPage /></Layout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Layout><AnalyticsPage /></Layout></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><Layout><ResourcesPage /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute><AdminLayout><AdminPage /></AdminLayout></ProtectedRoute>} />

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
