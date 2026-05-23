import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudyPlanStore } from '../stores/studyPlanStore';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Plus, Calendar, Clock, BookOpen, ChevronRight, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const StudyPlansPage: React.FC = () => {
    const navigate = useNavigate();
    const { plans, isLoading, fetchPlans, deletePlan } = useStudyPlanStore();
    const [planToDelete, setPlanToDelete] = React.useState<string | null>(null);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setPlanToDelete(id);
    };

    const confirmDelete = async () => {
        if (planToDelete) {
            await deletePlan(planToDelete);
            setPlanToDelete(null);
        }
    };

    if (isLoading && plans.length === 0) {
        return (
            <div className="space-y-12 animate-in fade-in max-w-7xl mx-auto">
                {/* Header Skeleton */}
                <Skeleton className="h-[120px] rounded-[2.5rem] w-full" />
                
                {/* Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[340px] rounded-[2.5rem] w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/10 rounded-[2.5rem] border border-primary/10 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none" />
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                        Study Plans
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium max-w-lg text-sm md:text-base">
                        Your personalized learning trajectories. Manage, track, and master your exam preparations.
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/study-plans/create')}
                    size="lg"
                    className="relative z-10 rounded-2xl group transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 active:scale-95 font-black uppercase tracking-wider h-14 px-8"
                >
                    <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    New Path
                </Button>
            </div>

            {plans.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/30 py-12">
                    <CardContent className="flex flex-col items-center text-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <BookOpen className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No active plans yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-8">
                            Create your first AI-powered study plan to start your learning journey with personalized topic breakdowns.
                        </p>
                        <Button variant="outline" onClick={() => navigate('/study-plans/create')}>
                            Get Started
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className="group relative cursor-pointer hover:-translate-y-2 transition-all duration-500 ease-out"
                            onClick={() => navigate(`/study-plans/${plan.id}`)}
                        >
                            {/* Decorative glowing orb behind the card on hover */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-[2.5rem] blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                            
                            <Card className="relative h-full flex flex-col overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-500">


                                <CardHeader className="pb-4 relative z-10 pt-8 px-8">
                                    <div className="flex justify-between items-center mb-4 relative h-7">
                                        <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                                            {plan.exam_type}
                                        </div>
                                        <div className="relative flex items-center h-full">
                                            {/* Status Badge - Fades out on hover */}
                                            <div className={`absolute right-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5 transition-all duration-300 group-hover:opacity-0 group-hover:scale-95 ${plan.status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'}`}>
                                                {plan.status === 'completed' && <CheckCircle size={10} />}
                                                {plan.status}
                                            </div>
                                            
                                            {/* Delete Button - Fades in on hover */}
                                            <div className="absolute right-0 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full bg-destructive/10 hover:bg-destructive text-destructive hover:text-white shadow-sm transition-colors"
                                                    onClick={(e) => handleDeleteClick(e, plan.id.toString())}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-black leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">
                                        {plan.exam_type} Prep
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-3 font-medium opacity-70">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Target: {format(new Date(plan.target_date), 'PPP')}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="mt-auto px-8 pb-8 relative z-10">
                                    <div className={`grid grid-cols-2 gap-3 mb-6 transition-opacity duration-300 ${plan.status === 'completed' ? 'opacity-50' : ''}`}>
                                        <div className="flex flex-col bg-muted/40 hover:bg-muted/60 transition-colors p-4 rounded-2xl border border-border/30">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                                                <Clock className="h-3 w-3 text-primary" />
                                                Pacing
                                            </div>
                                            <div className="text-xl font-black text-foreground">{plan.daily_hours} <span className="text-sm font-bold text-muted-foreground">hrs/day</span></div>
                                        </div>
                                        <div className="flex flex-col bg-muted/40 hover:bg-muted/60 transition-colors p-4 rounded-2xl border border-border/30">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                                                <BookOpen className="h-3 w-3 text-primary" />
                                                Scope
                                            </div>
                                            <div className="text-xl font-black text-foreground">{plan.chapters?.length || 0} <span className="text-sm font-bold text-muted-foreground">modules</span></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-6 border-t border-border/50">
                                        <span className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${plan.status === 'completed' ? 'text-green-600' : 'text-slate-500 group-hover:text-primary'}`}>
                                            {plan.status === 'completed' ? 'Fully Mastered' : 'Resume Journey'}
                                        </span>
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${plan.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 shadow-sm'}`}>
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {planToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card border-2 border-destructive/20 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                            <AlertTriangle size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black">Delete Study Plan?</h3>
                            <p className="text-sm text-muted-foreground font-medium">
                                Are you sure you want to delete this study plan? This action cannot be undone and all your progress will be lost.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button 
                                onClick={confirmDelete} 
                                variant="destructive"
                                className="w-full h-12 font-black uppercase tracking-widest shadow-lg shadow-destructive/20"
                            >
                                Yes, Delete Plan
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setPlanToDelete(null)} 
                                className="w-full h-12 font-black uppercase tracking-widest border-slate-200 hover:bg-slate-100"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
