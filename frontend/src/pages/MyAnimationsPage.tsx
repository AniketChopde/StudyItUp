import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import MotionVideoPlayer from '../components/video/MotionVideoPlayer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Trash2, Video, X, PlayCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { contentService } from '../api/services';
import type { UserAnimationType } from '../types';
import { Loading } from '../components/ui/Loading';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Simple function to generate a consistent gradient background based on text
const getGradient = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        ['#3b82f6', '#8b5cf6'], // blue to purple
        ['#ec4899', '#f43f5e'], // pink to rose
        ['#10b981', '#06b6d4'], // emerald to cyan
        ['#f59e0b', '#ef4444'], // amber to red
        ['#8b5cf6', '#d946ef'], // purple to fuchsia
    ];
    const pair = colors[Math.abs(hash) % colors.length];
    return `linear-gradient(135deg, ${pair[0]} 0%, ${pair[1]} 100%)`;
};

export default function MyAnimationsPage() {
    const [animations, setAnimations] = useState<UserAnimationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingTopic, setPlayingTopic] = useState<string | null>(null);
    const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
    const navigate = useNavigate();

    // Import MotionVideoPlayer dynamically if not globally available
    // Assuming we can import it like below based on project structure
    // React.lazy can be used, but since it's just a component, we import directly
    // at the top or dynamic import


    const fetchAnimations = async () => {
        try {
            const res = await contentService.getMyAnimations();
            setAnimations(res.data);
        } catch (error) {
            toast.error('Failed to load your animations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnimations();
    }, []);

    const promptDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteModalId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalId) return;
        
        try {
            await contentService.deleteAnimation(deleteModalId);
            setAnimations(prev => prev.filter(anim => anim.id !== deleteModalId));
            toast.success('Animation removed');
        } catch (error) {
            toast.error('Failed to delete animation');
        } finally {
            setDeleteModalId(null);
        }
    };

    const handlePlay = (topic: string) => {
        setPlayingTopic(topic);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loading size="lg" text="Loading your vault..." />
            </div>
        );
    }

    if (animations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
                <Video className="w-16 h-16 text-muted-foreground opacity-50" />
                <h2 className="text-2xl font-bold">Your Video Vault is Empty</h2>
                <p className="text-muted-foreground w-3/4">
                    Generate some motion graphics on the learning pages, and they will automatically appear here for rapid replay without re-generating!
                </p>
                <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto relative">
            <div>
                <h1 className="text-3xl font-bold">My Animations</h1>
                <p className="text-muted-foreground mt-2">
                    Access your previously generated motion graphics. Cached videos start instantly.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {animations.map(anim => {
                    const isPlaying = playingTopic === anim.topic;
                    
                    if (isPlaying) {
                        return (
                            <Card key={anim.id} className="col-span-full shadow-2xl border-primary/50 overflow-hidden relative">
                                <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                                    <div>
                                        <h2 className="text-xl font-bold">{anim.topic}</h2>
                                        <p className="text-sm text-slate-500">Generated on {new Date(anim.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="rounded-full hover:bg-slate-200"
                                        onClick={(e) => { e.stopPropagation(); setPlayingTopic(null); }}
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="w-full h-[50vh] sm:h-[60vh] md:h-[75vh] min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] max-h-[850px] bg-slate-50 relative">
                                    <MotionVideoPlayer topic={anim.topic} />
                                </div>
                            </Card>
                        );
                    }

                    return (
                        <Card 
                            key={anim.id} 
                            className="hover:border-primary/50 transition-all cursor-pointer group overflow-hidden flex flex-col" 
                            onClick={() => handlePlay(anim.topic)}
                        >
                            <div 
                                className="w-full h-40 relative flex items-center justify-center p-6 text-center shadow-inner"
                                style={{ background: getGradient(anim.topic) }}
                            >
                                <h3 className="text-white font-bold text-lg drop-shadow-md z-10 line-clamp-2">
                                    {anim.topic}
                                </h3>
                                {/* Hover Play Overlay */}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-[2px]">
                                    <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                                </div>
                            </div>
                            
                            <div className="p-4 flex justify-between items-center bg-card flex-1">
                                <div className="text-sm text-muted-foreground font-medium">
                                    {new Date(anim.created_at).toLocaleDateString()}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50/50 p-2 h-auto z-30"
                                    onClick={(e) => promptDelete(anim.id, e)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Delete Confirmation Modal using Portal to escape stacking contexts */}
            {createPortal(
                <AnimatePresence>
                    {deleteModalId && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        >
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-6"
                            >
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Remove Animation?</h3>
                                        <p className="text-slate-500 mt-2 text-sm">
                                            Are you sure you want to remove this video from your vault? You can always generate it again later.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1"
                                        onClick={() => setDeleteModalId(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        variant="default" 
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                        onClick={handleConfirmDelete}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
