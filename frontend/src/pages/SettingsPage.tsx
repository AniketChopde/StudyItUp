import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { GraduationCap, User, Brain, Save, Briefcase } from 'lucide-react';

// Shared input/select/textarea class for dark mode
const fieldClass =
    'w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all';

const labelClass = 'text-xs font-semibold text-slate-400 tracking-wide uppercase';

const selectClass =
    'w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0d1122] text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer';

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
            <div className="flex items-center gap-5 p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/8 to-blue-500/8 rounded-2xl border border-indigo-500/20">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-bold shadow-lg ring-4 ring-white/5 flex-shrink-0">
                    {getInitials(user?.full_name || user?.email || '')}
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Profile</h1>
                    <p className="text-slate-400 mt-0.5 text-xs leading-relaxed">
                        Customize your profile to help our AI generate perfectly tailored study plans.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Details */}
                <Card className="glass-card border border-white/8 shadow-lg">
                    <CardHeader className="border-b border-white/6 pb-4">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <div className="p-1.5 bg-indigo-500/15 rounded-lg">
                                <User className="h-4 w-4 text-indigo-400" />
                            </div>
                            Personal Details
                        </CardTitle>
                        <CardDescription className="text-slate-400">Your basic account information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={labelClass}>Email Address (Read-only)</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-2.5 rounded-xl border border-white/6 bg-white/3 text-slate-500 font-medium cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Full Name</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className={fieldClass}
                                    placeholder="e.g. Jane Doe"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Educational Background */}
                <Card className="glass-card border border-white/8 shadow-lg">
                    <CardHeader className="border-b border-white/6 pb-4">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <div className="p-1.5 bg-indigo-500/15 rounded-lg">
                                <GraduationCap className="h-4 w-4 text-indigo-400" />
                            </div>
                            Educational Background
                        </CardTitle>
                        <CardDescription className="text-slate-400">Tell the AI about your current education level so it can calibrate the difficulty of your plans.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={labelClass}>Education Level</label>
                                <div className="relative">
                                    <select
                                        name="education_level"
                                        value={formData.education_level}
                                        onChange={handleChange}
                                        className={selectClass}
                                    >
                                        <option value="" className="bg-[#0d1122] text-slate-400">Select Level...</option>
                                        <option value="High School" className="bg-[#0d1122] text-slate-200">High School</option>
                                        <option value="Undergraduate" className="bg-[#0d1122] text-slate-200">Undergraduate (College/University)</option>
                                        <option value="Graduate" className="bg-[#0d1122] text-slate-200">Graduate (Master's/PhD)</option>
                                        <option value="Professional" className="bg-[#0d1122] text-slate-200">Professional / Working Adult</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Major / Field of Study</label>
                                <input
                                    type="text"
                                    name="major"
                                    value={formData.major}
                                    onChange={handleChange}
                                    className={fieldClass}
                                    placeholder="e.g. Computer Science, Mechanical Engineering"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Professional & Schedule */}
                <Card className="glass-card border border-white/8 shadow-lg">
                    <CardHeader className="border-b border-white/6 pb-4">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <div className="p-1.5 bg-indigo-500/15 rounded-lg">
                                <Briefcase className="h-4 w-4 text-indigo-400" />
                            </div>
                            Professional &amp; Schedule
                        </CardTitle>
                        <CardDescription className="text-slate-400">Tell the AI about your work and availability so it can schedule realistically.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={labelClass}>Current Occupation / Role</label>
                                <input
                                    type="text"
                                    name="occupation"
                                    value={formData.occupation}
                                    onChange={handleChange}
                                    className={fieldClass}
                                    placeholder="e.g. Software Engineer, Medical Student, Unemployed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClass}>Preferred Study Time</label>
                                <div className="relative">
                                    <select
                                        name="preferred_study_time"
                                        value={formData.preferred_study_time}
                                        onChange={handleChange}
                                        className={selectClass}
                                    >
                                        <option value="" className="bg-[#0d1122] text-slate-400">Select Time...</option>
                                        <option value="Morning" className="bg-[#0d1122] text-slate-200">Morning (5AM - 11AM)</option>
                                        <option value="Afternoon" className="bg-[#0d1122] text-slate-200">Afternoon (11AM - 5PM)</option>
                                        <option value="Evening" className="bg-[#0d1122] text-slate-200">Evening (5PM - 9PM)</option>
                                        <option value="Night" className="bg-[#0d1122] text-slate-200">Night Owl (9PM onwards)</option>
                                        <option value="Weekends" className="bg-[#0d1122] text-slate-200">Weekends Only</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Learning Preferences */}
                <Card className="glass-card border border-white/8 shadow-lg">
                    <CardHeader className="border-b border-white/6 pb-4">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <div className="p-1.5 bg-indigo-500/15 rounded-lg">
                                <Brain className="h-4 w-4 text-indigo-400" />
                            </div>
                            Learning Preferences
                        </CardTitle>
                        <CardDescription className="text-slate-400">How do you prefer to learn?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-5">
                        <div className="space-y-2">
                            <label className={labelClass}>Preferred Learning Style</label>
                            <div className="relative">
                                <select
                                    name="learning_style"
                                    value={formData.learning_style}
                                    onChange={handleChange}
                                    className={selectClass}
                                >
                                    <option value="" className="bg-[#0d1122] text-slate-400">Select Style...</option>
                                    <option value="Visual" className="bg-[#0d1122] text-slate-200">Visual (Diagrams, Videos, Charts)</option>
                                    <option value="Auditory" className="bg-[#0d1122] text-slate-200">Auditory (Lectures, Discussions)</option>
                                    <option value="Reading/Writing" className="bg-[#0d1122] text-slate-200">Reading/Writing (Textbooks, Notes, Essays)</option>
                                    <option value="Kinesthetic" className="bg-[#0d1122] text-slate-200">Kinesthetic (Hands-on, Practice, Labs)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={labelClass}>Learning Pace</label>
                            <div className="relative">
                                <select
                                    name="learning_pace"
                                    value={formData.learning_pace}
                                    onChange={handleChange}
                                    className={selectClass}
                                >
                                    <option value="" className="bg-[#0d1122] text-slate-400">Select Pace...</option>
                                    <option value="Relaxed" className="bg-[#0d1122] text-slate-200">Relaxed (I want to take my time)</option>
                                    <option value="Moderate" className="bg-[#0d1122] text-slate-200">Moderate (Standard pacing)</option>
                                    <option value="Intensive" className="bg-[#0d1122] text-slate-200">Intensive (Bootcamp style, fast-paced)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={labelClass}>Target Skills / Interests</label>
                            <input
                                type="text"
                                name="target_skills"
                                value={formData.target_skills}
                                onChange={handleChange}
                                className={fieldClass}
                                placeholder="e.g. Python, UI Design, Data Science, Public Speaking"
                            />
                            <p className="text-xs text-slate-500 font-medium">Comma-separated skills you wish to acquire.</p>
                        </div>

                        <div className="space-y-2">
                            <label className={labelClass}>Primary Learning Goals</label>
                            <textarea
                                name="goals"
                                value={formData.goals}
                                onChange={handleChange}
                                rows={3}
                                className={`${fieldClass} resize-none`}
                                placeholder="What are you trying to achieve? (e.g. I want to transition into software engineering, or I am preparing for medical school entrance exams)."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pb-4">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={isLoading}
                        className="px-8 font-semibold tracking-wide shadow-xl"
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Saving...</span>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Profile
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};
