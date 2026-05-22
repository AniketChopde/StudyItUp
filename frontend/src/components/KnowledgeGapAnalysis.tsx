import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { AlertCircle, Target, Brain, BookOpen } from 'lucide-react';

interface KnowledgeGapResult {
    is_correct: boolean;
    topic?: string;
    explanation: string;
    question_text?: string;
}

interface KnowledgeGapAnalysisProps {
    results: KnowledgeGapResult[];
}

export const KnowledgeGapAnalysis: React.FC<KnowledgeGapAnalysisProps> = ({ results }) => {
    // Analyze results to find weak areas
    const analysis = useMemo(() => {
        const incorrectResults = results.filter(r => !r.is_correct);
        
        if (incorrectResults.length === 0) {
            return null; // Perfect score!
        }

        // Try to group by sub-topic if available, otherwise just use explanations
        const topics = new Map<string, number>();
        incorrectResults.forEach(r => {
            const topic = r.topic || "General Concepts";
            topics.set(topic, (topics.get(topic) || 0) + 1);
        });

        const sortedTopics = Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([topic, count]) => ({ topic, count }));

        return {
            totalGaps: incorrectResults.length,
            topics: sortedTopics,
            sampleExplanations: incorrectResults.slice(0, 3).map(r => r.explanation)
        };
    }, [results]);

    if (!analysis) {
        return (
            <Card className="border-none shadow-sm bg-green-50/50 dark:bg-green-900/10 rounded-2xl">
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                        <Target size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-green-800 dark:text-green-400">Perfect Mastery</h3>
                        <p className="text-sm text-green-700/80 dark:text-green-500/80">No knowledge gaps detected in this simulation. Excellent work!</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm bg-card rounded-2xl overflow-hidden mt-6">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="text-primary" size={20} />
                    Knowledge Gap Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Weak Areas Summary */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Identified Weak Areas</h4>
                        <div className="space-y-2">
                            {analysis.topics.map((t, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="text-red-500" size={16} />
                                        <span className="font-medium text-red-900 dark:text-red-200">{t.topic}</span>
                                    </div>
                                    <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-md">
                                        {t.count} Missed
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Items */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Key Learnings to Review</h4>
                        <div className="space-y-3">
                            {analysis.sampleExplanations.map((exp, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm">
                                    <BookOpen className="text-primary mt-0.5 shrink-0" size={16} />
                                    <p className="text-muted-foreground leading-relaxed">{exp}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
