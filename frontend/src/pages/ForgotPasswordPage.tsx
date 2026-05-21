import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address (e.g. user@example.com)'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        setApiError(null);
        try {
            await apiClient.post('/auth/forgot-password', data);
            setIsSubmitted(true);
        } catch (error: any) {
            const detail = error?.response?.data?.detail;
            const status = error?.response?.status;

            if (status === 404) {
                setApiError(detail || 'No account found with this email address. Please check the email and try again.');
            } else if (status === 403) {
                setApiError(detail || 'This account has been deactivated. Please contact support.');
            } else {
                setApiError(detail || 'Something went wrong. Please try again later.');
            }
            toast.error('Could not send reset link.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <div className="flex justify-center mb-2">
                            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
                        <CardDescription className="text-center">
                            A password reset link has been sent to your email address. It expires in 30 minutes.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Link to="/login">
                            <Button variant="outline">Back to Login</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex flex-col items-center justify-center gap-2 mb-2">
                        <img src="/logo.png" alt="StudyItUp" className="h-10 w-10" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
                    <CardDescription className="text-center">
                        Enter your registered email address and we'll send you a password reset link.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Email Address"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            error={errors.email?.message}
                            icon={<Mail className="h-4 w-4" />}
                            {...register('email')}
                        />

                        {/* API Error Banner */}
                        {apiError && (
                            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>{apiError}</span>
                            </div>
                        )}

                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Send Reset Link
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link to="/login" className="text-sm text-primary hover:underline">
                        Back to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};
