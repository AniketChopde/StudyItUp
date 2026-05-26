import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStudyPlanStore } from '../stores/studyPlanStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { 
    Target, Calendar, Clock, Sparkles, AlertTriangle, 
    Brain, Zap, Wrench, Monitor, BarChart, Database, 
    Cloud, Server, Layout, Shield, CheckCircle2, ChevronRight, ChevronLeft,
    BookOpen
} from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

const createPlanSchema = z.object({
    exam_type: z.string().min(2, 'Learning goal or topic is required'),
    measurable_target: z.string().optional(),
    current_level: z.string().default('Beginner'),
    start_date: z.string().min(1, 'Start date is required'),
    target_date: z.string().min(1, 'Target completion date is required'),
    daily_hours: z.number().min(1).max(24),
    fast_learn: z.boolean().default(false),
    language: z.string().default('English'),
}).refine(data => new Date(data.target_date) >= new Date(data.start_date), {
    message: "Target date must be after start date",
    path: ["target_date"]
});

type CreatePlanFormData = z.infer<typeof createPlanSchema>;

const TRENDING_ROLES = [
    { title: "AI Engineer", durationDays: 90, hoursPerDay: 3, level: "Intermediate", icon: <Brain className="h-5 w-5 text-purple-400" />, bg: "bg-purple-500/10" },
    { title: "Forward Deployed Eng", durationDays: 60, hoursPerDay: 3, level: "Intermediate", icon: <Zap className="h-5 w-5 text-orange-400" />, bg: "bg-orange-500/10" },
    { title: "DevOps Engineer", durationDays: 90, hoursPerDay: 2, level: "Beginner", icon: <Wrench className="h-5 w-5 text-blue-400" />, bg: "bg-blue-500/10" },
    { title: "Full Stack Engineer", durationDays: 120, hoursPerDay: 3, level: "Beginner", icon: <Monitor className="h-5 w-5 text-emerald-400" />, bg: "bg-emerald-500/10" },
    { title: "Data Scientist", durationDays: 120, hoursPerDay: 2, level: "Beginner", icon: <BarChart className="h-5 w-5 text-amber-400" />, bg: "bg-amber-500/10" },
    { title: "ML Engineer", durationDays: 90, hoursPerDay: 3, level: "Intermediate", icon: <Database className="h-5 w-5 text-pink-400" />, bg: "bg-pink-500/10" },
    { title: "Cloud Architect", durationDays: 60, hoursPerDay: 2, level: "Intermediate", icon: <Cloud className="h-5 w-5 text-cyan-400" />, bg: "bg-cyan-500/10" },
    { title: "Backend Engineer", durationDays: 90, hoursPerDay: 2, level: "Beginner", icon: <Server className="h-5 w-5 text-indigo-400" />, bg: "bg-indigo-500/10" },
    { title: "Frontend Engineer", durationDays: 90, hoursPerDay: 2, level: "Beginner", icon: <Layout className="h-5 w-5 text-rose-400" />, bg: "bg-rose-500/10" },
    { title: "Security Engineer", durationDays: 90, hoursPerDay: 2, level: "Beginner", icon: <Shield className="h-5 w-5 text-red-400" />, bg: "bg-red-500/10" },
];

const MINIMUM_DAYS = 7; // No plan should be shorter than 1 week regardless of hours

export const CreateStudyPlanPage: React.FC = () => {
    const navigate = useNavigate();
    const { createPlan } = useStudyPlanStore();
    const [showHoursWarning, setShowHoursWarning] = useState(false);
    const [showFeasibilityWarning, setShowFeasibilityWarning] = useState(false);
    const [pendingData, setPendingData] = useState<CreatePlanFormData | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreatePlanFormData>({
        resolver: zodResolver(createPlanSchema),
        defaultValues: {
            start_date: today,
            daily_hours: 2,
            fast_learn: false,
            language: 'English',
            current_level: 'Beginner'
        }
    });

    const isFastLearn = watch('fast_learn');
    const examType = watch('exam_type');
    const targetDate = watch('target_date');
    const startDate = watch('start_date');
    const dailyHours = watch('daily_hours');
    const currentLevel = watch('current_level');
    const measurableTarget = watch('measurable_target');

    // Calculate duration
    let daysDiff = 0;
    if (startDate && targetDate) {
        const start = new Date(startDate);
        const end = new Date(targetDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            daysDiff = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        }
    }

    const totalHours = daysDiff * (dailyHours || 0);
    // Minimum days required: at the user's chosen daily_hours, how many days to reach a meaningful plan?
    // A decent course needs at least 20+ hours of content. Use the backend-generated total or 40h as baseline.
    const MINIMUM_TOTAL_HOURS = 20; // anything below this is trivially short
    const minDaysNeeded = Math.max(
        MINIMUM_DAYS,
        dailyHours > 0 ? Math.ceil(MINIMUM_TOTAL_HOURS / dailyHours) : MINIMUM_DAYS
    );
    // Feasibility: user must allocate at least minDaysNeeded days
    const isTooShort = daysDiff > 0 && daysDiff < minDaysNeeded;
    // Compute a suggested realistic target date
    const suggestedTargetDate = (() => {
        if (!startDate) return '';
        const s = new Date(startDate);
        s.setDate(s.getDate() + minDaysNeeded);
        return s.toISOString().split('T')[0];
    })();

    const isCreatingLocal = useStudyPlanStore(state => state.isCreating);

    const onSubmit = async (data: CreatePlanFormData) => {
        // Feasibility gate: block if the window is too short
        if (isTooShort && !pendingData) {
            setPendingData(data);
            setShowFeasibilityWarning(true);
            return;
        }
        if (data.daily_hours > 8 && !showFeasibilityWarning && !pendingData) {
            setPendingData(data);
            setShowHoursWarning(true);
            return;
        }
        
        try {
            // Append target if provided
            const fullExamType = data.measurable_target ? `${data.exam_type} (Target: ${data.measurable_target})` : data.exam_type;
            
            const response = await createPlan({
                ...data,
                exam_type: fullExamType,
                current_knowledge: { level: data.current_level },
            });
            if (response.study_plan?.id) {
                navigate(`/study-plans/${response.study_plan.id}`);
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            // Error handled by store
        }
    };

    const confirmHighHours = () => {
        if (pendingData) {
            onSubmit(pendingData);
            setShowHoursWarning(false);
        }
    };

    const handleRoleSelect = (role: typeof TRENDING_ROLES[0]) => {
        setValue('exam_type', role.title, { shouldValidate: true });
        setValue('daily_hours', role.hoursPerDay, { shouldValidate: true });
        setValue('current_level', role.level, { shouldValidate: true });
        
        // Calculate future date
        const start = new Date(watch('start_date') || today);
        start.setDate(start.getDate() + role.durationDays);
        setValue('target_date', start.toISOString().split('T')[0], { shouldValidate: true });
    };

    // Auto-scroll functionality for carousel
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    
    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };
    
    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-3">
                        <Sparkles className="h-4 w-4" /> Smart Planner
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Create Study Plan</h1>
                    <p className="text-muted-foreground text-sm">Pick a trending role below or fill in your own goal.</p>
                </div>
                
                <div className="flex gap-8 text-center pb-2">
                    <div>
                        <div className="text-2xl font-black">{daysDiff || 0}</div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">days</div>
                    </div>
                    <div>
                        <div className="text-2xl font-black">{totalHours || 0}</div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">hours</div>
                    </div>
                    <div>
                        <div className="text-2xl font-black">{dailyHours <= 2 ? 'Light' : dailyHours <= 4 ? 'Steady' : 'Intense'}</div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">pace</div>
                    </div>
                </div>
            </div>

            {/* Quick Start Carousel */}
            <div className="mb-4 relative group">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Start — Trending Roles</h3>
                    <div className="flex gap-2">
                        <button onClick={scrollLeft} type="button" className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/8 transition-colors">
                            <ChevronLeft size={15} />
                        </button>
                        <button onClick={scrollRight} type="button" className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/8 transition-colors">
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
                
                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {TRENDING_ROLES.map((role, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleRoleSelect(role)}
                            className={`min-w-[180px] flex-shrink-0 cursor-pointer snap-start p-4 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${examType === role.title ? 'border-indigo-500/40 bg-indigo-500/8 ring-1 ring-indigo-500/20' : 'border-white/8 glass-card hover:border-white/15'}`}
                        >
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 border border-white/5 ${role.bg}`}>
                                {role.icon}
                            </div>
                            <h4 className="font-bold text-sm text-white mb-1 truncate">{role.title}</h4>
                            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mb-0.5">
                                <span>{role.durationDays}d</span>
                                <span>·</span>
                                <span>{role.hoursPerDay}h/day</span>
                            </div>
                            <div className="text-[10px] section-label">
                                {role.level}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-8">
                    <Card className="border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
                        <CardContent className="p-6 md:p-8">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold">Specific goal</label>
                                        <Input
                                            placeholder="e.g. GATE CS data structures, React interview prep"
                                            icon={<Target className="h-4 w-4" />}
                                            error={errors.exam_type?.message}
                                            {...register('exam_type')}
                                            className="h-12 rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold">Measurable target</label>
                                        <Input
                                            placeholder="e.g. score 80% in mocks, build 3 portfolio projects"
                                            icon={<CheckCircle2 className="h-4 w-4" />}
                                            error={errors.measurable_target?.message}
                                            {...register('measurable_target')}
                                            className="h-12 rounded-xl"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold">Current level</label>
                                            <select
                                                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                {...register('current_level')}
                                            >
                                                <option value="Beginner">Beginner</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Advanced">Advanced</option>
                                            </select>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-bold">Language</label>
                                            <select
                                                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                {...register('language')}
                                            >
                                                <option value="English">English</option>
                                                <option value="Hindi">Hindi</option>
                                                <option value="Marathi">Marathi</option>
                                            </select>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-bold">Daily hours</label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="24"
                                                icon={<Clock className="h-4 w-4" />}
                                                error={errors.daily_hours?.message}
                                                {...register('daily_hours', { valueAsNumber: true })}
                                                className="h-12 rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold">Start date</label>
                                            <Input
                                                type="date"
                                                min={today}
                                                icon={<Calendar className="h-4 w-4" />}
                                                error={errors.start_date?.message}
                                                {...register('start_date')}
                                                className="h-12 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold">Target date</label>
                                            <Input
                                                type="date"
                                                min={watch('start_date') || today}
                                                icon={<Calendar className="h-4 w-4" />}
                                                error={errors.target_date?.message}
                                                {...register('target_date')}
                                                className="h-12 rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isFastLearn ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20' : 'border-border bg-muted/30 hover:bg-muted/50'}`}>
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <div className="flex items-center h-5 mt-1">
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                    {...register('fast_learn')}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm">Fast learn mode</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium mt-1">
                                                    Core topics first, optional material later.
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20" isLoading={isCreatingLocal}>
                                    <Sparkles className="mr-2 h-4 w-4" /> Generate plan
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Sidebar - Plan Check */}
                <div className="lg:col-span-4">
                    <div className="p-6 rounded-[2rem] glass-card border border-indigo-500/15 space-y-6 sticky top-24">
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <Target className="h-3.5 w-3.5 text-indigo-400" />
                            </div>
                            <p className="section-label">Plan Check</p>
                        </div>
                        
                        <div className="space-y-4 relative before:absolute before:left-3 before:top-0 before:h-full before:w-px before:bg-gradient-to-b before:from-indigo-500/30 before:via-white/5 before:to-transparent">
                            <div className="relative flex items-start gap-3 pl-2">
                                <div className={`flex items-center justify-center w-5 h-5 rounded-full border flex-shrink-0 ${examType ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400' : 'border-white/15 bg-white/3 text-slate-600'}`}>
                                    <CheckCircle2 className="w-3 h-3" />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold ${examType ? 'text-white' : 'text-slate-500'}`}>Specific</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{examType ? examType : 'Add a focused topic'}</p>
                                </div>
                            </div>
                            
                            <div className="relative flex items-start gap-3 pl-2">
                                <div className={`flex items-center justify-center w-5 h-5 rounded-full border flex-shrink-0 ${measurableTarget ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400' : 'border-white/15 bg-white/3 text-slate-600'}`}>
                                    <CheckCircle2 className="w-3 h-3" />
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold ${measurableTarget ? 'text-white' : 'text-slate-500'}`}>Measurable</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{measurableTarget ? measurableTarget : 'Add a result you can verify'}</p>
                                </div>
                            </div>

                            <div className="relative flex items-start gap-3 pl-2">
                                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                                    <Clock className="w-3 h-3" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white">Achievable</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{dailyHours}h/day · {dailyHours <= 2 ? 'light' : dailyHours <= 4 ? 'steady' : 'intense'} pace</p>
                                </div>
                            </div>

                            <div className="relative flex items-start gap-3 pl-2">
                                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                                    <BookOpen className="w-3 h-3" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white">Level</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{currentLevel}</p>
                                </div>
                            </div>

                            <div className="relative flex items-start gap-3 pl-2">
                                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                                    <Calendar className="w-3 h-3" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white">Time bound</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{daysDiff} days · {totalHours} total hours</p>
                                </div>
                            </div>

                            {/* Feasibility warning inside sidebar */}
                            {isTooShort && daysDiff > 0 && (
                                <div className="relative flex items-start gap-3 pl-2">
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-red-500/60 bg-red-500/10 text-red-400 flex-shrink-0">
                                        <AlertTriangle className="w-3 h-3" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-red-400">Not Achievable ⚠️</h4>
                                        <p className="text-[11px] text-red-400/70 mt-0.5 leading-relaxed">
                                            {daysDiff} day{daysDiff !== 1 ? 's' : ''} is too short. Need at least {minDaysNeeded} days.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setValue('target_date', suggestedTargetDate, { shouldValidate: true })}
                                            className="mt-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                                        >
                                            → Set to {suggestedTargetDate}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>

                        <div className="p-3.5 bg-white/3 rounded-xl border border-white/6">
                            <h4 className="text-xs font-bold text-slate-300 mb-1">{isFastLearn ? '⚡ Fast mode active' : '📚 Standard mode'}</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                {isFastLearn 
                                    ? 'The generated path will focus on core topics first.'
                                    : 'The generated path will include foundations, practice, and review milestones.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hours Warning */}
            {showFeasibilityWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-card border border-red-500/20 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400">
                            <AlertTriangle size={28} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white">Plan Not Achievable</h3>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                Even studying <span className="text-white font-bold">{dailyHours}h/day</span>, you need at least{' '}
                                <span className="text-red-400 font-bold">{minDaysNeeded} days</span> to complete a meaningful course — but your window is only{' '}
                                <span className="text-red-400 font-bold">{daysDiff} days</span>.
                            </p>
                            <p className="text-xs text-slate-500">
                                Suggested target: <span className="text-indigo-400 font-bold">{suggestedTargetDate}</span>
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={() => {
                                    setValue('target_date', suggestedTargetDate, { shouldValidate: true });
                                    setShowFeasibilityWarning(false);
                                    setPendingData(null);
                                }}
                                className="w-full h-11 font-bold uppercase tracking-widest text-sm"
                            >
                                Use {suggestedTargetDate} ✓
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowFeasibilityWarning(false);
                                    if (pendingData) onSubmit({ ...pendingData });
                                    setPendingData(null);
                                }}
                                className="w-full h-11 font-bold text-sm border-white/10 text-slate-400"
                            >
                                Proceed Anyway
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => { setShowFeasibilityWarning(false); setPendingData(null); }}
                                className="w-full h-9 text-sm text-slate-500"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showHoursWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-card border border-amber-500/20 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400">
                            <AlertTriangle size={28} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white">Intensive Schedule!</h3>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                You've selected <span className="text-amber-400 font-bold">{pendingData?.daily_hours} hours</span> per day. This is a very intense commitment. Are you sure you can maintain this pace?
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button onClick={confirmHighHours} className="w-full h-11 font-bold uppercase tracking-widest text-sm">Yes, I'm Committed 🚀</Button>
                            <Button variant="outline" onClick={() => {setShowHoursWarning(false); setPendingData(null);}} className="w-full h-11 font-bold uppercase tracking-widest text-sm border-white/10">
                                Let Me Reconsider
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
