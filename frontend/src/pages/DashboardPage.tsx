import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useStudyPlanStore } from '../stores/studyPlanStore';
import { Skeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    BookOpen, Brain, MessageSquare, TrendingUp, 
    Clock, Target, CheckCircle2, ChevronRight, 
    AlertTriangle, Layout, GraduationCap
} from 'lucide-react';
import { analyticsService } from '../api/services';

export const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();
    const { plans, fetchPlans } = useStudyPlanStore();
    const [stats, setStats] = React.useState<any>(null);
    const [weakAreas, setWeakAreas] = React.useState<{weak_topics: any[], strong_topics: any[], recommendations: any[]}>({weak_topics: [], strong_topics: [], recommendations: []});
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                await fetchPlans();
                const [statsRes, analysisRes] = await Promise.all([
                    analyticsService.getStats(),
                    analyticsService.getWeakStrongAnalysis()
                ]);
                setStats(statsRes.data);
                setWeakAreas(analysisRes.data || {weak_topics: [], strong_topics: [], recommendations: []});
            } catch (error) {
                console.error("Dashboard init error:", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [fetchPlans]);

    if (loading && plans.length === 0) {
        return (
            <div className="space-y-10 pb-20 animate-in fade-in duration-700">
                {/* Hero Skeleton */}
                <div className="rounded-[2.5rem] bg-slate-900/50 p-8 md:p-12 shadow-2xl border border-white/5 h-[300px] flex flex-col justify-center gap-6">
                    <Skeleton className="h-6 w-32 bg-slate-800" />
                    <Skeleton className="h-12 w-3/4 max-w-xl bg-slate-800" />
                    <Skeleton className="h-4 w-1/2 max-w-md bg-slate-800" />
                    <div className="flex gap-4 pt-4">
                        <Skeleton className="h-14 w-40 rounded-2xl bg-slate-800" />
                        <Skeleton className="h-14 w-48 rounded-2xl bg-slate-800" />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-64 rounded-[2rem]" />
                            <Skeleton className="h-64 rounded-[2rem]" />
                        </div>
                        <div>
                            <Skeleton className="h-8 w-48 mb-6" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-32 rounded-3xl" />
                                <Skeleton className="h-32 rounded-3xl" />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-4 space-y-8">
                        <Skeleton className="h-64 rounded-[2rem]" />
                        <Skeleton className="h-64 rounded-[2.5rem]" />
                    </div>
                </div>
            </div>
        );
    }

    const activePlan = plans.find((p) => p.status === 'active');
    const nextChapter = activePlan?.chapters.find(ch => ch.status !== 'completed');
    const progress = stats ? Math.round((stats.topics_completed / (stats.topics_total || 1)) * 100) : 0;

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Hero Section - Today's Task */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white p-8 md:p-12 shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
                    <BookOpen className="h-64 w-64 absolute -top-10 -right-10 text-white" />
                </div>
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary-foreground border border-primary/20">
                            <Target className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Today's Academic Objective</span>
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                {nextChapter ? `Next Chapter: ${nextChapter.chapter_name}` : `Welcome, ${user?.full_name || 'Student'}`}
                            </h1>
                            <p className="text-lg text-slate-400 font-medium max-w-lg">
                                {nextChapter 
                                    ? `You have reached ${progress}% of your ${activePlan?.exam_type} curriculum. Focus on mastering this module today.`
                                    : "Curriculum complete. You may review existing materials or initialize a new study trajectory."}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4">
                            {activePlan && nextChapter ? (
                                <Link to={`/study-plans/${activePlan.id}?chapterId=${nextChapter.id}`}>
                                    <Button className="rounded-2xl px-8 h-14 text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                                        Resume Study
                                        <ChevronRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link to="/study-plans/create">
                                    <Button className="rounded-2xl px-8 h-14 text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition-all">
                                        Initialize New Plan
                                    </Button>
                                </Link>
                            )}
                            <Link to="/chat">
                                <Button variant="outline" className="rounded-2xl px-8 h-14 text-sm font-black uppercase tracking-widest border-white/10 hover:bg-white/5 text-white">
                                    Consult AI Assistant
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <Clock className="h-6 w-6 text-primary/70 mb-4" />
                                <p className="text-3xl font-black text-white">{stats?.hours_studied || 0}h</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-1">Total Study Time</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500/70 mb-4" />
                                <p className="text-3xl font-black text-white">{stats?.topics_completed || 0}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-1">Modules Mastered</p>
                            </div>
                            <div className="col-span-2 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="flex justify-between items-end mb-4">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Curriculum Coverage</p>
                                    <p className="text-2xl font-black text-primary">{progress}%</p>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Layout for Analytics and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Analytics & Weak Areas */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Areas for Improvement */}
                        <Card className="rounded-[2rem] border-none shadow-xl bg-card overflow-hidden">
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-500">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Areas for Improvement</h3>
                                </div>
                                <div className="space-y-3">
                                    {weakAreas.weak_topics?.length > 0 ? (
                                        weakAreas.weak_topics.slice(0, 4).map((area, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-red-500/20 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                                    <span className="text-sm font-bold truncate max-w-[150px]">{area.topic || area}</span>
                                                </div>
                                                <Link to={`/chat?query=Help me understand ${area.topic || area}`}>
                                                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10">
                                                        Master Now
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center space-y-2">
                                            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                                                <CheckCircle2 className="h-6 w-6 text-muted-foreground/30" />
                                            </div>
                                            <p className="text-sm font-bold text-muted-foreground">No weak areas identified yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Recent Performance */}
                        <Card className="rounded-[2rem] border-none shadow-xl bg-card overflow-hidden">
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500">
                                        <TrendingUp size={20} />
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Academic Analytics</h3>
                                </div>
                                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                                    <div className="relative">
                                        <svg className="w-32 h-32 transform -rotate-90">
                                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted" />
                                            <circle 
                                                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                                strokeDasharray={364} 
                                                strokeDashoffset={364 - (364 * (stats?.quiz_average_percent || 0)) / 100} 
                                                className="text-primary transition-all duration-1000" 
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-black">{Math.round(stats?.quiz_average_percent || 0)}%</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Average</span>
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground">Based on your last {stats?.quizzes_taken || 0} quizzes</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Active Plans List */}
                    <div>
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h2 className="text-2xl font-black">Your Study Plans</h2>
                            <Link to="/study-plans" className="text-sm font-bold text-primary hover:underline">View All</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plans.slice(0, 4).map((plan) => (
                                <Link key={plan.id} to={`/study-plans/${plan.id}`}>
                                    <div className="p-6 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest">{plan.exam_type}</p>
                                                <h4 className="font-bold text-lg truncate max-w-[200px]">{plan.exam_type} Plan</h4>
                                            </div>
                                            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-primary transition-colors ${plan.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10'}`}>
                                                {plan.status === 'completed' ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                                            <span>{plan.chapters.length} Chapters</span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                Target: {new Date(plan.target_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Quick Actions & Reminders */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Quick Actions */}
                    <Card className="rounded-[2rem] border-none shadow-xl bg-card overflow-hidden">
                        <div className="p-8 space-y-6">
                            <h3 className="text-xl font-black">Quick Toolbox</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/chat" className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 transition-all flex flex-col items-center gap-3 group text-center">
                                    <MessageSquare className="h-6 w-6 text-blue-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/70 group-hover:text-blue-600 transition-colors">Chat</span>
                                </Link>
                                <Link to="/quiz" className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/10 hover:border-purple-500/30 transition-all flex flex-col items-center gap-3 group text-center">
                                    <Brain className="h-6 w-6 text-purple-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600/70 group-hover:text-purple-600 transition-colors">Quiz</span>
                                </Link>
                                <Link to="/analytics" className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/10 hover:border-orange-500/30 transition-all flex flex-col items-center gap-3 group text-center">
                                    <Layout className="h-6 w-6 text-orange-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/70 group-hover:text-orange-600 transition-colors">Stats</span>
                                </Link>
                                <Link to="/study-plans/create" className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 transition-all flex flex-col items-center gap-3 group text-center">
                                    <Target className="h-6 w-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 group-hover:text-emerald-600 transition-colors">New Plan</span>
                                </Link>
                            </div>
                        </div>
                    </Card>

                    {/* Daily Reminders */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-primary text-primary-foreground overflow-hidden">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black uppercase tracking-tight">Active Reminders</h3>
                                <div className="h-2 w-2 rounded-full bg-white/40" />
                            </div>
                            <div className="space-y-4">
                                {activePlan ? (
                                    <div className="p-5 rounded-2xl bg-white/10 border border-white/10 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                {progress >= 80 ? <GraduationCap size={16} /> : <Target size={16} />}
                                            </div>
                                            <p className="text-sm font-bold leading-tight">
                                                {progress >= 80 ? "Complete the Course!" : `Next: ${nextChapter?.chapter_name || 'Review Curriculum'}`}
                                            </p>
                                        </div>
                                        <p className="text-xs opacity-70 font-medium">
                                            {progress >= 80 
                                                ? `You are ${progress}% through! Finish the remaining modules to earn your certificate.` 
                                                : `Continue your study path for ${activePlan.exam_type}. Consistency is vital for long-term retention.`}
                                        </p>
                                        <Link to={`/study-plans/${activePlan.id}`} className="block">
                                            <Button variant="outline" className="w-full rounded-xl border-white/20 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest h-10">
                                                {progress >= 80 ? "Final Sprint" : "Access Module"}
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="p-5 rounded-2xl bg-white/10 border border-white/10 space-y-3">
                                        <p className="text-sm font-bold leading-tight">No active plans yet!</p>
                                        <p className="text-xs opacity-70 font-medium">Create a study plan to start receiving personalized reminders and tracking your progress.</p>
                                        <Link to="/study-plans/create" className="block">
                                            <Button variant="outline" className="w-full rounded-xl border-white/20 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest h-10">
                                                Create Now
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
