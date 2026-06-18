import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/authStore';
import { GoogleLogin } from '@react-oauth/google';
import { AlertCircle, User, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    full_name: z.string().optional().refine(v => !v || v.trim().length >= 2, {
        message: 'Name must be at least 2 characters',
    }),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register: registerUser, googleLogin, isLoading } = useAuthStore();
    const [apiError, setApiError] = React.useState<string | null>(null);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const password = watch('password', '');
    const passwordStrength = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setApiError(null);
            await registerUser({
                email: data.email,
                password: data.password,
                full_name: data.full_name || undefined,
            });
            navigate('/dashboard');
        } catch (error: any) {
            setApiError(error.response?.data?.detail || 'Registration failed');
        }
    };

    const handleGoogleSuccess = async (response: any) => {
        try {
            setApiError(null);
            await googleLogin(response.credential);
            navigate('/dashboard');
        } catch {
            setApiError('Google signup failed.');
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'hsl(var(--background))' }}>
            {/* Left decorative panel */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a0b14 0%, #0f1223 40%, #0d1130 100%)' }} />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 orb orb-primary opacity-50" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 orb orb-violet opacity-35" />
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(#a5b4fc 1px, transparent 1px), linear-gradient(90deg, #a5b4fc 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />
                <div className="relative z-10 max-w-sm text-white space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-lg" />
                            <img src="/logo.png" alt="StudyItUp" className="relative h-12 w-12 rounded-2xl" />
                        </div>
                        <span className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>StudyItUp</span>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Start Learning
                            <span className="block gradient-text mt-1">Smarter Today</span>
                        </h2>
                        <p className="text-slate-400 leading-relaxed">
                            Join thousands of students using AI to ace their exams.
                        </p>
                    </div>
                    <div className="space-y-3">
                        {[
                            'Free to get started',
                            'AI-generated personalized plans',
                            'No credit card required',
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                <span className="text-slate-300 text-sm font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
                <div className="absolute inset-0 lg:hidden" style={{ background: 'linear-gradient(135deg, #0a0b14 0%, #0f1223 100%)' }} />

                <div className="relative w-full max-w-sm space-y-6">
                    <div className="flex lg:hidden items-center gap-3 mb-2">
                        <img src="/logo.png" alt="StudyItUp" className="h-10 w-10 rounded-xl" />
                        <span className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>StudyItUp</span>
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Create your account</h1>
                        <p className="text-slate-400 text-sm">Start your personalized learning journey</p>
                    </div>

                    {apiError && (
                        <div className="flex items-start gap-3 p-4 rounded-2xl badge-error text-sm animate-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
                            <span className="text-red-300">{apiError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Full Name <span className="text-slate-600 normal-case">(optional)</span></label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type="text"
                                    autoComplete="name"
                                    placeholder="John Doe"
                                    {...register('full_name')}
                                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 text-sm"
                                />
                            </div>
                            {errors.full_name && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle className="h-3 w-3" />{errors.full_name.message}</p>}
                        </div>

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
                            {errors.email && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle className="h-3 w-3" />{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    {...register('password')}
                                    className="w-full h-12 pl-10 pr-11 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 text-sm"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {/* Strength indicator */}
                            {password && (
                                <div className="flex gap-1.5 mt-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passwordStrength ? passwordStrength <= 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-amber-500' : passwordStrength === 3 ? 'bg-blue-500' : 'bg-emerald-500' : 'bg-white/10'}`} />
                                    ))}
                                </div>
                            )}
                            {errors.password && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle className="h-3 w-3" />{errors.password.message}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    {...register('confirmPassword')}
                                    className="w-full h-12 pl-10 pr-11 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 text-sm"
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle className="h-3 w-3" />{errors.confirmPassword.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl gradient-primary text-white font-semibold text-sm glow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : 'Create Account →'}
                        </button>

                        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                            <div className="space-y-3 pt-1">
                                <div className="relative flex items-center">
                                    <div className="flex-1 border-t border-white/8" />
                                    <span className="px-3 text-xs text-slate-500 font-medium">or sign up with</span>
                                    <div className="flex-1 border-t border-white/8" />
                                </div>
                                <div className="flex justify-center">
                                    <div className="w-full rounded-xl overflow-hidden bg-[#0a0b14] border border-white/10 flex justify-center items-center min-h-[44px]">
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={() => setApiError('Google signup failed')}
                                            useOneTap={false}
                                            theme="filled_black"
                                            shape="rectangular"
                                            size="large"
                                            width="320"
                                            text="signup_with"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>

                    <p className="text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
