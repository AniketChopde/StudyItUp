import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudyPlanStore } from '../stores/studyPlanStore';
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
            <div className="space-y-6 animate-in fade-in">
                <Skeleton className="h-28 rounded-3xl bg-white/5" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-3xl bg-white/5" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl border border-white/5 p-6 md:p-8"
                style={{ background: 'linear-gradient(135deg, #0f1223 0%, #111827 60%, #0a0d1f 100%)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 orb orb-primary opacity-30 -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">Your Learning Paths</p>
                        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Study Plans</h1>
                        <p className="text-slate-400 text-sm max-w-md">
                            Personalized AI-powered study trajectories. Manage, track, and master your exam preparations.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/study-plans/create')}
                        className="btn-primary h-9 px-4 text-xs flex-shrink-0 self-start md:self-center"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New Study Plan
                    </button>
                </div>
            </div>

            {/* Empty state */}
            {plans.length === 0 ? (
                <div className="glass-card rounded-3xl border border-white/5 py-16 px-6 text-center space-y-5">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mx-auto animate-float">
                        <BookOpen className="h-8 w-8 text-indigo-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>No study plans yet</h3>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                            Create your first AI-powered study plan to start your learning journey with personalized topic breakdowns.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/study-plans/create')}
                        className="btn-primary h-9 px-5 text-xs"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Create First Plan
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {plans.map((plan) => {
                        const chaptersDone = plan.chapters.filter(ch => ch.status === 'completed').length;
                        const planProgress = Math.round((chaptersDone / (plan.chapters.length || 1)) * 100);
                        const isCompleted = plan.status === 'completed';

                        return (
                            <div
                                key={plan.id}
                                className="group relative cursor-pointer"
                                onClick={() => navigate(`/study-plans/${plan.id}`)}
                            >
                                {/* Gradient border glow on hover */}
                                <div className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3), transparent)' }}
                                />

                                <div className="relative glass-card rounded-3xl border border-white/5 p-6 space-y-5 group-hover:-translate-y-1 transition-transform duration-300">
                                    {/* Top row */}
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full badge-info text-xs font-semibold">
                                                {plan.exam_type}
                                            </span>
                                            <h3 className="text-lg font-bold text-white leading-tight">{plan.exam_type} Prep</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Status badge — hidden on hover to reveal delete button */}
                                            <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg uppercase tracking-wider transition-all duration-300 ${isCompleted ? 'badge-success group-hover:opacity-0' : 'badge-info group-hover:opacity-0'}`}>
                                                {isCompleted ? '✓ Done' : 'Active'}
                                            </span>
                                            {/* Delete button */}
                                            <button
                                                onClick={(e) => handleDeleteClick(e, plan.id.toString())}
                                                className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:scale-110"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta info */}
                                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-slate-600" />
                                            {format(new Date(plan.target_date), 'MMM d, yyyy')}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-slate-600" />
                                            {plan.daily_hours}h/day
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-2xl bg-white/3 border border-white/5">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">Chapters</p>
                                            <p className="text-lg font-bold text-white">{chaptersDone}<span className="text-slate-500 text-sm font-medium">/{plan.chapters?.length || 0}</span></p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-white/3 border border-white/5">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">Progress</p>
                                            <p className="text-lg font-bold text-indigo-400">{planProgress}%</p>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full progress-bar transition-all duration-700" style={{ width: `${planProgress}%` }} />
                                        </div>
                                    </div>

                                    {/* CTA footer */}
                                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                        <span className={`text-xs font-semibold flex items-center gap-1.5 ${isCompleted ? 'text-emerald-400' : 'text-slate-500 group-hover:text-indigo-400 transition-colors'}`}>
                                            {isCompleted ? <><CheckCircle className="h-3.5 w-3.5" /> Mastered</> : 'Resume Journey'}
                                        </span>
                                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {planToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="glass-card rounded-3xl border border-red-500/20 p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="h-7 w-7 text-red-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Delete Study Plan?</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                This action cannot be undone. All your progress and chapter data will be permanently lost.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={confirmDelete}
                                className="w-full h-10 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white text-xs font-semibold tracking-wide uppercase transition-all active:scale-97 shadow-[0_4px_16px_rgba(239,68,68,0.35)] hover:shadow-[0_8px_24px_rgba(239,68,68,0.5)] hover:-translate-y-0.5"
                            >
                                Yes, Delete Plan
                            </button>
                            <button
                                onClick={() => setPlanToDelete(null)}
                                className="w-full h-10 rounded-xl btn-outline-glass text-xs uppercase tracking-wide"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
