import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { analyticsService } from '../api/services';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
    PieChart, Pie, Legend 
} from 'recharts';
import { 
    TrendingUp, Award, AlertTriangle, CheckCircle, 
    BookOpen, Zap
} from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

export const AnalyticsPage: React.FC = () => {
    const navigate = useNavigate();
    const [topicAnalysis, setTopicAnalysis] = React.useState<any[]>([]);
    const [subjectAnalysis, setSubjectAnalysis] = React.useState<any[]>([]);
    const [weakStrong, setWeakStrong] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<'subjects' | 'topics' | 'weak-strong'>('subjects');

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [topicsRes, subjectsRes, wsRes] = await Promise.all([
                analyticsService.getTopicAnalysis(),
                analyticsService.getSubjectAnalysis(),
                analyticsService.getWeakStrongAnalysis()
            ]);
            setTopicAnalysis(topicsRes.data || []);
            setSubjectAnalysis(subjectsRes.data || []);
            setWeakStrong(wsRes.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-10 w-64 mb-2" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Skeleton className="lg:col-span-2 h-[500px] rounded-xl" />
                    <Skeleton className="h-[500px] rounded-xl" />
                </div>
            </div>
        );
    }

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];
    const tooltipStyle = {
        backgroundColor: '#0d1122',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        color: '#e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Performance Analytics</h1>
                    <p className="text-slate-400 text-xs mt-1">
                        Deep dive into your learning progress and subject mastery.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchData} size="sm" className="glass border-white/10 text-slate-200 hover:bg-white/8">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 glass p-1 rounded-xl w-fit border border-white/8">
                {(['subjects', 'topics', 'weak-strong'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                            activeTab === tab 
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' & ')}
                    </button>
                ))}
            </div>

            {activeTab === 'subjects' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 glass-card border border-white/8">
                        <CardHeader>
                            <CardTitle className="text-white">Subject Performance</CardTitle>
                            <CardDescription className="text-slate-400">Average scores across different subjects</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectAnalysis}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                                        contentStyle={tooltipStyle}
                                    />
                                    <Bar dataKey="avg_score" radius={[6, 6, 0, 0]} barSize={40}>
                                        {subjectAnalysis.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border border-white/8">
                        <CardHeader>
                            <CardTitle className="text-white">Subject Distribution</CardTitle>
                            <CardDescription className="text-slate-400">Number of quizzes per subject</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subjectAnalysis}
                                        dataKey="quiz_count"
                                        nameKey="subject"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {subjectAnalysis.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'topics' && (
                <Card className="glass-card border border-white/8">
                    <CardHeader>
                        <CardTitle className="text-white">Topic Drill-down</CardTitle>
                        <CardDescription className="text-slate-400">Granular performance data per topic</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/8">
                                        <th className="pb-4 font-semibold text-slate-300">Topic</th>
                                        <th className="pb-4 font-semibold text-slate-300 text-center">Avg Score</th>
                                        <th className="pb-4 font-semibold text-slate-300 text-center">Attempts</th>
                                        <th className="pb-4 font-semibold text-slate-300 text-center">Avg Time</th>
                                        <th className="pb-4 font-semibold text-slate-300">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {topicAnalysis.map((topic) => (
                                        <tr key={topic.topic} className="hover:bg-white/3 transition-colors">
                                            <td className="py-4 font-medium text-slate-200">{topic.topic}</td>
                                            <td className="py-4 text-center">
                                                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-bold ${
                                                    topic.avg_score >= 80 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                                                    topic.avg_score >= 60 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                                                    'bg-red-500/15 text-red-400 border border-red-500/25'
                                                }`}>
                                                    {topic.avg_score}%
                                                </span>
                                            </td>
                                            <td className="py-4 text-center text-slate-400">{topic.attempts}</td>
                                            <td className="py-4 text-center text-slate-400">{topic.avg_time_seconds}s</td>
                                            <td className="py-4">
                                                {topic.avg_score >= 80 ? (
                                                    <span className="flex items-center text-emerald-400 text-sm font-semibold">
                                                        <CheckCircle className="h-4 w-4 mr-1" /> Mastered
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-amber-400 text-sm font-semibold">
                                                        <Zap className="h-4 w-4 mr-1" /> Learning
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'weak-strong' && weakStrong && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Weak Topics Card */}
                        <div className="glass-card rounded-2xl border border-red-500/20 overflow-hidden">
                            <div className="px-6 py-5 bg-red-500/8 border-b border-red-500/15 flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                                <div>
                                    <h3 className="font-bold text-red-300 text-base">Weak Topics</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Topics where you scored below 60%</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-3">
                                {weakStrong.weak_topics.length > 0 ? (
                                    weakStrong.weak_topics.map((t: any) => (
                                        <div key={t.topic} className="flex justify-between items-center p-3 bg-red-500/5 rounded-xl border border-red-500/15 hover:bg-red-500/10 transition-colors">
                                            <span className="font-semibold text-slate-200 text-sm">{t.topic}</span>
                                            <span className="text-red-400 font-bold text-sm bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">{t.avg_score}%</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-400 py-6 text-sm">No weak topics detected. Great job!</p>
                                )}
                            </div>
                        </div>

                        {/* Strong Topics Card */}
                        <div className="glass-card rounded-2xl border border-emerald-500/20 overflow-hidden">
                            <div className="px-6 py-5 bg-emerald-500/8 border-b border-emerald-500/15 flex items-center gap-3">
                                <Award className="h-5 w-5 text-emerald-400" />
                                <div>
                                    <h3 className="font-bold text-emerald-300 text-base">Strong Topics</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Topics where you scored 80% or above</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-3">
                                {weakStrong.strong_topics.length > 0 ? (
                                    weakStrong.strong_topics.map((t: any) => (
                                        <div key={t.topic} className="flex justify-between items-center p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/15 hover:bg-emerald-500/10 transition-colors">
                                            <span className="font-semibold text-slate-200 text-sm">{t.topic}</span>
                                            <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">{t.avg_score}%</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-400 py-6 text-sm">Keep practicing to build your core strengths.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Smart Recommendations */}
                    <div>
                        <div className="flex items-center gap-2 mb-5">
                            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <Zap className="h-3.5 w-3.5 text-indigo-400" />
                            </div>
                            <p className="section-label">Smart Recommendations</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {weakStrong.recommendations.map((rec: any, idx: number) => {
                                const handleChatAction = () => {
                                    navigate(`/chat?topic=${encodeURIComponent(rec.topic)}&subject=${encodeURIComponent(rec.subject)}`);
                                };

                                const handleRereadAction = () => {
                                    if (rec.plan_id) {
                                        const url = rec.chapter_id 
                                            ? `/study-plans/${rec.plan_id}?chapterId=${rec.chapter_id}`
                                            : `/study-plans/${rec.plan_id}`;
                                        navigate(url);
                                    } else {
                                        navigate(`/study-plans`);
                                    }
                                };

                                const handleQuizAction = () => {
                                    navigate(`/quiz?topic=${encodeURIComponent(rec.topic)}&subject=${encodeURIComponent(rec.subject)}&autoStart=true`);
                                };

                                const isImprovement = rec.type === 'improvement';

                                return (
                                    <div
                                        key={idx}
                                        className={`glass-card rounded-2xl border p-6 hover:shadow-lg transition-all group ${
                                            isImprovement ? 'border-red-500/15 hover:border-red-500/30' : 'border-emerald-500/15 hover:border-emerald-500/30'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${
                                                isImprovement ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                                            }`}>
                                                {isImprovement ? <BookOpen size={18} /> : <Award size={18} />}
                                            </div>
                                            <div className="space-y-2 flex-1 min-w-0">
                                                <p className={`font-bold text-xs uppercase tracking-wider ${
                                                    isImprovement ? 'text-red-400' : 'text-emerald-400'
                                                }`}>
                                                    {rec.topic}
                                                </p>
                                                <p className="text-sm leading-relaxed text-slate-300 mb-4">{rec.message}</p>

                                                <div className="flex flex-wrap gap-2">
                                                    {isImprovement ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs font-bold glass border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/15"
                                                                onClick={handleRereadAction}
                                                            >
                                                                {rec.chapter_id ? 'Re-read Chapter' : 'Go to Study Plan'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-indigo-400 px-2 h-9 hover:bg-indigo-500/10 hover:text-indigo-300 group-hover:translate-x-1 transition-transform text-xs font-bold"
                                                                onClick={handleChatAction}
                                                            >
                                                                Ask AI Tutor →
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-indigo-400 px-0 hover:bg-transparent hover:text-indigo-300 group-hover:translate-x-1 transition-transform text-xs font-bold"
                                                            onClick={handleQuizAction}
                                                        >
                                                            Start specialized test →
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
