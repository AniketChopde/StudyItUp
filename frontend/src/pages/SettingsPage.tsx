import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { GraduationCap, User, BookOpen, Brain, Save, Briefcase, Clock, Activity } from 'lucide-react';

export const SettingsPage: React.FC = () => {
    const { user, updateProfile, isLoading } = useAuthStore();
    
    const [formData, setFormData] = useState({
        full_name: '',
        education_level: '',
        major: '',
        learning_style: '',
        goals: '',
        occupation: '',
        preferred_study_time: '',
        learning_pace: '',
        target_skills: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                education_level: user.profile_data?.education_level || '',
                major: user.profile_data?.major || '',
                learning_style: user.profile_data?.learning_style || '',
                goals: user.profile_data?.goals || '',
                occupation: user.profile_data?.occupation || '',
                preferred_study_time: user.profile_data?.preferred_study_time || '',
                learning_pace: user.profile_data?.learning_pace || '',
                target_skills: user.profile_data?.target_skills || ''
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateProfile({
            full_name: formData.full_name,
            profile_data: {
                education_level: formData.education_level,
                major: formData.major,
                learning_style: formData.learning_style,
                goals: formData.goals,
                occupation: formData.occupation,
                preferred_study_time: formData.preferred_study_time,
                learning_pace: formData.learning_pace,
                target_skills: formData.target_skills
            }
        });
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 rounded-2xl border border-primary/20 shadow-sm">
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg ring-4 ring-background">
                    {getInitials(user?.full_name || user?.email || '')}
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Profile</h1>
                    <p className="text-muted-foreground mt-1 font-medium">
                        Customize your profile to help our AI generate perfectly tailored study plans.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="border-2 border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Personal Details
                        </CardTitle>
                        <CardDescription>Your basic account information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Email Address (Read-only)</label>
                                <input 
                                    type="email" 
                                    value={user?.email || ''} 
                                    disabled 
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Full Name</label>
                                <input 
                                    type="text" 
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium transition-all"
                                    placeholder="e.g. Jane Doe"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            Educational Background
                        </CardTitle>
                        <CardDescription>Tell the AI about your current education level so it can calibrate the difficulty of your plans.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Education Level</label>
                                <select 
                                    name="education_level"
                                    value={formData.education_level}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium bg-white"
                                >
                                    <option value="">Select Level...</option>
                                    <option value="High School">High School</option>
                                    <option value="Undergraduate">Undergraduate (College/University)</option>
                                    <option value="Graduate">Graduate (Master's/PhD)</option>
                                    <option value="Professional">Professional / Working Adult</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Major / Field of Study</label>
                                <input 
                                    type="text" 
                                    name="major"
                                    value={formData.major}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
                                    placeholder="e.g. Computer Science, Mechanical Engineering"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-primary" />
                            Professional & Schedule
                        </CardTitle>
                        <CardDescription>Tell the AI about your work and availability so it can schedule realistically.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Current Occupation / Role</label>
                                <input 
                                    type="text" 
                                    name="occupation"
                                    value={formData.occupation}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium transition-all"
                                    placeholder="e.g. Software Engineer, Medical Student, Unemployed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Preferred Study Time</label>
                                <select 
                                    name="preferred_study_time"
                                    value={formData.preferred_study_time}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium bg-white"
                                >
                                    <option value="">Select Time...</option>
                                    <option value="Morning">Morning (5AM - 11AM)</option>
                                    <option value="Afternoon">Afternoon (11AM - 5PM)</option>
                                    <option value="Evening">Evening (5PM - 9PM)</option>
                                    <option value="Night">Night Owl (9PM onwards)</option>
                                    <option value="Weekends">Weekends Only</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" />
                            Learning Preferences
                        </CardTitle>
                        <CardDescription>How do you prefer to learn?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Preferred Learning Style</label>
                            <select 
                                name="learning_style"
                                value={formData.learning_style}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium bg-white"
                            >
                                <option value="">Select Style...</option>
                                <option value="Visual">Visual (Diagrams, Videos, Charts)</option>
                                <option value="Auditory">Auditory (Lectures, Discussions)</option>
                                <option value="Reading/Writing">Reading/Writing (Textbooks, Notes, Essays)</option>
                                <option value="Kinesthetic">Kinesthetic (Hands-on, Practice, Labs)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Learning Pace</label>
                            <select 
                                name="learning_pace"
                                value={formData.learning_pace}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium bg-white"
                            >
                                <option value="">Select Pace...</option>
                                <option value="Relaxed">Relaxed (I want to take my time)</option>
                                <option value="Moderate">Moderate (Standard pacing)</option>
                                <option value="Intensive">Intensive (Bootcamp style, fast-paced)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Target Skills / Interests</label>
                            <input 
                                type="text" 
                                name="target_skills"
                                value={formData.target_skills}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium transition-all"
                                placeholder="e.g. Python, UI Design, Data Science, Public Speaking"
                            />
                            <p className="text-xs text-slate-500 font-medium">Comma-separated skills you wish to acquire.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Primary Learning Goals</label>
                            <textarea 
                                name="goals"
                                value={formData.goals}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium resize-none"
                                placeholder="What are you trying to achieve? (e.g. I want to transition into software engineering, or I am preparing for medical school entrance exams)."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button 
                        type="submit" 
                        size="lg" 
                        disabled={isLoading}
                        className="rounded-xl px-8 font-black tracking-wider uppercase shadow-xl shadow-primary/20 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Saving...</span>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Save Profile
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};
