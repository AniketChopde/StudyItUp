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
    BookOpen, Zap, Trophy, Medal, Star
} from 'lucide-react';
import { Loading } from '../components/ui/Loading';
import { gamificationService } from '../api/services';
import type { BadgeOut } from '../types';

export const AnalyticsPage: React.FC = () => {
    const navigate = useNavigate();
    const [topicAnalysis, setTopicAnalysis] = React.useState<any[]>([]);
    const [subjectAnalysis, setSubjectAnalysis] = React.useState<any[]>([]);
    const [weakStrong, setWeakStrong] = React.useState<any>(null);
    const [gamificationProfile, setGamificationProfile] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<'subjects' | 'topics' | 'weak-strong' | 'badges'>('subjects');

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [topicsRes, subjectsRes, wsRes, gamificationRes] = await Promise.all([
                analyticsService.getTopicAnalysis(),
                analyticsService.getSubjectAnalysis(),
                analyticsService.getWeakStrongAnalysis(),
                gamificationService.getProfile()
            ]);
            setTopicAnalysis(topicsRes.data || []);
            setSubjectAnalysis(subjectsRes.data || []);
            setWeakStrong(wsRes.data);
            setGamificationProfile(gamificationRes.data);
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
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loading size="lg" text="Analyzing your performance..." />
            </div>
        );
    }

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Performance Analytics</h1>
                    <p className="text-muted-foreground mt-2">
                        Deep dive into your learning progress and subject mastery.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchData} size="sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg w-fit">
                {(['subjects', 'topics', 'weak-strong', 'badges'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === tab 
                            ? 'bg-background shadow-sm text-foreground' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' & ')}
                    </button>
                ))}
            </div>

            {activeTab === 'subjects' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Subject Performance</CardTitle>
                            <CardDescription>Average scores across different subjects</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectAnalysis}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="subject" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip 
                                        cursor={{fill: 'transparent'}}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="avg_score" radius={[4, 4, 0, 0]} barSize={40}>
                                        {subjectAnalysis.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Subject Distribution</CardTitle>
                            <CardDescription>Number of quizzes per subject</CardDescription>
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
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'topics' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Topic Drill-down</CardTitle>
                        <CardDescription>Granular performance data per topic</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="pb-4 font-semibold">Topic</th>
                                        <th className="pb-4 font-semibold text-center">Avg Score</th>
                                        <th className="pb-4 font-semibold text-center">Attempts</th>
                                        <th className="pb-4 font-semibold text-center">Avg Time</th>
                                        <th className="pb-4 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {topicAnalysis.map((topic) => (
                                        <tr key={topic.topic} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-4 font-medium">{topic.topic}</td>
                                            <td className="py-4 text-center">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                                    topic.avg_score >= 80 ? 'bg-green-100 text-green-700' :
                                                    topic.avg_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {topic.avg_score}%
                                                </span>
                                            </td>
                                            <td className="py-4 text-center text-muted-foreground">{topic.attempts}</td>
                                            <td className="py-4 text-center text-muted-foreground">{topic.avg_time_seconds}s</td>
                                            <td className="py-4">
                                                {topic.avg_score >= 80 ? (
                                                    <span className="flex items-center text-green-600 text-sm">
                                                        <CheckCircle className="h-4 w-4 mr-1" /> Mastered
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-amber-600 text-sm">
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
                        <Card className="border-red-100 bg-red-50/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-700">
                                    <AlertTriangle className="h-5 w-5" />
                                    Weak Topics
                                </CardTitle>
                                <CardDescription>Topics where you scored below 60%</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {weakStrong.weak_topics.length > 0 ? (
                                        weakStrong.weak_topics.map((t: any) => (
                                            <div key={t.topic} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-red-100">
                                                <span className="font-medium">{t.topic}</span>
                                                <span className="text-red-600 font-bold">{t.avg_score}%</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-muted-foreground py-4">No weak topics detected. Great job!</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-green-100 bg-green-50/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-700">
                                    <Award className="h-5 w-5" />
                                    Strong Topics
                                </CardTitle>
                                <CardDescription>Topics where you scored 80% or above</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {weakStrong.strong_topics.length > 0 ? (
                                        weakStrong.strong_topics.map((t: any) => (
                                            <div key={t.topic} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-green-100">
                                                <span className="font-medium">{t.topic}</span>
                                                <span className="text-green-600 font-bold">{t.avg_score}%</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-muted-foreground py-4">Keep practicing to build your core strengths.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Zap className="h-6 w-6 text-indigo-500" />
                            Smart Recommendations
                        </h2>
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

                                return (
                                    <Card 
                                        key={idx} 
                                        className="hover:shadow-md transition-shadow group"
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 p-2 rounded-lg ${
                                                    rec.type === 'improvement' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                                }`}>
                                                    {rec.type === 'improvement' ? <BookOpen size={20} /> : <Award size={20} />}
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    <p className="font-bold text-sm uppercase tracking-wider opacity-60">
                                                        {rec.topic}
                                                    </p>
                                                    <p className="text-sm leading-relaxed mb-4">{rec.message}</p>
                                                    
                                                    <div className="flex flex-wrap gap-2">
                                                        {rec.type === 'improvement' ? (
                                                            <>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline"
                                                                    className="text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                                    onClick={handleRereadAction}
                                                                >
                                                                    {rec.chapter_id ? 'Re-read Chapter' : 'Go to Study Plan'}
                                                                </Button>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="ghost" 
                                                                    className="text-indigo-600 px-2 h-9 hover:bg-transparent hover:text-indigo-700 group-hover:translate-x-1 transition-transform text-xs font-bold"
                                                                    onClick={handleChatAction}
                                                                >
                                                                    Ask AI Tutor →
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                className="text-indigo-600 px-0 hover:bg-transparent hover:text-indigo-700 group-hover:translate-x-1 transition-transform text-xs font-bold"
                                                                onClick={handleQuizAction}
                                                            >
                                                                Start specialized test →
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'badges' && gamificationProfile && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none overflow-hidden relative group">
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Trophy size={140} />
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Total Badges</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-4xl font-bold">{gamificationProfile.badges.length}</h3>
                                    <span className="text-white/60 text-sm font-medium">Achievements</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-400 to-orange-500 text-white border-none overflow-hidden relative group">
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Medal size={140} />
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Current Level</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-4xl font-bold">{gamificationProfile.level}</h3>
                                    <span className="text-white/60 text-sm font-medium">Scholar Status</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-none overflow-hidden relative group">
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Star size={140} />
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <p className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Total XP</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-4xl font-bold">{gamificationProfile.total_xp}</h3>
                                    <span className="text-white/60 text-sm font-medium">Points</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Badge Gallery</CardTitle>
                            <CardDescription>All the certifications and achievements you've earned.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {gamificationProfile.badges.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {gamificationProfile.badges.map((badge: BadgeOut, idx: number) => (
                                        <div 
                                            key={idx} 
                                            className="flex flex-col items-center text-center p-4 rounded-2xl border border-indigo-50 bg-indigo-50/20 hover:bg-indigo-50/50 transition-all group hover:-translate-y-1"
                                        >
                                            <div className="text-4xl mb-3 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                                {badge.icon || '🏆'}
                                            </div>
                                            <h4 className="font-bold text-sm text-indigo-900 mb-1">{badge.name}</h4>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {badge.description}
                                            </p>
                                            {badge.earned_at && (
                                                <p className="text-[10px] text-indigo-400 mt-2 font-medium">
                                                    Earned {new Date(badge.earned_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Trophy className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                                    <h3 className="font-medium text-lg">No Badges Yet</h3>
                                    <p className="text-muted-foreground text-sm max-w-xs">
                                        Keep studying and completing quizzes to earn your first achievements!
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
