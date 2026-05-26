import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
    Home,
    BookOpen,
    MessageSquare,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    ShieldAlert,
    Brain,
    BarChart,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    ChevronRight
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-blue-400' },
    { name: 'Study Plans', href: '/study-plans', icon: BookOpen, color: 'text-emerald-400' },
    { name: 'Learning Chat', href: '/chat', icon: MessageSquare, color: 'text-violet-400' },
    { name: 'Take Quiz', href: '/quiz', icon: Brain, color: 'text-amber-400' },
    { name: 'View Analytics', href: '/analytics', icon: BarChart, color: 'text-cyan-400' },
    { name: 'Test Center', href: '/test-center', icon: ShieldCheck, color: 'text-indigo-400' },
    { name: 'Settings', href: '/settings', icon: Settings, color: 'text-slate-400' },
];

const adminNavigation = [
    { name: 'Admin Panel', href: '/admin', icon: ShieldAlert, color: 'text-purple-400' },
];

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [isCollapsed, setIsCollapsed] = React.useState(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        return saved === 'true';
    });
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    React.useEffect(() => {
        localStorage.setItem('sidebar_collapsed', String(isCollapsed));
    }, [isCollapsed]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className={`flex items-center h-16 px-4 border-b border-white/5 ${isCollapsed && !onClose ? 'justify-center' : 'gap-3'}`}>
                {(!isCollapsed || onClose) && (
                    <>
                        <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-md" />
                            <img src="/logo.png" alt="StudyItUp" className="relative h-9 w-9 rounded-xl" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-base font-bold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>StudyItUp</h1>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Learning Platform</p>
                        </div>
                        {!onClose && (
                            <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors">
                                <PanelLeftClose className="h-4 w-4" />
                            </button>
                        )}
                        {onClose && (
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors ml-auto">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </>
                )}
                {isCollapsed && !onClose && (
                    <button
                        onClick={toggleSidebar}
                        className="group flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/5 transition-colors"
                        title="Expand sidebar"
                    >
                        <div className="group-hover:opacity-0 transition-opacity absolute">
                            <img src="/logo.png" alt="StudyItUp" className="h-7 w-7 rounded-lg" />
                        </div>
                        <PanelLeftOpen className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
                {navigation.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            title={isCollapsed && !onClose ? item.name : undefined}
                            onClick={onClose}
                            className={`group flex items-center rounded-xl transition-all duration-200 ${
                                isCollapsed && !onClose
                                    ? 'justify-center p-2.5 mx-auto w-10 h-10'
                                    : 'gap-3 px-3 py-2.5'
                            } ${
                                isActive
                                    ? 'nav-pill-active'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                            <item.icon className={`flex-shrink-0 transition-colors ${isCollapsed && !onClose ? 'h-5 w-5' : 'h-4 w-4'} ${isActive ? 'text-indigo-400' : `${item.color} group-hover:text-slate-200`}`} />
                            {(!isCollapsed || onClose) && (
                                <>
                                    <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />}
                                </>
                            )}
                        </Link>
                    );
                })}

                {user?.is_superuser && (
                    <>
                        <div className="border-t border-white/5 my-2" />
                        {adminNavigation.map((item) => {
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    title={isCollapsed && !onClose ? item.name : undefined}
                                    onClick={onClose}
                                    className={`group flex items-center rounded-xl transition-all duration-200 ${
                                        isCollapsed && !onClose
                                            ? 'justify-center p-2.5 mx-auto w-10 h-10'
                                            : 'gap-3 px-3 py-2.5'
                                    } ${
                                        isActive
                                            ? 'bg-purple-500/15 border border-purple-500/25 text-purple-300'
                                            : 'text-purple-400/70 hover:text-purple-300 hover:bg-purple-500/10'
                                    }`}
                                >
                                    <item.icon className={`flex-shrink-0 ${isCollapsed && !onClose ? 'h-5 w-5' : 'h-4 w-4'}`} />
                                    {(!isCollapsed || onClose) && (
                                        <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                                    )}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* User + Logout */}
            <div className="p-3 border-t border-white/5">
                {(!isCollapsed || onClose) ? (
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group">
                        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-200 truncate">{user?.full_name || 'Student'}</p>
                            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex overflow-x-hidden">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 w-64 glass-card border-r border-white/5 flex flex-col">
                        <SidebarContent onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <aside
                className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 glass-card border-r border-white/5 transition-all duration-300 ease-in-out ${
                    isCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
                }`}
            >
                <SidebarContent />
            </aside>

            {/* Main content area */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'}`}>
                {/* Top bar */}
                <header className="sticky top-0 z-40 flex h-14 items-center gap-4 px-4 lg:px-6 glass border-b border-white/5">
                    <button
                        className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open sidebar"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Page title breadcrumb */}
                    <div className="flex-1">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                            {navigation.find(n => location.pathname.startsWith(n.href))?.name || 'NexusLearn'}
                        </p>
                    </div>

                    {/* User avatar */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end">
                            <p className="text-sm font-semibold text-slate-200 leading-none">{user?.full_name || user?.email}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{user?.email}</p>
                        </div>
                        <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm ring-2 ring-indigo-500/20">
                            {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className={`flex-1 ${
                    location.pathname.startsWith('/chat') 
                        ? 'overflow-hidden' 
                        : 'px-5 py-6 pb-10 lg:px-8 lg:py-7 lg:pb-12'
                }`}>
                    <div className={location.pathname.startsWith('/chat') ? 'h-full' : 'max-w-7xl mx-auto'}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
