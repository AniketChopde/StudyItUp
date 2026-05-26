import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useStudyPlanStore } from '../stores/studyPlanStore';
import { Skeleton } from '../components/ui/Skeleton';
import {
    BookOpen, TrendingUp,
    Clock, Target, CheckCircle2, ChevronRight,
    AlertTriangle, GraduationCap, Zap, Brain, MessageSquare, BarChart2, ArrowRight
} from 'lucide-react';
import { analyticsService } from '../api/services';

export const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();
    const { plans, fetchPlans } = useStudyPlanStore();
    const [stats, setStats] = React.useState<any>(null);
    const [weakAreas, setWeakAreas] = React.useState<{ weak_topics: any[], strong_topics: any[], recommendations: any[] }>({ weak_topics: [], strong_topics: [], recommendations: [] });
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
                setWeakAreas(analysisRes.data || { weak_topics: [], strong_topics: [], recommendations: [] });
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
            <div className="space-y-6 pb-16 animate-in fade-in duration-700">
                <div className="h-[280px] rounded-3xl bg-white/5 border border-white/5 shimmer" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="lg:col-span-2 h-64 rounded-3xl bg-white/5" />
                    <Skeleton className="h-64 rounded-3xl bg-white/5" />
                </div>
            </div>
        );
    }

    const activePlan = plans.find((p) => p.status === 'active');
    const nextChapter = activePlan?.chapters.find(ch => ch.status !== 'completed');
    const progress = stats ? Math.round((stats.topics_completed / (stats.topics_total || 1)) * 100) : 0;

    const statCards = [
        { label: 'Study Time', value: `${stats?.hours_studied || 0}h`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/15' },
        { label: 'Chapters Done', value: stats?.topics_completed || 0, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
        { label: 'Quizzes Taken', value: stats?.quizzes_taken || 0, icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/15' },
        { label: 'Exams Taken', value: stats?.tests_taken || 0, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/15' },
    ];

    return (
        <div className="space-y-6 pb-16 animate-in fade-in duration-700">

            {/* ── Hero Banner ───────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl border border-white/5" style={{ background: 'linear-gradient(135deg, #0f1223 0%, #111827 60%, #0a0d1f 100%)' }}>
                {/* Orbs */}
                <div className="absolute top-0 right-0 w-80 h-80 orb orb-primary opacity-40 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-1/3 w-60 h-60 orb orb-violet opacity-30 translate-y-1/2" />
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: 'linear-gradient(#a5b4fc 1px, transparent 1px), linear-gradient(90deg, #a5b4fc 1px, transparent 1px)',
                        backgroundSize: '32px 32px'
                    }}
                />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-10">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full badge-info text-xs font-semibold">
                            <Target className="h-3.5 w-3.5" />
                            Today's Academic Objective
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-3xl font-bold leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                <span className="text-gradient">
                                    {nextChapter
                                        ? nextChapter.chapter_name
                                        : `Welcome back, ${user?.full_name?.split(' ')[0] || 'Student'} 👋`}
                                </span>
                            </h1>
                            <p className="text-slate-400 text-base leading-relaxed max-w-md">
                                {nextChapter
                                    ? `You're ${progress}% through your ${activePlan?.exam_type} curriculum. Keep the momentum going!`
                                    : 'All caught up! Create a new study plan or review existing materials.'}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            {activePlan && nextChapter ? (
                                <Link to={`/study-plans/${activePlan.id}?chapterId=${nextChapter.id}`}>
                                    <button className="flex items-center gap-2 h-11 px-5 rounded-xl gradient-primary text-white text-sm font-semibold glow-sm hover:opacity-90 active:scale-95 transition-all">
                                        Resume Study
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </Link>
                            ) : (
                                <Link to="/study-plans/create">
                                    <button className="flex items-center gap-2 h-11 px-5 rounded-xl gradient-primary text-white text-sm font-semibold glow-sm hover:opacity-90 active:scale-95 transition-all">
                                        Create Study Plan
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </Link>
                            )}
                            <Link to="/chat">
                                <button className="flex items-center gap-2 h-11 px-5 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-semibold hover:bg-white/10 active:scale-95 transition-all backdrop-blur-sm">
                                    <MessageSquare className="h-4 w-4 text-violet-400" />
                                    Ask AI Tutor
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats grid in hero */}
                    <div className="hidden lg:grid grid-cols-2 gap-3 content-center">
                        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
                            <div key={label} className={`p-4 rounded-2xl border ${bg} ${border} backdrop-blur-sm`}>
                                <Icon className={`h-4 w-4 ${color} mb-2.5`} />
                                <p className="text-xl font-bold text-white">{value}</p>
                                <p className="section-label mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Progress bar at bottom */}
                {activePlan && (
                    <div className="relative z-10 px-8 pb-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Curriculum Progress</p>
                            <p className="text-xs font-bold text-indigo-400">{progress}% complete</p>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full progress-bar transition-all duration-1000" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Mobile Stats Row ──────────────────────────── */}
            <div className="grid grid-cols-2 lg:hidden gap-3">
                {statCards.map(({ label, value, icon: Icon, color, border }) => (
                    <div key={label} className={`p-3.5 rounded-2xl border glass-card ${border}`}>
                        <Icon className={`h-3.5 w-3.5 ${color} mb-2`} />
                        <p className="text-lg font-bold text-white">{value}</p>
                        <p className="section-label mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Today's Game Plan ────────────────────────── */}
            {activePlan && nextChapter && (
                <div className="glass-card rounded-3xl border border-white/5 p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                                <Target className="h-4 w-4 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Today's Game Plan</p>
                                <h2 className="text-base font-bold text-white">{nextChapter.chapter_name}</h2>
                            </div>
                        </div>
                        <Link
                            to={`/study-plans/${activePlan.id}?chapterId=${nextChapter.id}`}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        >
                            Open Chapter <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { step: 1, title: 'Read & Understand', desc: `Study the ${nextChapter.chapter_name} material.`, emoji: '📖', color: 'border-blue-500/20 bg-blue-500/5', accent: 'text-blue-400', cta: 'Open Chapter', link: `/study-plans/${activePlan.id}?chapterId=${nextChapter.id}` },
                            { step: 2, title: 'Ask & Clarify', desc: 'Use AI tutor to explain anything unclear.', emoji: '💬', color: 'border-violet-500/20 bg-violet-500/5', accent: 'text-violet-400', cta: 'Open Chat', link: `/chat?planId=${activePlan.id}&chapter=${encodeURIComponent(nextChapter.chapter_name)}` },
                            { step: 3, title: 'Practice Problems', desc: 'Get hands-on practice from AI.', emoji: '⚡', color: 'border-amber-500/20 bg-amber-500/5', accent: 'text-amber-400', cta: 'Get Exercises', link: `/chat?planId=${activePlan.id}&chapter=${encodeURIComponent(nextChapter.chapter_name)}&query=Give me 5 practical exercises for ${encodeURIComponent(nextChapter.chapter_name)}` },
                            { step: 4, title: 'Test Yourself', desc: 'Verify your understanding with a quiz.', emoji: '🎯', color: 'border-emerald-500/20 bg-emerald-500/5', accent: 'text-emerald-400', cta: 'Start Quiz', link: `/quiz?topic=${encodeURIComponent(nextChapter.chapter_name)}&subject=${encodeURIComponent(activePlan.exam_type)}&autoStart=true` },
                        ].map(({ step, title, desc, emoji, color, accent, cta, link }) => (
                            <Link key={step} to={link} className="group">
                                <div className={`h-full p-4 rounded-2xl border ${color} hover:border-white/20 transition-all group-hover:-translate-y-0.5`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-lg">{emoji}</span>
                                        <span className={`text-xs font-bold uppercase tracking-widest ${accent}`}>Step {step}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-200 mb-1">{title}</p>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{desc}</p>
                                    <span className={`text-xs font-semibold ${accent} flex items-center gap-1`}>
                                        {cta} <ArrowRight className="h-3 w-3" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Main grid ────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left column */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Weak areas + Performance */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Weak Areas */}
                        <div className="glass-card glass-card-hover rounded-3xl border border-white/5 p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Areas to Improve</h3>
                            </div>
                            <div className="space-y-2">
                                {weakAreas.weak_topics?.length > 0 ? (
                                    weakAreas.weak_topics.slice(0, 4).map((area, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-transparent hover:border-red-500/15 transition-all group">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-red-400" style={{ boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />
                                                <span className="text-sm font-medium text-slate-300 truncate max-w-[140px]">{area.topic || area}</span>
                                            </div>
                                            <Link to={`/chat?query=Help me understand ${area.topic || area}`}>
                                                <span className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors">Study →</span>
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center">
                                        <CheckCircle2 className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">No weak areas yet</p>
                                        <p className="text-xs text-slate-600 mt-1">Take some quizzes to get insights</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quiz Performance */}
                        <div className="glass-card glass-card-hover rounded-3xl border border-white/5 p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quiz Performance</h3>
                            </div>
                            <div className="flex flex-col items-center justify-center py-4 space-y-3">
                                <div className="relative">
                                    <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 112 112">
                                        <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                                        <circle
                                            cx="56" cy="56" r="48"
                                            stroke="url(#grad)"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeLinecap="round"
                                            strokeDasharray={`${2 * Math.PI * 48}`}
                                            strokeDashoffset={`${2 * Math.PI * 48 * (1 - (stats?.quiz_average_percent || 0) / 100)}`}
                                            className="transition-all duration-1000"
                                        />
                                        <defs>
                                            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold text-white">{Math.round(stats?.quiz_average_percent || 0)}%</span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Average</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Based on {stats?.quizzes_taken || 0} quiz{stats?.quizzes_taken !== 1 ? 'zes' : ''}</p>
                                <Link to="/analytics">
                                    <span className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                                        <BarChart2 className="h-3.5 w-3.5" />
                                        View full analytics
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Study Plans */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Study Plans</h2>
                            <Link to="/study-plans" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                                View All <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                        {plans.length === 0 ? (
                            <div className="glass-card rounded-3xl border border-white/5 p-10 text-center space-y-4">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mx-auto">
                                    <BookOpen className="h-7 w-7 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-white mb-1">No study plans yet</p>
                                    <p className="text-sm text-slate-500">Create your first AI-powered study plan to get started</p>
                                </div>
                                <Link to="/study-plans/create">
                                    <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl gradient-primary text-white text-sm font-semibold glow-sm hover:opacity-90 transition-all">
                                        Create Study Plan <ArrowRight className="h-4 w-4" />
                                    </button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {plans.slice(0, 4).map((plan) => {
                                    const chaptersDone = plan.chapters.filter(ch => ch.status === 'completed').length;
                                    const planProgress = Math.round((chaptersDone / (plan.chapters.length || 1)) * 100);
                                    return (
                                        <Link key={plan.id} to={`/study-plans/${plan.id}`} className="group">
                                            <div className="glass-card glass-card-hover rounded-2xl border border-white/5 p-5 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1 min-w-0 flex-1 pr-3">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{plan.exam_type}</p>
                                                        <h4 className="font-semibold text-white truncate">{plan.exam_type} Study Plan</h4>
                                                    </div>
                                                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${plan.status === 'completed' ? 'bg-emerald-500/10 border border-emerald-500/15' : 'bg-indigo-500/10 border border-indigo-500/15'}`}>
                                                        {plan.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <BookOpen className="h-4 w-4 text-indigo-400" />}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs text-slate-500 font-medium">{chaptersDone}/{plan.chapters.length} chapters</span>
                                                        <span className="text-xs font-bold text-indigo-400">{planProgress}%</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full progress-bar transition-all duration-700" style={{ width: `${planProgress}%` }} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>Target: {new Date(plan.target_date).toLocaleDateString()}</span>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-4 space-y-5">

                    {/* Active Reminder card */}
                    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 p-6 space-y-5"
                        style={{ background: 'linear-gradient(145deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)' }}>
                        <div className="absolute top-0 right-0 w-40 h-40 orb orb-primary opacity-50" />
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Reminder</h3>
                                <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                            </div>

                            {activePlan ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                        <div className="flex items-center gap-2">
                                            {progress >= 80 ? <GraduationCap className="h-4 w-4 text-amber-400" /> : <Target className="h-4 w-4 text-indigo-400" />}
                                            <p className="text-sm font-semibold text-white">
                                                {progress >= 80 ? "Almost there!" : `Next: ${nextChapter?.chapter_name || 'Review Curriculum'}`}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            {progress >= 80
                                                ? `You're ${progress}% done! Finish remaining modules.`
                                                : `Keep going with your ${activePlan.exam_type} plan. Consistency is key!`}
                                        </p>
                                    </div>
                                    <Link to={`/study-plans/${activePlan.id}`} className="block">
                                        <button className="w-full h-10 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-widest hover:bg-indigo-500/20 transition-all">
                                            {progress >= 80 ? 'Final Sprint →' : 'Access Module →'}
                                        </button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                                        <p className="text-sm font-semibold text-white">No active plans yet!</p>
                                        <p className="text-xs text-slate-400 leading-relaxed">Create a study plan to get personalized reminders and track your progress.</p>
                                    </div>
                                    <Link to="/study-plans/create" className="block">
                                        <button className="w-full h-10 rounded-xl gradient-primary text-white text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-all">
                                            Create Plan →
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="glass-card rounded-3xl border border-white/5 p-5 space-y-1">
                        <p className="section-label px-1 pb-2">Quick Access</p>
                        {[
                            { label: 'Learning Chat', href: '/chat', icon: MessageSquare, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                            { label: 'Take a Quiz', href: '/quiz', icon: Brain, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                            { label: 'Test Center', href: '/test-center', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                            { label: 'View Analytics', href: '/analytics', icon: BarChart2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                        ].map(({ label, href, icon: Icon, color, bg }, idx, arr) => (
                            <Link key={href} to={href} className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all group ${idx < arr.length - 1 ? 'border-b border-white/4' : ''}`}>
                                <div className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                                </div>
                                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
                                <ChevronRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-slate-400 ml-auto transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
