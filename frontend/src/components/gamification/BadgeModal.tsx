import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, X, Sparkles } from 'lucide-react';
import { useGamificationStore } from '../../stores/gamificationStore';
import { Button } from '../ui/Button';

export const BadgeModal: React.FC = () => {
    const { recentBadges, clearRecentBadges } = useGamificationStore();
    
    if (recentBadges.length === 0) return null;

    const badge = recentBadges[0]; // Show them one by one

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={clearRecentBadges}
                />
                
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative bg-card w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border-4 border-primary/20"
                >
                    {/* Celebration Background */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        <div className="absolute top-10 left-10 animate-bounce">
                           <Sparkles className="text-primary" />
                        </div>
                        <div className="absolute bottom-20 right-10 animate-pulse">
                           <Sparkles className="text-primary" size={40} />
                        </div>
                    </div>

                    <div className="p-10 flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                            <div className="relative h-32 w-32 bg-gradient-to-br from-primary to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30">
                                {badge.icon ? (
                                     <span className="text-6xl">{badge.icon}</span>
                                ) : (
                                    <Award size={64} />
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">New Badge Earned!</span>
                            <h2 className="text-3xl font-black text-foreground">{badge.name}</h2>
                            <p className="text-muted-foreground font-medium px-4">
                                {badge.description}
                            </p>
                        </div>

                        <Button 
                            onClick={clearRecentBadges}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                        >
                            Awesome!
                        </Button>
                    </div>
                    
                    <button 
                        onClick={clearRecentBadges}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
