import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
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
    Box,
    Video,
    PanelLeftClose,
    PanelLeftOpen,
    Settings
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Study Plans', href: '/study-plans', icon: BookOpen },
    { name: 'Learning Chat', href: '/chat', icon: MessageSquare },
    { name: 'Take Quiz', href: '/quiz', icon: Brain },
    { name: 'View Analytics', href: '/analytics', icon: BarChart },
    { name: '3D Visualize', href: '/visualize', icon: Box },
    { name: 'My Animations', href: '/my-animations', icon: Video },
    { name: 'Test Center', href: '/test-center', icon: ShieldCheck },
    { name: 'Settings', href: '/settings', icon: Settings },
];

const adminNavigation = [
    { name: 'Admin Panel', href: '/admin', icon: ShieldAlert },
];

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [isCollapsed, setIsCollapsed] = React.useState(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        return saved === 'true';
    });
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isHidden] = React.useState(false);

    React.useEffect(() => {
        localStorage.setItem('sidebar_collapsed', String(isCollapsed));
    }, [isCollapsed]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <div className="fixed inset-y-0 left-0 w-64 bg-card border-r flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-2">
                                <img src="/logo.png" alt="StudyItUp" className="h-10 w-10 mix-blend-multiply" />
                                <h1 className="text-xl font-bold">StudyItUp</h1>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                                        location.pathname.startsWith(item.href) 
                                        ? 'bg-primary/10 text-primary font-medium' 
                                        : 'hover:bg-accent text-foreground'
                                    }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </Link>
                            ))}

                            {user?.is_superuser && (
                                <>
                                    <div className="border-t my-2 border-border/50" />
                                    {adminNavigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium ${
                                                location.pathname.startsWith(item.href)
                                                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                                : 'text-purple-600 dark:text-purple-400 hover:bg-accent'
                                            }`}
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            <span>{item.name}</span>
                                        </Link>
                                    ))}
                                </>
                            )}
                        </nav>
                        <div className="p-4 border-t">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-5 w-5 mr-3" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            {!isHidden && (
                <aside 
                    className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 border-r bg-card transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
                >
                <div 
                    className={`group relative flex items-center h-16 px-4 border-b overflow-hidden transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                >
                    {isCollapsed ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <div className="group-hover:opacity-0 transition-opacity duration-300 flex items-center justify-center">
                                <img src="/logo.png" alt="StudyItUp" className="h-10 w-10 flex-shrink-0 mix-blend-multiply" />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleSidebar}
                                className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 bg-muted/50 hover:bg-muted text-muted-foreground rounded-xl"
                            >
                                <PanelLeftOpen className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 min-w-0">
                                <img src="/logo.png" alt="StudyItUp" className="h-10 w-10 flex-shrink-0 mix-blend-multiply" />
                                <h1 className="text-xl font-bold truncate">StudyItUp</h1>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleSidebar}
                                className="hidden lg:flex bg-muted/50 hover:bg-muted text-muted-foreground rounded-xl transition-all duration-300"
                            >
                                <PanelLeftClose className="h-5 w-5" />
                            </Button>
                        </>
                    )}
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            title={isCollapsed ? item.name : ''}
                            className={`flex items-center rounded-md transition-colors ${
                                isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
                            } ${
                                location.pathname.startsWith(item.href) 
                                ? 'bg-primary/10 text-primary font-medium' 
                                : 'hover:bg-accent text-foreground'
                            }`}
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </Link>
                    ))}

                    {user?.is_superuser && (
                        <>
                            <div className="border-t my-2 border-border/50" />
                            {adminNavigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    title={isCollapsed ? item.name : ''}
                                    className={`flex items-center rounded-md transition-colors font-medium ${
                                        isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
                                    } ${
                                        location.pathname.startsWith(item.href)
                                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                        : 'text-purple-600 dark:text-purple-400 hover:bg-accent'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                                </Link>
                            ))}
                        </>
                    )}
                </nav>
                <div className="p-4 border-t">
                    <Button
                        variant="ghost"
                        className={`w-full text-destructive hover:text-destructive hover:bg-destructive/10 ${isCollapsed ? 'justify-center p-2' : 'justify-start'}`}
                        onClick={handleLogout}
                        title={isCollapsed ? 'Logout' : ''}
                    >
                        <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                        {!isCollapsed && <span>Logout</span>}
                    </Button>
                </div>
            </aside>
            )}

            {/* Main content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isHidden ? 'lg:pl-0' : isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                {/* Top bar */}
                <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    
                    {/* <Button
                        variant="ghost"
                        size="icon"
                        className="hidden lg:flex text-muted-foreground hover:bg-muted rounded-xl"
                        onClick={toggleHideSidebar}
                        title={isHidden ? "Show Sidebar" : "Hide Sidebar"}
                    >
                        {isHidden ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </Button> */}
                    
                    <div className="flex-1" />
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium leading-none">{user?.full_name || user?.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                            {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

