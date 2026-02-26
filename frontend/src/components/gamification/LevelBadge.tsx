import React from 'react';
import { Award } from 'lucide-react';
import { useGamificationStore } from '../../stores/gamificationStore';

export const LevelBadge: React.FC = () => {
    const { profile } = useGamificationStore();
    
    if (!profile) return null;

    return (
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 shadow-sm">
            <Award className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-widest">Level {profile.level}</span>
        </div>
    );
};
