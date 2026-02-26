import React from 'react';
import { useGamificationStore } from '../../stores/gamificationStore';
import { Award, Zap } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

export const XPBar: React.FC = () => {
    const { profile, isLoading, fetchProfile } = useGamificationStore();

    React.useEffect(() => {
        if (!profile) {
            fetchProfile();
        }
    }, [profile, fetchProfile]);

    if (isLoading || !profile) {
        return (
            <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <CardContent className="p-6">
                    <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-muted rounded"></div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const totalForThisLevel = profile.level * 100;
    const currentProgressXP = Math.max(0, totalForThisLevel - profile.xp_to_next_level);
    const progressPercent = (currentProgressXP / totalForThisLevel) * 100;

    return (
        <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 text-indigo-500/10">
                <Zap size={120} />
            </div>
            
            <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-indigo-500 text-white rounded-lg p-1.5 shadow-sm">
                                <Award size={18} />
                            </div>
                            <h3 className="font-bold text-lg">Level {profile.level}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                            {profile.total_xp} Total XP
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                            {currentProgressXP} <span className="text-sm font-medium text-muted-foreground">/ {totalForThisLevel} XP</span>
                        </p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mt-1">
                            {profile.xp_to_next_level} XP to Level {profile.level + 1}
                        </p>
                    </div>
                </div>

                <div className="h-3 w-full bg-indigo-500/20 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out rounded-full"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
