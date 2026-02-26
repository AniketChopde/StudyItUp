import React from 'react';
import { useGamificationStore } from '../../stores/gamificationStore';
import { Card, CardContent } from '../ui/Card';
import { Award } from 'lucide-react';

export const BadgeGallery: React.FC = () => {
    const { profile, isLoading } = useGamificationStore();

    if (isLoading || !profile) return null;

    // Fixed set of possible badges for visualization if we want to show 'locked' ones
    // For now, let's just show earned ones with a "Recent Badges" feel
    const earnedBadges = profile.badges || [];

    if (earnedBadges.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-muted/30">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="bg-muted p-4 rounded-full">
                        <Award className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground">No Badges Yet</p>
                        <p className="text-sm text-muted-foreground max-w-[200px]">
                            Complete quizzes and study chapters to earn your first badge!
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-500" />
                Achievement Badges
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {earnedBadges.map((badge) => (
                    <Card key={badge.badge_key} className="hover:scale-105 transition-transform">
                        <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                            <div className="text-3xl filter drop-shadow-sm">{badge.icon}</div>
                            <p className="text-sm font-bold leading-tight">{badge.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">
                                {badge.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
