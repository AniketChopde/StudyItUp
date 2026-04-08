import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { GoogleLogin } from '@react-oauth/google';
import { AlertCircle } from 'lucide-react';

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    full_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
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

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setApiError(null);
            await registerUser({
                email: data.email,
                password: data.password,
                full_name: data.full_name,
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
        } catch (err: any) {
            setApiError('Google login failed.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex flex-col items-center justify-center gap-2 mb-2">
                        <img src="/logo.png" alt="StudyItUp" className="h-12 w-12" />
                        <span className="text-2xl font-bold text-primary">StudyItUp</span>
                    </div>
                    <CardTitle className="text-3xl font-bold text-center">Create Account</CardTitle>
                    <CardDescription className="text-center">
                        Start your learning journey with StudyItUp
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Full Name (Optional)"
                            type="text"
                            placeholder="John Doe"
                            error={errors.full_name?.message}
                            {...register('full_name')}
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            error={errors.email?.message}
                            {...register('email')}
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register('password')}
                        />
                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            error={errors.confirmPassword?.message}
                            {...register('confirmPassword')}
                        />
                        {apiError && (
                            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>{apiError}</span>
                            </div>
                        )}
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Create Account
                        </Button>
                        <div className="mt-4 flex flex-col items-center gap-4">
                            <div className="relative w-full flex items-center justify-center border-t border-border mt-2 pt-4">
                                  <span className="absolute bg-card px-2 text-muted-foreground text-sm">or sign up with</span>
                            </div>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setApiError('Google signup failed')}
                                useOneTap
                                theme="filled_black"
                                shape="pill"
                                text="signup_with"
                            />
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <p className="text-sm text-center text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};
