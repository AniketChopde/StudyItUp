import React from 'react';
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
import { Loading } from '../components/ui/Loading';

export const AnalyticsPage: React.FC = () => {
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
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loading size="lg" text="Analyzing your performance..." />
            </div>
        );
    }

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
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
            <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
                {(['subjects', 'topics', 'weak-strong'] as const).map((tab) => (
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
                            {weakStrong.recommendations.map((rec: any, idx: number) => (
                                <Card key={idx} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 p-2 rounded-lg ${
                                                rec.type === 'improvement' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                                {rec.type === 'improvement' ? <BookOpen size={20} /> : <Award size={20} />}
                                            </div>
                                            <div className="space-y-2">
                                                <p className="font-bold text-sm uppercase tracking-wider opacity-60">
                                                    {rec.topic}
                                                </p>
                                                <p className="text-sm leading-relaxed">{rec.message}</p>
                                                <Button size="sm" variant="ghost" className="text-indigo-600 px-0 hover:bg-transparent hover:text-indigo-700">
                                                    Start specialized {rec.type === 'improvement' ? 'tutorial' : 'test'} →
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
