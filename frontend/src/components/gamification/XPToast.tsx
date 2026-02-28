import React, { useEffect, useState } from 'react';
import { useGamificationStore } from '../../stores/gamificationStore';
import { Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const XPToast: React.FC = () => {
    const { profile } = useGamificationStore();
    const [prevXP, setPrevXP] = useState<number | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [xpGain, setXpGain] = useState(0);

    useEffect(() => {
        if (profile) {
            if (prevXP !== null && profile.total_xp > prevXP) {
                const gain = profile.total_xp - prevXP;
                setXpGain(gain);
                setShowToast(true);
                const timer = setTimeout(() => setShowToast(false), 3000);
                return () => clearTimeout(timer);
            }
            setPrevXP(profile.total_xp);
        }
    }, [profile?.total_xp]);

    return (
        <AnimatePresence>
            {showToast && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
                >
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2.5 border border-white/20">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <Zap className="h-4 w-4 fill-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Experience Gained</span>
                            <span className="text-lg font-black">+{xpGain} XP</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
