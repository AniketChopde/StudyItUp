import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStudyPlanStore } from '../stores/studyPlanStore';

// Lazy-load 3D visualizer — app works fine even if this fails to load
const TopicVisualizer3D = lazy(() => import('../components/3d/TopicVisualizer3D'));
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Skeleton } from '../components/ui/Skeleton';
import {
    Calendar, Clock, BookOpen, CheckCircle2,
    Layout, Sparkles,
    BookMarked, Video, FileText,
    ArrowLeft, GraduationCap, ChevronRight,
    PlayCircle,
    ListChecks, Target as TargetIcon,
    AlertTriangle, Lightbulb, Archive, Zap, Terminal, RefreshCw,
    ArrowUp
} from 'lucide-react';
import { format } from 'date-fns';
import { Mermaid } from '../components/ui/Mermaid';
import { TopicMindmap } from '../components/TopicMindmap';
import { ResourcesTab } from '../components/ResourcesTab';
import { FeedbackModal } from '../components/FeedbackModal';
import { ReadAloudButton } from '../components/voice/VoiceButton';
import { TextSelectionAsk } from '../components/TextSelectionAsk';

export const StudyPlanDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { activePlan, isLoading, isTeaching, isSearchingCourses, getPlan, updateChapterStatus, teachChapter, getCourses } = useStudyPlanStore();
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    const urlChapterId = searchParams.get('chapterId');
    const [viewMode, setViewMode] = useState<'overview' | 'lesson' | 'syllabus' | 'courses' | 'resources'>('overview');
    const [expandedMindmaps, setExpandedMindmaps] = useState<Record<string, boolean>>({});
    const [expanded3D, setExpanded3D] = useState<Record<string, boolean>>({});
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [sortByWeightage, setSortByWeightage] = useState(false);
    const { isCreating, createPlan } = useStudyPlanStore();
    const contentAreaRef = React.useRef<HTMLDivElement>(null);

    const selectedChapter = activePlan?.chapters.find(
        (c) => c.id.toString() === selectedChapterId
    );

    const scrollToTopGlobal = (behavior: 'instant' | 'smooth' = 'instant') => {
        if (contentAreaRef.current) {
            try {
                contentAreaRef.current.scrollTo({ top: 0, behavior });
                contentAreaRef.current.scrollTop = 0;
            } catch (e) {
                contentAreaRef.current.scrollTop = 0;
            }
        }
        window.scrollTo({ top: 0, behavior });
        document.documentElement.scrollTo({ top: 0, behavior });
        document.body.scrollTo({ top: 0, behavior });
        
        const scrollContainers = document.querySelectorAll('main, .overflow-y-auto, #root');
        scrollContainers.forEach(container => {
            try {
                container.scrollTo({ top: 0, behavior });
                (container as HTMLElement).scrollTop = 0;
            } catch (e) {}
        });
    };

    const handleRegenerate = async () => {
        if (!activePlan) return;
        try {
            const data: {
                exam_type: string;
                target_date: string;
                daily_hours: number;
                current_knowledge: Record<string, any>;
                start_date: string;
                fast_learn: boolean;
                force_regenerate: boolean;
            } = {
                exam_type: activePlan.exam_type,
                target_date: activePlan.target_date,
                daily_hours: activePlan.daily_hours,
                current_knowledge: activePlan.current_knowledge,
                start_date: new Date().toISOString().split('T')[0],
                fast_learn: true,
                force_regenerate: true
            };
            const result = await createPlan(data);
            if (result && result.study_plan) {
                navigate(`/study-plans/${result.study_plan.id}`);
            }
        } catch (error) {
            console.error('Failed to regenerate plan:', error);
        }
    };

    useEffect(() => {
        if (id && id !== 'undefined') {
            getPlan(id);
        } else if (id === 'undefined') {
            navigate('/study-plans');
        }
    }, [id, getPlan, navigate]);

    useEffect(() => {
        if (viewMode === 'courses' && activePlan && (!activePlan.recommended_courses || activePlan.recommended_courses.length === 0)) {
            getCourses(activePlan.id.toString());
        }
    }, [viewMode, activePlan, getCourses]);

    useEffect(() => {
        if (activePlan?.chapters && activePlan.chapters.length > 0) {
            if (urlChapterId) {
                if (selectedChapterId !== urlChapterId) {
                    setSelectedChapterId(urlChapterId);
                }
                
                // Clear the Deep Link so the user can freely click other chapters later!
                searchParams.delete('chapterId');
                setSearchParams(searchParams, { replace: true });
                
                // Also automatically switch to lesson view when deep-linking
                if (viewMode === 'overview') {
                    setViewMode('lesson');
                    
                    // Trigger teaching if content is missing
                    const ch = activePlan.chapters.find(c => c.id.toString() === urlChapterId);
                    if (ch && (!ch.content || !ch.content.topic_lessons) && !isTeaching) {
                        // Use timeout to prevent React update collisions
                        setTimeout(() => teachChapter(urlChapterId), 0);
                    }
                }
            } else if (!selectedChapterId) {
                setSelectedChapterId(activePlan.chapters[0].id.toString());
            }
        }
    }, [activePlan, urlChapterId, selectedChapterId, viewMode, isTeaching, teachChapter]);
    useEffect(() => {
        scrollToTopGlobal('instant');
        const timers = [
            setTimeout(() => scrollToTopGlobal('instant'), 50),
            setTimeout(() => scrollToTopGlobal('instant'), 150),
            setTimeout(() => scrollToTopGlobal('instant'), 300),
            setTimeout(() => scrollToTopGlobal('instant'), 500),
            setTimeout(() => scrollToTopGlobal('instant'), 800),
            setTimeout(() => scrollToTopGlobal('instant'), 1200),
        ];
        return () => timers.forEach(clearTimeout);
    }, [viewMode, selectedChapterId, selectedChapter?.content, isTeaching]);

    // Calculate plan duration to dynamically display Day / Week / Module
    const getChapterLabel = (index: number) => {
        if (sortByWeightage) return `Impact #${index + 1}`;
        if (!activePlan) return `Week ${index + 1}`;
        
        try {
            const start = new Date(activePlan.start_date || activePlan.created_at);
            const target = new Date(activePlan.target_date);
            start.setHours(0, 0, 0, 0);
            target.setHours(0, 0, 0, 0);
            const diffTime = target.getTime() - start.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            if (diffDays <= 7) {
                return `Day ${index + 1}`;
            } else if (diffDays <= 21) {
                return `Module ${index + 1}`;
            } else {
                return `Week ${index + 1}`;
            }
        } catch (e) {
            return `Week ${index + 1}`;
        }
    };

    const handleStartLesson = () => {
        if (!selectedChapter) return;

        setViewMode('lesson');
        if (!selectedChapter.content || !selectedChapter.content.topic_lessons) {
            teachChapter(selectedChapter.id.toString());
        }
        scrollToTopGlobal('instant');
        setTimeout(() => scrollToTopGlobal('instant'), 50);
        setTimeout(() => scrollToTopGlobal('instant'), 150);
    };

    // const handleDownloadPdf = () => {
    //     // PDF Generation logic will go here
    //     console.log('Downloading PDF...');
    // };

    if (isLoading && !activePlan) {
        return (
            <div className="space-y-8 animate-in fade-in pb-20">
                <Skeleton className="h-[250px] rounded-3xl w-full" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-4">
                        <Skeleton className="h-12 rounded-2xl w-full" />
                        <Skeleton className="h-[500px] rounded-2xl w-full" />
                    </div>
                    <div className="lg:col-span-8">
                        <Skeleton className="h-[600px] rounded-[2.5rem] w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!activePlan) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Study Plan Not Found</h2>
                <Button onClick={() => navigate('/study-plans')}>Back to All Plans</Button>
            </div>
        );
    }

    const completedChapters = activePlan.chapters.filter((c) => c.status === 'completed').length;
    const progress = Math.round((completedChapters / activePlan.chapters.length) * 100) || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header section */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-50 border border-slate-200 p-8 md:p-12 shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <BookOpen className="h-32 w-32 text-slate-400" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                                <Clock className="h-3 w-3" />
                                {activePlan.chapters.reduce((acc: number, c: any) => acc + (c.estimated_hours || 0), 0)} Hours Total
                            </div>
                            <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                                <Calendar className="h-3 w-3" />
                                Started {format(new Date(activePlan.start_date || activePlan.created_at), 'MMM dd, yyyy')}
                            </div>
                            <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                                <Calendar className="h-3 w-3" />
                                Target {format(new Date(activePlan.target_date), 'MMM dd, yyyy')}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-slate-300">
                                {activePlan.exam_type}
                            </span>
                            {progress === 100 ? (
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200 flex items-center gap-1">
                                    <GraduationCap className="h-3 w-3" />
                                    Certification Eligible
                                </span>
                            ) : (
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-200">
                                    Course in Progress
                                </span>
                            )}
                        </div>
                        <h1 className="text-5xl font-black tracking-tight text-slate-900">
                            {activePlan.exam_type} Curriculum
                        </h1>
                    </div>
                    <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl border-slate-200 hover:bg-slate-50 h-11 px-5 font-bold flex items-center gap-2 shadow-sm"
                                onClick={() => setIsFeedbackModalOpen(true)}
                            >
                                <TargetIcon size={16} className="text-slate-500" />
                                Evaluate
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl border-slate-200 hover:bg-slate-50 h-11 px-5 font-bold flex items-center gap-2 shadow-sm"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <Layout size={16} className="text-slate-500" />
                                Adjust Plan
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-2xl h-11 px-5 font-bold flex items-center gap-2 shadow-sm bg-slate-900 text-white hover:bg-slate-800"
                                onClick={handleRegenerate}
                                isLoading={isCreating}
                            >
                                <RefreshCw size={16} />
                                Re-optimize
                            </Button>
                            {/* currently not implemented to use it */}
                            {/* <Button
                                variant="default"
                                size="sm"
                                className="rounded-2xl h-11 px-5 font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                                onClick={handleDownloadPdf}
                            >
                                <Download size={16} />
                                Export PDF
                            </Button> */}
                        </div>

                        <div className="w-full md:w-72 space-y-2">
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Syllabus Mastery</span>
                                <span className="text-sm font-black text-slate-900">{progress}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-slate-900 transition-all duration-1000 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Chapter List (Sidebar) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex flex-col space-y-4">
                        <div className="flex p-1.5 bg-muted/50 rounded-2xl border border-border/50">
                            <button
                                onClick={() => setViewMode('overview')}
                                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'overview' || viewMode === 'lesson' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                <Layout className="h-3.5 w-3.5 mr-2" />
                                Planning
                            </button>
                            <button
                                onClick={() => setViewMode('syllabus')}
                                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'syllabus' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                <ListChecks className="h-3.5 w-3.5 mr-2" />
                                Syllabus
                            </button>
                            <button
                                onClick={() => setViewMode('courses')}
                                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'courses' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                <Video className="h-3.5 w-3.5 mr-2" />
                                Courses
                            </button>
                            <button
                                onClick={() => setViewMode('resources')}
                                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'resources' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                <Archive className="h-3.5 w-3.5 mr-2" />
                                Resources
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Learning Path</h3>
                        <button 
                            onClick={() => setSortByWeightage(!sortByWeightage)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${sortByWeightage ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-muted text-muted-foreground border-border'}`}
                        >
                            {sortByWeightage ? 'Sorted by Weight' : 'Sort by Weight'}
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                        {[...activePlan.chapters]
                            .sort((a, b) => sortByWeightage ? (b.weightage_percent - a.weightage_percent) : (a.order_index - b.order_index))
                            .map((chapter, index) => (
                            <button
                                key={chapter.id.toString()}
                                onClick={() => {
                                    setSelectedChapterId(chapter.id.toString());
                                    setViewMode('overview');
                                }}
                                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group relative ${selectedChapterId === chapter.id.toString()
                                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary/20'
                                    : 'border-transparent bg-muted/30 hover:bg-muted/50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 h-5 w-5 rounded-full flex items-center justify-center ${chapter.status === 'completed'
                                        ? 'bg-green-500/20 text-green-500'
                                        : 'bg-muted text-muted-foreground/30'
                                        }`}>
                                        {chapter.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-tighter">
                                                {getChapterLabel(index)}
                                            </span>
                                            {chapter.weightage_percent > 0 && (
                                                <div className="flex items-center gap-1 bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/20 shadow-sm">
                                                    <Zap className="h-2.5 w-2.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">
                                                        {chapter.weightage_percent}% Weight
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <h4 className={`font-bold text-sm truncate leading-tight ${selectedChapterId === chapter.id.toString() ? 'text-primary' : ''}`}>
                                            {chapter.chapter_name}
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-1">
                                            {chapter.subject} • {chapter.estimated_hours} Hours
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area - scrollable so long lesson content doesn't push the page */}
                <div ref={contentAreaRef} className="lg:col-span-8 max-h-[calc(100vh-11rem)] overflow-y-auto overscroll-behavior-contain custom-scrollbar">
                    {viewMode === 'syllabus' ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-card">
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                            <ListChecks size={24} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-black">Official Syllabus Overview</CardTitle>
                                            <CardDescription>Comprehensive curriculum breakdown for {activePlan.exam_type}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 pt-4 space-y-8">
                                    {activePlan.plan_metadata?.goal_analysis && (
                                        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                                            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-primary mb-3">
                                                <TargetIcon size={16} />
                                                Goal Analysis
                                            </h4>
                                            <div className="space-y-4">
                                                {typeof activePlan.plan_metadata.goal_analysis === 'string' ? (
                                                    <p className="text-sm leading-relaxed text-muted-foreground/80 font-medium">
                                                        {activePlan.plan_metadata.goal_analysis}
                                                    </p>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="p-4 bg-background/50 rounded-2xl border border-border/50 shadow-sm">
                                                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Feasibility</p>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-2 w-2 rounded-full ${activePlan.plan_metadata.goal_analysis.feasibility === 'high' ? 'bg-green-500' :
                                                                    activePlan.plan_metadata.goal_analysis.feasibility === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                                                                    }`} />
                                                                <p className="text-sm font-black capitalize">{activePlan.plan_metadata.goal_analysis.feasibility}</p>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-background/50 rounded-2xl border border-border/50 shadow-sm">
                                                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Approach</p>
                                                            <p className="text-sm font-black capitalize">{activePlan.plan_metadata.goal_analysis.recommended_approach}</p>
                                                        </div>
                                                        <div className="p-4 bg-background/50 rounded-2xl border border-border/50 shadow-sm">
                                                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Est. Coverage</p>
                                                            <p className="text-sm font-black">{activePlan.plan_metadata.goal_analysis.estimated_coverage}</p>
                                                        </div>

                                                        {activePlan.plan_metadata.goal_analysis.key_focus_areas && (
                                                            <div className="col-span-1 md:col-span-3 p-5 bg-background/50 rounded-2xl border border-border/50 shadow-sm">
                                                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-3">Key Focus Areas</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {activePlan.plan_metadata.goal_analysis.key_focus_areas.map((area: string, i: number) => (
                                                                        <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase border border-primary/20">
                                                                            {area}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {activePlan.plan_metadata.goal_analysis.recommendations && (
                                                            <div className="col-span-1 md:col-span-3 p-5 bg-background/50 rounded-2xl border border-border/50 shadow-sm">
                                                                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-2">Key Recommendations</p>
                                                                <ul className="space-y-1.5">
                                                                    {activePlan.plan_metadata.goal_analysis.recommendations.map((rec: string, i: number) => (
                                                                        <li key={i} className="text-xs font-bold text-muted-foreground flex items-start gap-2">
                                                                            <span className="mt-1.5 h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                                                                            {rec}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {(activePlan.plan_metadata?.official_syllabus?.exam_pattern || activePlan.plan_metadata?.official_syllabus?.pattern) && (
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">Exam Pattern</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {Object.entries(activePlan.plan_metadata.official_syllabus.exam_pattern || activePlan.plan_metadata.official_syllabus.pattern).map(([key, val]: any, i) => (
                                                        <div key={i} className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{key.replace(/_/g, ' ')}</p>
                                                            <p className="text-sm font-black">{Array.isArray(val) ? val.join(', ') : String(val)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(activePlan.plan_metadata?.official_syllabus?.syllabus_overview || activePlan.plan_metadata?.official_syllabus?.syllabus) && (
                                            <div className="space-y-4 pt-4">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">Curriculum Topics</h4>
                                                <div className="space-y-3">
                                                    {/* Handle syllabus_overview.topics_per_subject structure */}
                                                    {activePlan.plan_metadata.official_syllabus.syllabus_overview?.topics_per_subject ? (
                                                        Object.entries(activePlan.plan_metadata.official_syllabus.syllabus_overview.topics_per_subject).map(([subject, topics]: any, i: number) => (
                                                            <div key={i} className="p-5 bg-muted/20 rounded-2xl border border-border/40 hover:bg-muted/30 transition-colors">
                                                                <h5 className="font-bold text-base mb-3 flex items-center gap-2">
                                                                    <span className="h-6 w-6 bg-primary/10 text-primary text-[10px] rounded-lg flex items-center justify-center">{i + 1}</span>
                                                                    {subject}
                                                                </h5>
                                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                                                                    {(Array.isArray(topics) ? topics : []).map((topic: string, j: number) => (
                                                                        <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                                                                            <div className="h-1 w-1 rounded-full bg-primary/40" />
                                                                            {topic}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        /* Fallback for simple syllabus array */
                                                        (activePlan.plan_metadata.official_syllabus.syllabus || []).map((section: any, i: number) => (
                                                            <div key={i} className="p-5 bg-muted/20 rounded-2xl border border-border/40 hover:bg-muted/30 transition-colors">
                                                                <h5 className="font-bold text-base mb-3 flex items-center gap-2">
                                                                    <span className="h-6 w-6 bg-primary/10 text-primary text-[10px] rounded-lg flex items-center justify-center">{i + 1}</span>
                                                                    {section.category || section.name || "Topic"}
                                                                </h5>
                                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                                                                    {(section.topics || []).map((topic: string, j: number) => (
                                                                        <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                                                                            <div className="h-1 w-1 rounded-full bg-primary/40" />
                                                                            {topic}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (selectedChapter && (viewMode === 'overview' || viewMode === 'lesson')) ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            {viewMode === 'overview' ? (
                                <Card className="border-none shadow-2xl bg-card rounded-[2rem] overflow-hidden">
                                    <div className="p-8 pb-0">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div>
                                                <h2 className="text-3xl font-black">{selectedChapter.chapter_name}</h2>
                                                <p className="text-primary font-bold uppercase text-xs tracking-widest mt-1">
                                                    Focus: {selectedChapter.subject}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateChapterStatus(selectedChapter.id.toString(), selectedChapter.status === 'completed' ? 'pending' : 'completed')}
                                                className={`rounded-xl px-4 h-10 text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                    selectedChapter.status === 'completed' 
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                                    : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground'
                                                }`}
                                            >
                                                {selectedChapter.status === 'completed' ? (
                                                    <span className="flex items-center gap-1.5"><CheckCircle2 size={12} /> Completed</span>
                                                ) : 'Mark Complete'}
                                            </Button>
                                        </div>
                                    </div>

                                    <CardContent className="p-8 pt-6 space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <BookMarked className="h-4 w-4 text-primary" />
                                                    Exam Topics
                                                </h4>
                                                <div className="space-y-2">
                                                    {selectedChapter.topics.map((topic, i) => (
                                                        <div key={i} className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                                                            <span className="text-xs font-bold text-primary/40">0{i + 1}</span>
                                                            <span className="text-sm font-semibold">{topic}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <PlayCircle className="h-4 w-4 text-primary" />
                                                    Hand-picked Resources
                                                </h4>
                                                <div className="space-y-3">
                                                    {selectedChapter.resources?.map((res, i) => (
                                                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3.5 bg-muted/50 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all group">
                                                            <div className="flex items-center gap-3">
                                                                 <div className="h-8 w-8 bg-background rounded-xl flex items-center justify-center text-primary shadow-sm">
                                                                    {res.type === 'video' ? <Video size={16} /> : <FileText size={16} />}
                                                                </div>
                                                                <span className="text-xs font-bold line-clamp-1 group-hover:text-primary transition-colors">{res.title}</span>
                                                            </div>
                                                            <ChevronRight size={14} className="text-muted-foreground" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-border flex flex-col md:flex-row gap-4">
                                            <Button
                                                onClick={handleStartLesson}
                                                className="flex-1 rounded-2xl h-14 text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 shadow-xl shadow-primary/20"
                                            >
                                                <GraduationCap className="mr-2 h-5 w-5" />
                                                Start Deep Lesson
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="px-8 rounded-2xl h-14 text-sm font-black uppercase tracking-widest border-slate-200"
                                                onClick={() => navigate(`/quiz?topic=${encodeURIComponent(selectedChapter.chapter_name)}&subject=${encodeURIComponent(selectedChapter.subject)}&chapterId=${selectedChapter.id.toString()}&examType=${encodeURIComponent(activePlan.exam_type)}&autoStart=true`)}
                                            >
                                                Assessment
                                            </Button>
                                        </div>
                                        <div className="flex justify-center pt-2">
                                            <button 
                                                onClick={() => navigate(`/chat?planId=${activePlan.id}&chapter=${selectedChapter.chapter_name}&query=Give me a detailed 7-day breakdown for ${selectedChapter.chapter_name}`)}
                                                className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest transition-colors flex items-center gap-1.5"
                                            >
                                                <ListChecks size={12} />
                                                Request detailed daily study breakdown
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setViewMode('overview')}
                                            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
                                        >
                                            <ArrowLeft size={16} />
                                            Back to Focus Areas
                                        </button>
                                        <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                            <Sparkles size={12} />
                                            Deep Teaching Mode
                                        </div>
                                    </div>

                                    {selectedChapter.content ? (
                                        <TextSelectionAsk
                                            context={{
                                                topic: selectedChapter.chapter_name,
                                                chapter: selectedChapter.chapter_name,
                                                exam_type: activePlan.exam_type,
                                                subject: selectedChapter.subject,
                                            }}
                                        >
                                        <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
                                            <div className="p-8 md:p-12 space-y-12">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h2 className="text-4xl font-black tracking-tight">{selectedChapter.chapter_name}</h2>
                                                        {selectedChapter.weightage_percent > 0 && (
                                                            <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-full border border-indigo-500/20">
                                                                <Zap className="h-4 w-4" />
                                                                <span className="text-xs font-bold">{selectedChapter.weightage_percent}% Weight</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-start gap-4">
                                                        <p className="flex-1 text-lg text-muted-foreground font-medium leading-relaxed italic border-l-4 border-primary/20 pl-6">
                                                            {selectedChapter.content.overview}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-16">
                                                    {(selectedChapter.content.topic_lessons || []).map((lesson: any, i: number) => (
                                                        <div key={i} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase">Concept 0{i + 1}</span>
                                                                    <h3 className="text-3xl font-black tracking-tight">{lesson.topic}</h3>
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="rounded-full"
                                                                    onClick={() => {
                                                                        const moduleId = `${selectedChapter.id.toString()}_${String(lesson.topic || '').replace(/ /g, '_')}`;
                                                                        navigate(
                                                                            `/chat?moduleId=${encodeURIComponent(moduleId)}&planId=${encodeURIComponent(id || '')}` +
                                                                            `&examType=${encodeURIComponent(activePlan.exam_type)}` +
                                                                            `&chapter=${encodeURIComponent(selectedChapter.chapter_name)}` +
                                                                            `&topic=${encodeURIComponent(String(lesson.topic || ''))}`
                                                                        );
                                                                    }}
                                                                >
                                                                    Ask in Chat
                                                                </Button>
                                                                {lesson.citation && (
                                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full border border-border">
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source: {lesson.citation}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                                                <div className="flex items-start gap-4">
                                                                    <p className="flex-1 text-lg leading-relaxed text-foreground font-medium opacity-90">{lesson.introduction}</p>
                                                                    <ReadAloudButton text={lesson.introduction} className="mt-1" />
                                                                </div>
                                                                <div className="my-6 p-8 bg-muted/30 rounded-[2rem] border border-border/50">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Grounded Explanation</h4>
                                                                        <ReadAloudButton text={lesson.main_explanation} className="text-[10px]" />
                                                                    </div>
                                                                    <div className="text-base leading-loose whitespace-pre-wrap">{lesson.main_explanation}</div>
                                                                </div>
                                                            </div>

                                                            {(lesson.mermaid_diagram || lesson.visual_description || lesson.visuals) && (
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                                                            <TargetIcon size={14} />
                                                                        </div>
                                                                        <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">Visual Study Guide</h4>
                                                                    </div>

                                                                    {lesson.mermaid_diagram && (
                                                                        <div className="bg-muted/10 rounded-[2rem] border border-border/50 p-6 shadow-inner">
                                                                            <Mermaid chart={lesson.mermaid_diagram} />
                                                                        </div>
                                                                    )}

                                                                    {(lesson.visual_description || (lesson.visuals && lesson.visuals[0]?.description)) && (
                                                                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4 transition-all hover:bg-primary/[0.07]">
                                                                            <div className="flex-1">
                                                                                <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                                                                                    {lesson.visual_description || (lesson.visuals && lesson.visuals[0]?.description)}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* 3D Visualization (lazy-loaded, non-breaking) */}
                                                            <div className="pt-2">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                                        3D Visualization
                                                                        <span className="text-[8px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded uppercase">AI-Powered</span>
                                                                    </h4>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="rounded-full"
                                                                        onClick={() => {
                                                                            const key = String(lesson.topic || i);
                                                                            setExpanded3D((prev) => ({
                                                                                ...prev,
                                                                                [key]: !prev[key],
                                                                            }));
                                                                        }}
                                                                    >
                                                                        {expanded3D[String(lesson.topic || i)] ? 'Close 3D' : 'Visualize in 3D'}
                                                                    </Button>
                                                                </div>

                                                                {expanded3D[String(lesson.topic || i)] && (
                                                                    <div className="mt-4">
                                                                        <Suspense fallback={
                                                                            <div className="h-[350px] flex items-center justify-center bg-muted/20 rounded-[2rem] border border-border/50">
                                                                                <div className="text-center">
                                                                                    <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-3" />
                                                                                    <p className="text-xs font-bold text-muted-foreground">Loading 3D engine...</p>
                                                                                </div>
                                                                            </div>
                                                                        }>
                                                                            <TopicVisualizer3D topic={String(lesson.topic || '')} compact />
                                                                        </Suspense>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {lesson.key_points?.map((point: string, k: number) => (
                                                                    <div key={k} className="p-5 bg-card rounded-2xl border border-border flex items-start gap-3">
                                                                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                                                                        <span className="text-sm font-bold text-foreground/80 leading-snug">{point}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Common Mistakes & Exam Tips */}
                                                            {(lesson.common_mistakes?.length > 0 || lesson.exam_tips?.length > 0) && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    {lesson.common_mistakes?.length > 0 && (
                                                                        <div className="p-6 bg-red-500/5 rounded-[2rem] border border-red-500/10 space-y-4">
                                                                            <div className="flex items-center gap-2 text-red-600">
                                                                                <AlertTriangle size={18} />
                                                                                <h4 className="text-[10px] font-black uppercase tracking-widest">Common Pitfalls</h4>
                                                                            </div>
                                                                            <ul className="space-y-3">
                                                                                {lesson.common_mistakes.map((mistake: string, mI: number) => (
                                                                                    <li key={mI} className="text-xs font-bold text-muted-foreground flex items-start gap-2">
                                                                                        <span className="mt-1.5 h-1 w-1 rounded-full bg-red-400 shrink-0" />
                                                                                        {mistake}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                                    {lesson.exam_tips?.length > 0 && (
                                                                        <div className="p-6 bg-amber-500/5 rounded-[2rem] border border-amber-500/10 space-y-4">
                                                                            <div className="flex items-center gap-2 text-amber-600">
                                                                                <Lightbulb size={18} />
                                                                                <h4 className="text-[10px] font-black uppercase tracking-widest">Exam Strategies</h4>
                                                                            </div>
                                                                            <ul className="space-y-3">
                                                                                {lesson.exam_tips.map((tip: string, tI: number) => (
                                                                                    <li key={tI} className="text-xs font-bold text-muted-foreground flex items-start gap-2">
                                                                                        <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                                                                                        {tip}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {lesson.examples?.map((ex: any, exI: number) => (
                                                                <div key={exI} className="bg-slate-900 rounded-[2rem] overflow-hidden shadow-xl border border-white/5">
                                                                    <div className="px-6 py-4 bg-slate-800/50 flex items-center justify-between border-b border-white/5">
                                                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{ex.title}</span>
                                                                    </div>
                                                                    <div className="p-8 space-y-4">
                                                                        <p className="text-slate-400 text-sm leading-relaxed">{ex.description}</p>
                                                                        {ex.code && (
                                                                            <pre className="p-6 bg-black/40 rounded-2xl border border-white/5 overflow-x-auto">
                                                                                <code className="text-green-400 text-xs font-mono">{ex.code}</code>
                                                                            </pre>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {lesson.practical_implementation && (
                                                                <div className="mt-8 bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-blue-500/30">
                                                                    <div className="px-6 py-5 bg-gradient-to-r from-blue-900/40 to-slate-800 flex items-center gap-3 border-b border-white/5">
                                                                        <Terminal size={20} className="text-blue-400" />
                                                                        <h3 className="text-sm font-black text-blue-300 uppercase tracking-widest">Practical Implementation</h3>
                                                                    </div>
                                                                    <div className="p-8 space-y-6">
                                                                        <div>
                                                                            <h4 className="text-lg font-bold text-white mb-2">{lesson.practical_implementation.project_title}</h4>
                                                                            <p className="text-slate-400 text-sm leading-relaxed">{lesson.practical_implementation.description}</p>
                                                                        </div>
                                                                        
                                                                        <div className="space-y-6">
                                                                            {lesson.practical_implementation.steps.map((step: any, sIdx: number) => (
                                                                                <div key={sIdx} className="relative pl-8 border-l-2 border-blue-500/20 last:border-transparent pb-6 last:pb-0">
                                                                                    <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-blue-500 border-4 border-slate-900" />
                                                                                    <h5 className="text-md font-bold text-slate-200 mb-1">{step.title}</h5>
                                                                                    <p className="text-sm text-slate-400 mb-3">{step.description}</p>
                                                                                    
                                                                                    {step.command && (
                                                                                        <div className="mb-3">
                                                                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Terminal</div>
                                                                                            <pre className="p-4 bg-black/60 rounded-xl border border-white/5 overflow-x-auto text-green-400 font-mono text-xs">
                                                                                                $ {step.command}
                                                                                            </pre>
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    {step.code && (
                                                                                        <div>
                                                                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Code / Config</div>
                                                                                            <pre className="p-4 bg-slate-950 rounded-xl border border-white/5 overflow-x-auto text-blue-300 font-mono text-xs">
                                                                                                {step.code}
                                                                                            </pre>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Mindmap (collapsed by default) */}
                                                            <div className="pt-2">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                                        Mindmap
                                                                        <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">RAG-Powered</span>
                                                                    </h4>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="rounded-full"
                                                                        onClick={() => {
                                                                            const key = String(lesson.topic || i);
                                                                            setExpandedMindmaps((prev) => ({
                                                                                ...prev,
                                                                                [key]: !prev[key],
                                                                            }));
                                                                        }}
                                                                    >
                                                                        {expandedMindmaps[String(lesson.topic || i)] ? 'Collapse' : 'Expand'}
                                                                    </Button>
                                                                </div>

                                                                {expandedMindmaps[String(lesson.topic || i)] && (
                                                                    <div className="mt-4 h-[420px] bg-muted/20 rounded-[2rem] border border-border/50 overflow-hidden">
                                                                        <TopicMindmap
                                                                            topicId={`${selectedChapter.id.toString()}_${String(lesson.topic || '').replace(/ /g, '_')}`}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-12 border-t flex flex-col items-center gap-6">
                                                    <div className="text-center space-y-2">
                                                        <h4 className="text-xl font-black italic">Ready to verify?</h4>
                                                        <p className="text-sm text-muted-foreground font-medium">Take a quick quiz to cement these concepts.</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => navigate(`/quiz?topic=${encodeURIComponent(selectedChapter.chapter_name)}&subject=${encodeURIComponent(selectedChapter.subject)}&chapterId=${selectedChapter.id.toString()}&examType=${encodeURIComponent(activePlan.exam_type)}&autoStart=true`)}
                                                        className="h-16 px-12 rounded-full text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/20"
                                                    >
                                                        Take Knowledge Check 🚀
                                                    </Button>

                                                    {/* Premium Navigation Footer */}
                                                    <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 mt-6 border-t border-slate-100/80">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                const scrollToTopGlobal = (behavior: ScrollBehavior = 'smooth') => {
                                                                    if (contentAreaRef.current) contentAreaRef.current.scrollTo({ top: 0, behavior });
                                                                    window.scrollTo({ top: 0, behavior });
                                                                };
                                                                scrollToTopGlobal('smooth');
                                                            }}
                                                            className="w-full sm:w-auto rounded-full px-6 h-12 font-bold flex items-center justify-center gap-2 border-slate-200 hover:bg-slate-50 transition-all text-slate-700"
                                                        >
                                                            <ArrowUp size={16} />
                                                            Go to Top
                                                        </Button>

                                                        {(() => {
                                                            const sortedChapters = [...activePlan.chapters].sort((a, b) => 
                                                                sortByWeightage ? (b.weightage_percent - a.weightage_percent) : (a.order_index - b.order_index)
                                                            );
                                                            const currentIndex = sortedChapters.findIndex(c => c.id.toString() === selectedChapterId);
                                                            const nextChapter = currentIndex !== -1 && currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

                                                            if (nextChapter) {
                                                                return (
                                                                    <Button
                                                                        variant="default"
                                                                        onClick={() => {
                                                                            const scrollToTopGlobal = (behavior: ScrollBehavior = 'instant') => {
                                                                                if (contentAreaRef.current) contentAreaRef.current.scrollTop = 0;
                                                                                window.scrollTo({ top: 0, behavior });
                                                                            };
                                                                            setSelectedChapterId(nextChapter.id.toString());
                                                                            setViewMode('lesson'); // Stay in lesson mode!
                                                                            if (!nextChapter.content || !nextChapter.content.topic_lessons) {
                                                                                teachChapter(nextChapter.id.toString());
                                                                            }
                                                                            scrollToTopGlobal('instant');
                                                                            setTimeout(() => scrollToTopGlobal('instant'), 50);
                                                                            setTimeout(() => scrollToTopGlobal('instant'), 150);
                                                                            setTimeout(() => scrollToTopGlobal('instant'), 300);
                                                                        }}
                                                                        className="w-full sm:w-auto rounded-full px-8 h-12 font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                                                                    >
                                                                        Next Chapter: {nextChapter.chapter_name.length > 25 ? nextChapter.chapter_name.slice(0, 25) + '...' : nextChapter.chapter_name}
                                                                        <ChevronRight size={16} />
                                                                    </Button>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                        </TextSelectionAsk>
                                    ) : (
                                        <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
                                            <div className="p-8 md:p-12 space-y-12 animate-pulse">
                                                {/* Header Section Skeleton */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <Skeleton className="h-10 w-2/3 rounded-xl" />
                                                        <Skeleton className="h-6 w-24 rounded-full" />
                                                    </div>
                                                    <div className="flex items-start gap-4 border-l-4 border-primary/20 pl-6">
                                                        <div className="flex-1 space-y-2 py-1">
                                                            <Skeleton className="h-4 w-full rounded" />
                                                            <Skeleton className="h-4 w-5/6 rounded" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-16">
                                                    {/* Concept Skeletons */}
                                                    {[1, 2].map((i) => (
                                                        <div key={i} className="space-y-8">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <Skeleton className="h-6 w-20 rounded-lg" />
                                                                    <Skeleton className="h-8 w-64 rounded-xl" />
                                                                </div>
                                                                <Skeleton className="h-8 w-24 rounded-full" />
                                                            </div>

                                                            <div className="space-y-3">
                                                                <Skeleton className="h-4 w-full rounded" />
                                                                <Skeleton className="h-4 w-full rounded" />
                                                                <Skeleton className="h-4 w-3/4 rounded" />
                                                            </div>

                                                            {/* Grounded Explanation Box Skeleton */}
                                                            <div className="p-8 bg-muted/30 rounded-[2rem] border border-border/50 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <Skeleton className="h-4 w-36 rounded" />
                                                                    <Skeleton className="h-4 w-12 rounded" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Skeleton className="h-4 w-full rounded" />
                                                                    <Skeleton className="h-4 w-full rounded" />
                                                                    <Skeleton className="h-4 w-5/6 rounded" />
                                                                    <Skeleton className="h-4 w-full rounded" />
                                                                    <Skeleton className="h-4 w-4/5 rounded" />
                                                                </div>
                                                            </div>

                                                            {/* Visual Study Guide Box Skeleton */}
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Skeleton className="h-5 w-5 rounded-lg" />
                                                                    <Skeleton className="h-4 w-32 rounded" />
                                                                </div>
                                                                <Skeleton className="h-[200px] w-full rounded-[2rem]" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {isEditModalOpen && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                                    <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-card border border-border">
                                        <CardHeader className="p-8 pb-4">
                                            <CardTitle className="text-2xl font-black">Edit Study Plan</CardTitle>
                                            <CardDescription>Adjust your learning pace and deadline</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-4 space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Daily Hours</label>
                                                    <input 
                                                        type="number" 
                                                        defaultValue={activePlan.daily_hours}
                                                        min={1}
                                                        max={24}
                                                        className="w-full bg-muted/50 border-none rounded-2xl h-12 px-4 font-bold focus:ring-2 focus:ring-primary outline-none"
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (val > 0) activePlan.daily_hours = val;
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Target Date</label>
                                                    <input 
                                                        type="date" 
                                                        defaultValue={activePlan.target_date}
                                                        className="w-full bg-muted/50 border-none rounded-2xl h-12 px-4 font-bold focus:ring-2 focus:ring-primary outline-none"
                                                        onChange={(e) => {
                                                            activePlan.target_date = e.target.value;
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <Button 
                                                    variant="outline" 
                                                    className="flex-1 rounded-2xl h-12 font-bold"
                                                    onClick={() => setIsEditModalOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    className="flex-1 rounded-2xl h-12 font-bold"
                                                    onClick={async () => {
                                                        const { updatePlan } = useStudyPlanStore.getState();
                                                        await updatePlan(activePlan.id, {
                                                            daily_hours: activePlan.daily_hours,
                                                            target_date: activePlan.target_date
                                                        });
                                                        setIsEditModalOpen(false);
                                                    }}
                                                >
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                            
                            <Card className="mt-8 rounded-[2rem] border-none bg-gradient-to-br from-primary/10 to-primary/5 shadow-inner overflow-hidden">
                                <CardContent className="p-8 flex items-start gap-6">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                                        <Lightbulb className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-primary">AI Strategy Note</h4>
                                        <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                                            Your study plan is dynamic. If you find certain chapters too easy or too hard, use the <span className="text-primary">Regenerate</span> feature. 
                                            Our AI analyzes your quiz performance to re-prioritize topics, ensuring you spend time where it matters most. 
                                            <span className="block mt-2 opacity-60">Smarter plans = Faster mastery.</span>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : viewMode === 'courses' ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-card">
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                            <Video size={24} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-black">Recommended Courses</CardTitle>
                                            <CardDescription>Curated high-quality video courses and playlists for {activePlan.exam_type}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 pt-4">
                                    {(activePlan.recommended_courses && activePlan.recommended_courses.length > 0) ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {activePlan.recommended_courses.map((course: any, i: number) => (
                                                <a 
                                                    key={i} 
                                                    href={course.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="group relative flex flex-col p-6 bg-muted/20 rounded-[2rem] border border-border/50 hover:bg-muted/40 transition-all hover:-translate-y-1 hover:shadow-lg"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                                                            course.platform === 'YouTube' ? 'bg-red-500/10 text-red-600' : 
                                                            course.platform === 'Coursera' ? 'bg-blue-500/10 text-blue-600' :
                                                            'bg-primary/10 text-primary'
                                                        }`}>
                                                            {course.platform}
                                                        </div>
                                                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                            <ChevronRight size={16} />
                                                        </div>
                                                    </div>
                                                    
                                                    <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                                                        {course.description}
                                                    </p>
                                                    
                                                    <div className="mt-auto flex items-center gap-2 text-xs font-bold text-muted-foreground group-hover:text-primary/70">
                                                        <PlayCircle size={14} />
                                                        Start Learning
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : isSearchingCourses ? (
                                        <div className="text-center py-12 space-y-4">
                                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto animate-pulse">
                                                <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-muted-foreground">Curating Recommendations...</h3>
                                                <p className="text-sm text-muted-foreground/60">Our AI agent is searching for the best courses for you. This may take a few seconds.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 space-y-4">
                                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                                <AlertTriangle className="h-8 w-8 text-muted-foreground/30" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-muted-foreground">No Courses Found</h3>
                                                <p className="text-sm text-muted-foreground/60">We couldn't find any specific courses for this exam right now.</p>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="mt-4"
                                                    onClick={() => getCourses(activePlan.id.toString())}
                                                >
                                                    Try Again
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ) : viewMode === 'resources' ? (
                        <ResourcesTab 
                            planId={activePlan.id.toString()} 
                            resources={activePlan.plan_metadata?.resources || []}
                            onResourceAdded={() => id && getPlan(id)} 
                        />
                    ) : (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-4 border-dashed border-muted rounded-[3rem] p-12 text-center bg-muted/5 transition-all hover:bg-muted/10">
                            <div className="max-w-xs space-y-4">
                                <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <BookOpen className="h-10 w-10 text-muted-foreground opacity-30" />
                                </div>
                                <h3 className="text-2xl font-black opacity-40 uppercase tracking-tighter">Your Journey Starts Here</h3>
                                <p className="text-sm font-bold text-muted-foreground/40 leading-relaxed uppercase tracking-tighter">
                                    Select a chapter from the left to unlock deep AI teaching and adaptive quizzes.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {activePlan && (
                <FeedbackModal
                    isOpen={isFeedbackModalOpen}
                    onClose={() => setIsFeedbackModalOpen(false)}
                    contentType="plan"
                    contentId={activePlan.id.toString()}
                    title={`Rate ${activePlan.exam_type} Plan`}
                />
            )}
        </div>
    );
};
