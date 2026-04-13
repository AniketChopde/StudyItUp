import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../api/services';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const MFASettings: React.FC = () => {
    const { user } = useAuthStore();
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // If user is null, bail
    if (!user) return null;

    const handleSetup = async () => {
        try {
            setIsLoading(true);
            const { data } = await authService.setupMFA();
            setQrCode(data.qr_code);
            setSecret(data.secret);
            setIsSettingUp(true);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to setup MFA');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnable = async () => {
        try {
            setIsLoading(true);
            await authService.enableMFA('temp_setup', code);
            toast.success('MFA enabled successfully!');
            // Reload window or ask to re-login to update state
            window.location.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Invalid code');
        } finally {
            setIsLoading(false);
        }
    };

    if (user.mfa_enabled) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg border border-border">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">MFA is Active</h3>
                <p className="text-muted-foreground text-center">
                    Your account is protected with Two-Factor Authentication.
                </p>
            </div>
        );
    }

    if (isSettingUp && qrCode) {
        return (
            <div className="flex flex-col items-center p-6 bg-card rounded-lg border border-border space-y-4">
                <KeyRound className="w-12 h-12 text-primary" />
                <h3 className="text-xl font-bold">Scan QR Code</h3>
                <p className="text-center text-sm text-muted-foreground">
                    Open your authenticator app (Google Authenticator, Authy, etc) and scan this QR code.
                </p>
                <div className="bg-white p-4 rounded-lg">
                    <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />
                </div>
                <div className="flex flex-col items-center space-y-1 w-full mt-4">
                    <p className="text-xs text-muted-foreground">Or enter this secret manually:</p>
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{secret}</code>
                </div>
                
                <div className="w-full mt-6 space-y-4">
                    <Input
                        label="Enter Code to Verify"
                        type="text"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setIsSettingUp(false)}>Cancel</Button>
                        <Button className="flex-1" onClick={handleEnable} isLoading={isLoading}>Enable MFA</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-card rounded-lg border border-border flex items-start space-x-4">
            <div className="p-3 bg-secondary/10 rounded-full">
                <ShieldAlert className="w-8 h-8 text-secondary" />
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Add an extra layer of security to your account by enabling Two-Factor Authentication using a mobile app.
                </p>
                <Button onClick={handleSetup} isLoading={isLoading}>
                    Setup MFA
                </Button>
            </div>
        </div>
    );
};
