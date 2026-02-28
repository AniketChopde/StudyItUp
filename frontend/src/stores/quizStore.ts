import { create } from 'zustand';
import { quizService } from '../api/services';
import type { Quiz, QuizResult, QuizHistoryItem } from '../types';
import toast from 'react-hot-toast';
import { useGamificationStore } from './gamificationStore';

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120000; // 2 minutes

let pollIntervalId: ReturnType<typeof setInterval> | null = null;

export type QuizSource = 'test_center' | 'quiz' | null;

interface QuizState {
    activeQuiz: Quiz | null;
    currentQuestion: number;
    answers: Record<string, string>;
    results: QuizResult | null;
    quizHistory: QuizHistoryItem[];
    isLoading: boolean;
    timeStarted: number | null;
    /** Set while Test Center is generating questions (polling). */
    pendingSessionId: string | null;
    /** Origin of current session/results so Quiz page and Test Center each show only their own. */
    quizSource: QuizSource;

    // Actions
    generateQuiz: (topic: string, subject: string, count?: number, difficulty?: string, examType?: string | null, planId?: string | null) => Promise<void>;
    submitAnswer: (questionId: string, answer: string) => void;
    submitQuiz: () => Promise<void>;
    nextQuestion: () => void;
    previousQuestion: () => void;
    goToQuestion: (index: number) => void;
    fetchHistory: () => Promise<void>;
    resetQuiz: () => void;
    startTestCenter: (examName: string, planId?: string, language?: string) => Promise<void>;
    generateChapterQuiz: (chapterId: string) => Promise<void>;
    loadQuizResult: (id: string) => Promise<void>;
}

export const useQuizStore = create<QuizState>((set, get) => ({
    activeQuiz: null,
    currentQuestion: 0,
    answers: {},
    results: null,
    quizHistory: [],
    isLoading: false,
    timeStarted: null,
    pendingSessionId: null,
    quizSource: null as QuizSource,

    generateChapterQuiz: async (chapterId) => {
        try {
            set({ isLoading: true });
            const response = await quizService.generateChapterQuiz(chapterId);

            set({
                activeQuiz: response.data,
                currentQuestion: 0,
                answers: {},
                results: null,
                timeStarted: Date.now(),
                isLoading: false,
                quizSource: 'quiz',
            });

            toast.success('Chapter quiz generated with PYQs!');
        } catch (error) {
            set({ isLoading: false });
            toast.error('Failed to generate chapter quiz');
            throw error;
        }
    },

    loadQuizResult: async (id) => {
        try {
            set({ isLoading: true });
            const response = await quizService.getResult(id);
            set({
                results: response.data,
                activeQuiz: null, // Ensure we are not in "taking quiz" mode
                isLoading: false,
                quizSource: 'quiz',
            });
        } catch (error) {
            set({ isLoading: false });
            toast.error('Failed to load quiz result');
            throw error;
        }
    },
    startTestCenter: async (examName, planId, language) => {
        try {
            set({ isLoading: true });
            const response = await quizService.startTestCenter(examName, planId, language);
            const data = response.data;
            const isPending = data.status === 'pending' && (!data.questions || data.questions.length === 0);

            if (isPending && data.id) {
                set({
                    isLoading: false,
                    pendingSessionId: data.id,
                });
                const sessionId = data.id;
                const startedAt = Date.now();

                const poll = async () => {
                    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
                        if (pollIntervalId != null) clearInterval(pollIntervalId);
                        pollIntervalId = null;
                        set({ pendingSessionId: null });
                        toast.error('Test preparation is taking longer than usual. Please try again.');
                        return;
                    }
                    try {
                        const statusRes = await quizService.getTestCenterStatus(sessionId);
                        const session = statusRes.data;
                        const ready = session.status !== 'pending' && session.questions && session.questions.length > 0;
                        if (ready) {
                            if (pollIntervalId != null) clearInterval(pollIntervalId);
                            pollIntervalId = null;
                            set({
                                activeQuiz: session,
                                currentQuestion: 0,
                                answers: {},
                                results: null,
                                timeStarted: Date.now(),
                                pendingSessionId: null,
                                quizSource: 'test_center',
                            });
                            toast.success(`Exam simulation for ${examName} started!`);
                        }
                    } catch {
                        // Transient error; next poll will retry
                    }
                };

                await poll();
                pollIntervalId = setInterval(poll, POLL_INTERVAL_MS);
            } else {
                set({
                    activeQuiz: data,
                    currentQuestion: 0,
                    answers: {},
                    results: null,
                    timeStarted: Date.now(),
                    isLoading: false,
                    quizSource: 'test_center',
                });
                toast.success(`Exam simulation for ${examName} started!`);
            }
        } catch (error) {
            set({ isLoading: false, pendingSessionId: null });
            toast.error('Failed to start test center');
            throw error;
        }
    },

    generateQuiz: async (topic, subject, count = 10, difficulty = 'medium', examType = null, planId = null) => {
        try {
            set({ isLoading: true });
            const response = await quizService.generate(topic, subject, count, difficulty, examType, planId);

            set({
                activeQuiz: response.data,
                currentQuestion: 0,
                answers: {},
                results: null,
                timeStarted: Date.now(),
                isLoading: false,
                quizSource: 'quiz',
            });

            toast.success('Quiz generated successfully!');
        } catch (error) {
            set({ isLoading: false });
            toast.error('Failed to generate quiz');
            throw error;
        }
    },

    submitAnswer: (questionId, answer) => {
        set((state) => ({
            answers: {
                ...state.answers,
                [questionId]: answer,
            },
        }));
    },

    submitQuiz: async () => {
        try {
            const { activeQuiz, answers, timeStarted } = get();

            if (!activeQuiz || !timeStarted) {
                toast.error('No active quiz');
                return;
            }

            const timeTaken = (Date.now() - timeStarted) / 1000; // in seconds

            set({ isLoading: true });

            const response = await quizService.submit({
                quiz_id: activeQuiz.id,
                answers,
                time_taken_seconds: timeTaken,
            });

            set({
                results: response.data,
                isLoading: false,
            });

            // Refresh gamification profile to show XPToast/BadgeModal
            useGamificationStore.getState().fetchProfile();

            toast.success('Quiz submitted successfully!');
        } catch (error) {
            set({ isLoading: false });
            toast.error('Failed to submit quiz');
            throw error;
        }
    },

    nextQuestion: () => {
        set((state) => {
            const maxQuestion = (state.activeQuiz?.questions.length || 1) - 1;
            return {
                currentQuestion: Math.min(state.currentQuestion + 1, maxQuestion),
            };
        });
    },

    previousQuestion: () => {
        set((state) => ({
            currentQuestion: Math.max(state.currentQuestion - 1, 0),
        }));
    },

    goToQuestion: (index) => {
        set({ currentQuestion: index });
    },

    fetchHistory: async () => {
        try {
            const response = await quizService.getHistory();
            set({ quizHistory: response.data });
        } catch (error) {
            toast.error('Failed to fetch quiz history');
            throw error;
        }
    },

    // Clears only the current in-progress quiz so a new one can be started. Does NOT remove or clear
    // quiz history: completed quizzes remain stored on the backend and in quizHistory when fetched.
    resetQuiz: () => {
        if (pollIntervalId != null) {
            clearInterval(pollIntervalId);
            pollIntervalId = null;
        }
        set({
            activeQuiz: null,
            currentQuestion: 0,
            answers: {},
            results: null,
            timeStarted: null,
            pendingSessionId: null,
            quizSource: null,
        });
    },
}));
