import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuizStore } from '../stores/quizStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loading } from '../components/ui/Loading';
import { Play, Timer, CheckCircle, XCircle, Award, AlertTriangle, Clock, ArrowRight, Brain, Target, ShieldCheck } from 'lucide-react';
import { formatTime } from '../lib/utils';
import toast from 'react-hot-toast';
import { ReadAloudButton } from '../components/voice/VoiceButton';
import { EngagementButtons } from '../components/EngagementButtons';
import { KnowledgeGapAnalysis } from '../components/KnowledgeGapAnalysis';
import { quizService } from '../api/services';
import type { QuizHistoryItem } from '../types';

export const TestCenterPage: React.FC = () => {
    const {
        activeQuiz,
        currentQuestion,
        answers,
        results,
        timeStarted,
        pendingSessionId,
        quizSource,
        startTestCenter,
        submitAnswer,
        submitQuiz,
        nextQuestion,
        previousQuestion,
        resetQuiz,
        loadQuizResult,
        isLoading,
    } = useQuizStore();

    const [searchParams] = useSearchParams();
    const [examName, setExamName] = React.useState(searchParams.get('examName') || '');
    const planId = searchParams.get('planId') || undefined;
    const [language, setLanguage] = React.useState('English');
    const [timeLeft, setTimeLeft] = React.useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
    const [visitedQuestions, setVisitedQuestions] = React.useState<Set<number>>(new Set([0]));
    const [showSubmitModal, setShowSubmitModal] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // History State
    const [history, setHistory] = React.useState<QuizHistoryItem[]>([]);
    const [, setLoadingHistory] = React.useState(false);

    React.useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setVisitedQuestions(prev => new Set(prev).add(currentQuestion));
    }, [currentQuestion]);

    const showQuizConfig = !activeQuiz && !results;

    // Fetch history when on the config view
    React.useEffect(() => {
        if (showQuizConfig) {
            setLoadingHistory(true);
            quizService.getHistory()
                .then(response => {
                    const data = response.data;
                    const testCenterHistory = data.filter(item => item.subject === 'General' || item.topic === examName);
                    setHistory(testCenterHistory.slice(0, 5));
                })
                .catch(err => console.error("Failed to load history", err))
                .finally(() => setLoadingHistory(false));
        }
    }, [showQuizConfig, examName]);

    // Initialization: If we come back and there's no active quiz and no pending session, reset
    React.useEffect(() => {
        if (!activeQuiz && !results && !pendingSessionId && !isLoading) {
            resetQuiz();
        }
    }, []);

    // Timer Logic: countdown when time_limit_minutes set, else just track elapsed
    React.useEffect(() => {
        if (!activeQuiz || !timeStarted || results) return;

        const totalMinutes = activeQuiz.time_limit_minutes ?? Math.max(10, Math.ceil(activeQuiz.questions.length * 1.5));
        const totalSeconds = totalMinutes * 60;

        const intervalId = setInterval(() => {
            const elapsed = Math.floor((Date.now() - timeStarted) / 1000);
            setElapsedSeconds(elapsed);
            const remaining = Math.max(0, totalSeconds - elapsed);
            setTimeLeft(remaining);

            if (remaining === 0) {
                clearInterval(intervalId);
                handleAutoSubmit();
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [activeQuiz, timeStarted, results]);

    const handleStartTest = async () => {
        if (!examName.trim()) {
            toast.error('Please enter an exam name');
            return;
        }
        await startTestCenter(examName, planId, language);
    };

    const handleAutoSubmit = async () => {
        toast.error("Time's up! Submitting your exam automatically.");
        await submitQuiz();
    };

    const handleManualSubmit = () => {
        setShowSubmitModal(true);
    };

    const currentQ = activeQuiz?.questions[currentQuestion];
    const selectedAnswer = currentQ ? answers[currentQ.question_id] : undefined;

    // Preparing: Test Center session is generating questions (polling)
    if (pendingSessionId) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loading text="Preparing your test..." />
            </div>
        );
    }

    // 1. Landing / Entry View
    if (showQuizConfig) {
        return (
            <div className="max-w-3xl mx-auto px-4 animate-in fade-in duration-700">
                <div className="text-center mb-8 space-y-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3 shadow-inner">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-xl font-bold text-white uppercase tracking-wide mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Exam Test Center</h1>
                    <p className="text-muted-foreground font-medium max-w-lg mx-auto text-base">
                        20-question exam simulations with timer. Starts in under 10 seconds.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-3 hover:bg-blue-500/10 transition-colors">
                        <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <Clock className="text-blue-600 h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black">Simulation Engine</h3>
                            <p className="text-xs font-medium text-muted-foreground mt-1">
                                One quick generation, dynamic timer. Test auto-closes when time is up.
                            </p>
                        </div>
                    </div>
                    <div className="p-5 bg-purple-500/5 border border-purple-500/10 rounded-2xl space-y-3 hover:bg-purple-500/10 transition-colors">
                        <div className="h-10 w-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <Target className="text-purple-600 h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black">Weightage Focused</h3>
                            <p className="text-xs font-medium text-muted-foreground mt-1">
                                AI analyzes the syllabus to prioritize hard-level questions from high-weightage chapters.
                            </p>
                        </div>
                    </div>
                </div>

                <Card className="border-none shadow-xl bg-card rounded-3xl overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-3 text-center">
                            <p className="font-black text-[10px] uppercase tracking-[0.2em] text-primary">Enter Target Examination</p>
                            <Input
                                placeholder="e.g. UPSC, GATE 2024, JEE Main, NEET"
                                value={examName}
                                onChange={(e) => setExamName(e.target.value)}
                                className="h-12 text-base font-bold text-center rounded-xl border-2 focus:ring-4 transition-all"
                            />

                            <p className="font-black text-[10px] uppercase tracking-[0.2em] text-primary mt-4">Preferred Language</p>
                                <select
                                    className="w-full h-12 text-base font-bold text-center rounded-xl border-2 border-input bg-background focus:ring-4 focus:ring-primary/20 transition-all outline-none"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="English">English</option>
                                <option value="Hindi">Hindi (हिंदी)</option>
                                <option value="Marathi">Marathi (मराठी)</option>
                            </select>
                        </div>
                        <Button
                            onClick={handleStartTest}
                            className="w-full h-12 rounded-xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                            isLoading={isLoading}
                        >
                            <Play size={20} className="mr-2 fill-current" />
                            Initialize Simulation
                        </Button>
                    </CardContent>
                </Card>

                {/* History Section */}
                {history.length > 0 && (
                    <div className="mt-12 animate-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="text-primary" size={20} />
                            <h3 className="text-xl font-black">Simulation History</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {history.map((item) => (
                                <Card
                                    key={item.id}
                                    onClick={() => loadQuizResult(item.id, 'test_center')}
                                    className="border-border/50 bg-card/50 hover:bg-card hover:border-primary/50 transition-all cursor-pointer"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold truncate" title={item.topic}>{item.topic}</h4>
                                            {item.score != null ? (
                                                <span className={`text-xs font-black px-2 py-1 rounded-md ${item.score >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {Math.round(item.score as number)}%
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold px-2 py-1 bg-muted text-muted-foreground rounded-md">Incomplete</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 2. Results View
    const handleDownloadReview = () => {
        if (!results) return;

        const content = [
            `Test Center Result: ${results.topic}`,
            `Score: ${Math.round(results.score)}%`,
            `Status: ${results.score >= 50 ? 'PASSED' : 'FAILED'}`,
            `Date: ${new Date().toLocaleString()}`,
            `----------------------------------------`,
            `DETAILS`,
            ...results.detailed_results.map((r, i) => `
Item ${i + 1}: ${r.explanation}
Your Answer: ${r.user_answer}
Correct Answer: ${r.correct_answer}
Result: ${r.is_correct ? 'CORRECT' : 'INCORRECT'}
----------------------------------------`)
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${results.topic.replace(/\s+/g, '_')}_Result.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (results && quizSource === 'test_center') {
        const isSuccess = results.score >= 50;
        return (
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-black tracking-tight">{results.topic} Result</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                    <Card className={`lg:col-span-2 rounded-2xl shadow-lg border ${
                        isSuccess 
                            ? 'bg-emerald-500/10 border-emerald-500/25' 
                            : 'bg-red-500/10 border-red-500/25'
                    }`}>
                        <CardContent className="p-6 h-full flex flex-col justify-center">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <h2 className={`text-6xl font-black leading-none tracking-tighter tabular-nums ${
                                        isSuccess ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                        {Math.round(results.score)}<span className="text-3xl opacity-50">%</span>
                                    </h2>
                                    <div className="space-y-1">
                                        <p className={`text-lg font-black uppercase ${
                                            isSuccess ? 'text-emerald-300' : 'text-red-300'
                                        }`}>Simulation {isSuccess ? 'Passed' : 'Failed'}</p>
                                        <p className="font-medium text-sm max-w-sm text-slate-400">
                                            {isSuccess
                                                ? "You have demonstrated professional competency in this exam simulation."
                                                : "This was a high-difficulty simulation. Review the analysis below."}
                                        </p>
                                    </div>
                                    <EngagementButtons contentType="quiz" contentId={results.id} />
                                </div>
                                <div className={`h-16 w-16 rounded-xl flex items-center justify-center ${
                                    isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                    {isSuccess ? <Award size={32} /> : <AlertTriangle size={32} />}
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3">
                                <Button onClick={resetQuiz} className="gradient-primary text-white rounded-lg h-10 px-5 font-bold uppercase text-[10px] tracking-widest shadow-sm">
                                    New Simulation
                                </Button>
                                <Button onClick={handleDownloadReview} variant="outline" className="glass border-white/10 text-slate-300 hover:bg-white/8 rounded-lg h-10 px-5 font-bold uppercase text-[10px] tracking-widest">
                                    Download Review
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                        <div className="p-4 glass-card rounded-2xl border border-emerald-500/15 text-center flex flex-col items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-emerald-400 mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Accuracy</p>
                            <p className="text-2xl font-black text-white">{results.correct_answers}/{results.total_questions}</p>
                        </div>
                        <div className="p-4 glass-card rounded-2xl border border-blue-500/15 text-center flex flex-col items-center justify-center">
                            <Timer className="h-6 w-6 text-blue-400 mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Time Taken</p>
                            <p className="text-2xl font-black text-white">{formatTime(results.time_taken_seconds)}</p>
                        </div>
                    </div>
                </div>

                <KnowledgeGapAnalysis 
                    results={results.detailed_results} 
                />

                <div className="space-y-4 mt-8">
                    <h2 className="text-lg font-black uppercase tracking-tight px-2 flex items-center gap-2">
                        <Brain className="text-primary h-4 w-4" />
                        Detailed Analysis
                    </h2>
                    {results.detailed_results.map((result, idx) => (
                        <Card key={idx} className="border border-white/6 shadow-sm rounded-xl transition-shadow glass-card">
                            <CardContent className="p-4 flex items-start gap-4">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${result.is_correct ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                    {result.is_correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <ReadAloudButton text={result.explanation} className="text-[10px]" />
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                            result.is_correct 
                                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' 
                                                : 'bg-red-500/15 text-red-400 border border-red-500/25'
                                        }`}>
                                            {result.is_correct ? 'Verified' : 'Incorrect'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Item {idx + 1}</span>
                                    </div>
                                    <p className="text-sm font-semibold leading-relaxed text-slate-200">{result.explanation}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                        {/* Your Submission box */}
                                        <div className={`p-3 rounded-xl border ${
                                            result.is_correct 
                                                ? 'bg-emerald-500/8 border-emerald-500/20' 
                                                : 'bg-red-500/8 border-red-500/20'
                                        }`}>
                                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5">Your Submission</p>
                                            <p className={`font-bold text-sm ${
                                                result.is_correct ? 'text-emerald-400' : 'text-red-400'
                                            }`}>{result.user_answer || 'No answer'}</p>
                                        </div>
                                        {/* Official Solution box - always shown when wrong */}
                                        {!result.is_correct && (
                                            <div className="p-3 bg-emerald-500/8 rounded-xl border border-emerald-500/20">
                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5">Official Solution</p>
                                                <p className="font-bold text-sm text-emerald-400">{result.correct_answer}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // 3. Active Test View – only when this session is from Test Center
    if (activeQuiz && currentQ && quizSource === 'test_center') {
        const showCountdown = true;
        const timerValue = showCountdown && timeLeft !== null ? formatTime(timeLeft) : formatTime(elapsedSeconds);
        const timerLabel = showCountdown ? 'Time left' : 'Elapsed';

        return (
            <div className="max-w-7xl mx-auto px-4 animate-in fade-in duration-700">
                {/* Clean Sticky Header */}
                <div className="sticky top-16 md:top-20 z-40 bg-background/95 backdrop-blur pt-4 flex items-center justify-between mb-8 pb-4 border-b border-border/50">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-semibold tracking-widest text-indigo-400 uppercase">Test Center Simulation</p>
                        <h1 className="text-base font-bold text-white">{activeQuiz.topic}</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm transition-colors ${
                            showCountdown && timeLeft !== null && timeLeft < 300 
                                ? 'bg-red-500/15 border-red-500/30 text-red-400 animate-pulse' 
                                : 'glass border-white/10'
                        }`}>
                            <Timer className={`h-5 w-5 ${showCountdown && timeLeft !== null && timeLeft < 300 ? 'text-red-500' : 'text-primary'}`} aria-hidden />
                            <div className="text-right leading-none">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{timerLabel}</p>
                                <span className="font-black tabular-nums tracking-tight">{timerValue}</span>
                            </div>
                        </div>

                        <Button onClick={handleManualSubmit} variant="ghost" size="sm" className="rounded-lg font-bold uppercase text-[10px] glass border-white/10 hover:bg-red-500/15 hover:text-red-400 shrink-0 h-[42px] px-5">
                            Early Exit
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Question Card */}
                    <div className="lg:col-span-9 space-y-6 order-1">
                        <Card className="border-none shadow-xl bg-card rounded-[2rem] overflow-hidden min-h-[400px] flex flex-col">
                            <CardContent className="p-6 md:p-10 flex-1 space-y-6">
                                <div className="space-y-4">
                                    <p className="text-xl md:text-2xl font-bold leading-snug tracking-tight text-foreground/90">
                                        {currentQ.question_text || currentQ.question}
                                    </p>
                                    <ReadAloudButton
                                        text={(currentQ.question_text || currentQ.question) + '. Options: ' + currentQ.options.join(', ')}
                                    />
                                </div>

                                <div className="space-y-3">
                                    {currentQ.options.map((option, index) => {
                                        const hasPrefix = option.length > 3 && option.charAt(1) === ')';
                                        const optionLetter = hasPrefix ? option.charAt(0) : String.fromCharCode(65 + index);
                                        const optionText = hasPrefix ? option.substring(3) : option;
                                        const isSelected = selectedAnswer === optionLetter;

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => submitAnswer(currentQ.question_id, optionLetter)}
                                                className={`w-full group relative text-left p-4 rounded-xl border transition-all duration-200 ${isSelected
                                                    ? 'border-primary bg-primary/5 shadow-inner'
                                                    : 'border-transparent bg-muted/30 hover:bg-muted/60'
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-4 font-bold text-sm transition-colors ${isSelected
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-background text-muted-foreground group-hover:bg-background/80'
                                                        }`}>
                                                        {optionLetter}
                                                    </div>
                                                    <span className={`font-medium ${isSelected ? 'text-foreground font-semibold' : 'text-foreground/80'}`}>
                                                        {optionText}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                            
                            {/* Card Footer Navigation */}
                            <div className="p-4 bg-muted/20 border-t border-border/50 flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={previousQuestion}
                                    disabled={currentQuestion === 0}
                                    className="font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                                >
                                    Previous
                                </Button>
                                {currentQuestion === activeQuiz.questions.length - 1 ? (
                                    <Button
                                        onClick={() => setShowSubmitModal(true)}
                                        className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        Submit Exam
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={nextQuestion}
                                        className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest bg-foreground text-background hover:bg-foreground/90"
                                    >
                                        Next
                                        <ArrowRight size={14} className="ml-2" />
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Progress Sidebar */}
                    <div className="hidden lg:block lg:col-span-3 space-y-4 order-2">
                        <Card className="rounded-2xl border-none shadow-sm bg-card/50 p-4">
                            <h4 className="font-bold uppercase text-[10px] mb-3 text-center text-muted-foreground">Navigator</h4>
                            <div className="grid grid-cols-5 gap-2">
                                {activeQuiz.questions.map((q, idx) => (
                                    <button
                                        key={q.question_id}
                                        onClick={() => useQuizStore.getState().goToQuestion(idx)}
                                        className={`h-8 w-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                                            idx === currentQuestion
                                                ? 'bg-primary text-primary-foreground shadow-md scale-110'
                                                : answers[q.question_id]
                                                    ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400'
                                                    : visitedQuestions.has(idx)
                                                        ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400'
                                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Submit Confirmation Modal */}
                {showSubmitModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-card border border-border/50 shadow-2xl rounded-3xl max-w-sm w-full p-6 animate-in zoom-in-95">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-black text-center mb-2">Submit Simulation?</h3>
                            <p className="text-sm text-center text-muted-foreground font-medium mb-6">
                                Are you sure you want to submit your exam now? You will not be able to change your answers after submission.
                            </p>
                            <div className="flex gap-3">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] h-12"
                                    onClick={() => setShowSubmitModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] h-12"
                                    isLoading={isSubmitting}
                                    disabled={isSubmitting}
                                    onClick={async () => {
                                        setIsSubmitting(true);
                                        try {
                                            await submitQuiz();
                                        } finally {
                                            setIsSubmitting(false);
                                            setShowSubmitModal(false);
                                        }
                                    }}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Fallback: render config form — this handles cases where activeQuiz belongs
    // to a different source (e.g. QuizPage) or state is in an unexpected shape.
    return (
        <div className="max-w-3xl mx-auto px-4 animate-in fade-in duration-700">
            <div className="text-center mb-8 space-y-4">
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3 shadow-inner">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-xl font-bold text-white uppercase tracking-wide mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Exam Test Center</h1>
                <p className="text-muted-foreground font-medium max-w-lg mx-auto text-base">
                    20-question exam simulations with timer. Starts in under 10 seconds.
                </p>
            </div>
            <Card className="border-none shadow-xl bg-card rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-3 text-center">
                        <p className="font-black text-[10px] uppercase tracking-[0.2em] text-primary">Enter Target Examination</p>
                        <Input
                            placeholder="e.g. UPSC, GATE 2024, JEE Main, NEET"
                            value={examName}
                            onChange={(e) => setExamName(e.target.value)}
                            className="h-12 text-base font-bold text-center rounded-xl border-2 focus:ring-4 transition-all"
                        />
                    </div>
                    <Button
                        onClick={handleStartTest}
                        className="w-full h-12 rounded-xl text-base font-black uppercase tracking-widest"
                        isLoading={isLoading}
                    >
                        <Play size={20} className="mr-2 fill-current" />
                        Initialize Simulation
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
