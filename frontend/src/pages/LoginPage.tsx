import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/authStore';
import { AlertCircle, KeyRound, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, googleLogin, verifyMfaLogin, isLoading } = useAuthStore();
    const [googleLoading, setGoogleLoading] = React.useState(false);

    const [mfaTempToken, setMfaTempToken] = useState<string | null>(null);
    const [showMfa, setShowMfa] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [apiEmailError, setApiEmailError] = useState<string | null>(null);
    const [apiPasswordError, setApiPasswordError] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    const rememberedEmail = localStorage.getItem('remembered_email');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: rememberedEmail || '',
            password: '',
            rememberMe: !!rememberedEmail,
        }
    });

    const onSubmit = async (data: LoginFormData) => {
        setApiEmailError(null);
        setApiPasswordError(null);
        setApiError(null);

        try {
            const result = await login(data);

            if (data.rememberMe) {
                localStorage.setItem('remembered_email', data.email);
            } else {
                localStorage.removeItem('remembered_email');
            }

            if (result && result.mfa_required) {
                setMfaTempToken(result.temp_token);
                setShowMfa(true);
                return;
            }

            const loggedInUser = useAuthStore.getState().user;
            if (loggedInUser?.is_superuser) {
                navigate('/admin', { replace: true });
            } else {
                const from = location.state?.from?.pathname || '/dashboard';
                navigate(from, { replace: true });
            }
        } catch (error: any) {
            const httpStatus = error?.response?.status;
            const detail = error?.response?.data?.detail;

            if (httpStatus === 404) {
                setApiEmailError(detail || 'No account found with this email address.');
            } else if (httpStatus === 401) {
                setApiPasswordError(detail || 'Incorrect password. Please try again.');
            } else if (httpStatus === 403) {
                setApiError(detail || 'Your account has been deactivated. Please contact support.');
            } else if (!error?.response) {
                setApiError('Cannot reach the server. Please check your connection.');
            } else {
                setApiError(detail || 'Login failed. Please try again.');
            }
        }
    };

    const handleGoogleSuccess = async (response: any) => {
        try {
            setApiError(null);
            setGoogleLoading(true);
            const result = await googleLogin(response.credential);
            if (result && result.mfa_required) {
                setMfaTempToken(result.temp_token);
                setShowMfa(true);
                return;
            }
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        } catch {
            setApiError('Google login failed.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const triggerGoogleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => setApiError('Google login failed'),
        flow: 'implicit',
    });

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError(null);
        if (!mfaTempToken) return;
        try {
            await verifyMfaLogin(mfaTempToken, mfaCode, !!rememberedEmail);
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        } catch {
            setApiError('Invalid MFA code.');
        }
    };

    const from = location.state?.from?.pathname || '/dashboard';
    const isAdminLogin = from.includes('/admin');

    return (
        <div className="min-h-screen flex" style={{ background: 'hsl(var(--background))' }}>
            {/* Left decorative panel */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden items-center justify-center p-12">
                {/* Animated background */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0b14 0%, #0f1223 40%, #0d1130 100%)' }} />

                {/* Orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 orb orb-primary opacity-60" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 orb orb-violet opacity-40" />
                <div className="absolute top-1/2 right-1/3 w-64 h-64 orb orb-cyan opacity-30" />

                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(#a5b4fc 1px, transparent 1px), linear-gradient(90deg, #a5b4fc 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Content */}
                <div className="relative z-10 max-w-md text-white space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-lg" />
                            <img src="/logo.png" alt="StudyItUp" className="relative h-12 w-12 rounded-2xl" />
                        </div>
                        <span className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>StudyItUp</span>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl xl:text-5xl font-bold leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Your AI-Powered
                            <span className="block gradient-text mt-1">Learning Partner</span>
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Personalized study plans, AI tutoring, and intelligent quizzes — all in one place.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { icon: '🧠', text: 'AI-generated study plans tailored to you' },
                            { icon: '💬', text: 'Real-time learning copilot with voice support' },
                            { icon: '📊', text: 'Analytics to track your progress & weak areas' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl glass-card">
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-sm text-slate-300 font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
                <div className="absolute inset-0 lg:hidden" style={{ background: 'linear-gradient(135deg, #0a0b14 0%, #0f1223 100%)' }} />

                <div className="relative w-full max-w-sm space-y-6">
                    {/* Logo (mobile only) */}
                    <div className="flex lg:hidden items-center gap-3 mb-2">
                        <img src="/logo.png" alt="StudyItUp" className="h-10 w-10 rounded-xl" />
                        <span className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>StudyItUp</span>
                    </div>

                    {/* Header */}
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {isAdminLogin ? '🔐 Admin Login' : showMfa ? '🔑 Two-Factor Auth' : 'Welcome back'}
                        </h1>
                        <p className="text-slate-400 text-sm">
                            {isAdminLogin
                                ? 'Secure access for administrators only'
                                : showMfa
                                    ? 'Enter the code from your authenticator app'
                                    : 'Sign in to continue your learning journey'}
                        </p>
                    </div>

                    {/* Error banner */}
                    {apiError && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl badge-error text-sm animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
                            <span className="text-red-300">{apiError}</span>
                        </div>
                    )}

                    {showMfa ? (
                        /* MFA Form */
                        <form onSubmit={handleMfaSubmit} className="space-y-4">
                            <div className="flex justify-center py-4">
                                <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center glow-sm animate-pulse-glow">
                                    <KeyRound className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Authenticator Code</label>
                                <input
                                    type="text"
                                    placeholder="000 000"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value)}
                                    required
                                    autoFocus
                                    className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl gradient-primary text-white font-semibold glow-sm hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Verifying...' : 'Verify Code'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowMfa(false)}
                                className="w-full h-10 rounded-xl text-slate-400 hover:text-white text-sm font-medium hover:bg-white/5 transition-all"
                            >
                                ← Go back
                            </button>
                        </form>
                    ) : (
                        /* Login Form */
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        {...register('email')}
                                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 text-sm"
                                    />
                                </div>
                                {(errors.email?.message || apiEmailError) && (
                                    <p className="text-xs text-red-400 flex items-center gap-1.5">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.email?.message || apiEmailError}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        {...register('password')}
                                        className="w-full h-12 pl-10 pr-11 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {(errors.password?.message || apiPasswordError) && (
                                    <p className="text-xs text-red-400 flex items-center gap-1.5">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.password?.message || apiPasswordError}
                                    </p>
                                )}
                            </div>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        {...register('rememberMe')}
                                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/30"
                                    />
                                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                                </label>
                                {!isAdminLogin && (
                                    <Link to="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                        Forgot password?
                                    </Link>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl gradient-primary text-white font-semibold text-sm glow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-gradient"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : 'Sign In →'}
                            </button>

                            {/* Google Login */}
                            {!isAdminLogin && import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                                <div className="space-y-3 pt-1">
                                    <div className="relative flex items-center">
                                        <div className="flex-1 border-t border-white/8" />
                                        <span className="px-3 text-xs text-slate-500 font-medium">or continue with</span>
                                        <div className="flex-1 border-t border-white/8" />
                                    </div>
                                    <div className="flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => triggerGoogleLogin()}
                                            disabled={googleLoading || isLoading}
                                            className="w-full h-11 rounded-xl flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 text-slate-200 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {googleLoading ? (
                                                <svg className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            ) : (
                                                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                                </svg>
                                            )}
                                            <span>{googleLoading ? 'Signing in...' : 'Sign in with Google'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    )}

                    {/* Footer links */}
                    {!isAdminLogin && !showMfa && (
                        <p className="text-center text-sm text-slate-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                                Sign up free
                            </Link>
                        </p>
                    )}
                    {isAdminLogin && (
                        <p className="text-center text-sm text-slate-500">
                            Forgot admin password?{' '}
                            <Link to="/admin/forgot-password" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                                Reset it here
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
