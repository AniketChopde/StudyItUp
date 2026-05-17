import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStudyPlanStore } from '../stores/studyPlanStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Target, Calendar, Clock, Sparkles, AlertTriangle } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

const createPlanSchema = z.object({
    exam_type: z.string().min(2, 'Learning goal or topic is required'),
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

export const CreateStudyPlanPage: React.FC = () => {
    const navigate = useNavigate();
    const { createPlan } = useStudyPlanStore();
    const [showHoursWarning, setShowHoursWarning] = useState(false);
    const [pendingData, setPendingData] = useState<CreatePlanFormData | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<CreatePlanFormData>({
        resolver: zodResolver(createPlanSchema),
        defaultValues: {
            start_date: today,
            daily_hours: 4,
            fast_learn: false,
            language: 'English',
        }
    });

    const isFastLearn = watch('fast_learn');

    // Use isCreating for the local state of this operation
    const isCreatingLocal = useStudyPlanStore(state => state.isCreating);

    const onSubmit = async (data: CreatePlanFormData) => {
        if (data.daily_hours > 8 && !pendingData) {
            setPendingData(data);
            setShowHoursWarning(true);
            return;
        }
        
        try {
            const response = await createPlan({
                ...data,
                current_knowledge: {},
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

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Create Study Plan</h1>
                    <p className="text-muted-foreground">Our AI will generate a personalized learning path for you</p>
                </div>
            </div>

            <Card className="border-2 border-primary/20 shadow-xl relative">
                <CardHeader>
                    <CardTitle>Plan Details</CardTitle>
                    <CardDescription>Tell us about your goal and schedule</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                label="What do you want to learn?"
                                placeholder="e.g. Machine Learning, LangChain, UPSC, GATE CS, React"
                                icon={<Target className="h-4 w-4" />}
                                error={errors.exam_type?.message}
                                {...register('exam_type')}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium leading-none">
                                        Preferred Language
                                    </label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        {...register('language')}
                                    >
                                        <option value="English">English</option>
                                        <option value="Hindi">Hindi (हिंदी)</option>
                                        <option value="Marathi">Marathi (मराठी)</option>
                                    </select>
                                </div>

                                <Input
                                    label="Daily study hours"
                                    type="number"
                                    min="1"
                                    max="24"
                                    icon={<Clock className="h-4 w-4" />}
                                    error={errors.daily_hours?.message}
                                    {...register('daily_hours', { valueAsNumber: true })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Start Date"
                                    type="date"
                                    min={today}
                                    icon={<Calendar className="h-4 w-4" />}
                                    error={errors.start_date?.message}
                                    {...register('start_date')}
                                />
                                <Input
                                    label="Target completion date"
                                    type="date"
                                    min={watch('start_date') || today}
                                    icon={<Calendar className="h-4 w-4" />}
                                    error={errors.target_date?.message}
                                    {...register('target_date')}
                                />
                            </div>

                            <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isFastLearn ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20' : 'border-border bg-card hover:bg-muted/50'}`}>
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
                                            <span className="font-black text-sm uppercase tracking-tight">Fast Learn Mode 🚀</span>
                                            {isFastLearn && <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase">Enabled</span>}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium mt-1">
                                            Focus on core and foundational topics first. Skip optional or advanced content to cover essentials in less time.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm">
                                <Sparkles className="h-4 w-4 text-primary" />
                                {isFastLearn ? 'Fast Learn Optimization' : 'AI Engine Features'}
                            </h4>
                            <ul className="text-[11px] space-y-1 text-muted-foreground font-medium">
                                {isFastLearn ? (
                                    <>
                                        <li>• Core-first topic prioritization</li>
                                        <li>• Compressed timeline for quick coverage</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• Personalized topic breakdown and learning path</li>
                                        <li>• Smart resource discovery (videos, notes, articles)</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg font-bold" isLoading={isCreatingLocal}>
                            {isFastLearn ? 'Generate Fast Plan ⚡' : 'Generate My Plan 🚀'}
                        </Button>
                    </form>
                </CardContent>

                {/* Hours Warning Modal */}
                {showHoursWarning && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm rounded-3xl animate-in fade-in duration-300">
                        <div className="bg-card border-2 border-primary/20 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center space-y-6">
                            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                                <AlertTriangle size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black">Intensive Schedule!</h3>
                                <p className="text-sm text-muted-foreground font-medium">
                                    You've selected <span className="text-primary font-bold">{pendingData?.daily_hours} hours</span> per day. This is a very intense commitment. Are you sure you can maintain this pace?
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button onClick={confirmHighHours} className="w-full h-12 font-black uppercase tracking-widest">
                                    Yes, I'm Committed 🚀
                                </Button>
                                <Button variant="outline" onClick={() => {setShowHoursWarning(false); setPendingData(null);}} className="w-full h-12 font-black uppercase tracking-widest border-slate-200">
                                    Let Me Reconsider
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};
