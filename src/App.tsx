import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  LayoutDashboard, 
  BookUser, 
  Library, 
  Send, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  UserCircle,
  Building2,
  ChevronRight,
  MessageSquare,
  Languages,
  ChevronDown,
  Layers,
  ShieldCheck,
  CreditCard,
  UserCircle2
} from 'lucide-react';

// Views
import DashboardView from './views/DashboardView';
import GroupsView from './views/GroupsView';
import UsersView from './views/UsersView';
import ContactsView from './views/ContactsView';
import TemplatesView from './views/TemplatesView';
import CampaignsView from './views/CampaignsView';
import AccountView from './views/AccountView';
import LoginView from './views/LoginView';
import InvitationView from './views/InvitationView';
import NotificationBell from './components/NotificationBell';
import { cn } from './lib/utils';

// --- Types ---
interface User {
  id: number;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'agent';
  organization: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// --- Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// --- Language Switcher ---
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇹🇳' }
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white rounded-2xl border border-outline-variant/20 hover:border-primary transition-all shadow-sm group"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant group-hover:text-primary hidden md:inline">{currentLang.code}</span>
        <ChevronDown className={cn("w-4 h-4 text-outline transition-transform", isOpen ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-48 bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-2xl border border-white/50 overflow-hidden z-[101]"
            >
              <div className="p-2 space-y-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all",
                      i18n.language === lang.code 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                    )}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-sm font-black uppercase tracking-widest">{lang.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Layout Components ---

const SidebarItem = ({ icon: Icon, label, to, active, collapsed }: { icon: any, label: string, to: string, active: boolean, collapsed: boolean }) => (
  <Link
    to={to}
    className={cn(
      "relative flex items-center transition-all duration-300 group",
      collapsed ? "justify-center px-0 py-4" : "space-x-4 px-6 py-4 rounded-[1.25rem] mx-3 rtl:space-x-reverse",
      active 
        ? "bg-primary text-white shadow-2xl shadow-primary/30" 
        : "text-on-surface-variant/60 hover:text-primary hover:bg-primary/5"
    )}
  >
    <Icon className={cn("w-6 h-6 shrink-0 transition-transform group-hover:scale-110", active ? "text-white" : "text-outline-variant group-hover:text-primary")} />
    {!collapsed && (
      <span className="font-black text-[11px] uppercase tracking-[0.2em]">{label}</span>
    )}
    {active && (
      <motion.div 
        layoutId="active-nav"
        className={cn(
          "absolute bg-white rounded-full",
          collapsed ? "right-1 w-1.5 h-1.5" : "right-4 w-1.5 h-1.5"
        )}
      />
    )}
  </Link>
);

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-4 p-1.5 bg-white border border-outline-variant/10 rounded-full hover:border-primary transition-all shadow-sm pr-4 rtl:pr-1.5 rtl:pl-4 group"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-black text-lg shadow-lg border-2 border-white">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div className="hidden lg:block text-left rtl:text-right">
          <p className="text-sm font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">{user?.name}</p>
          <p className="text-[9px] font-black text-outline uppercase tracking-[0.2em]">{user?.role}</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-outline group-hover:text-primary transition-transform hidden lg:block", isOpen ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-72 bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-3xl border border-white/50 overflow-hidden z-[101]"
            >
              <div className="p-8 border-b border-outline-variant/5 bg-surface-container/30">
                <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-xl shadow-primary/20">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-black text-on-surface tracking-tighter">{user?.name}</p>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{user?.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs font-bold text-on-surface-variant bg-white px-4 py-2 rounded-xl shadow-sm border border-outline-variant/5">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="truncate">{user?.organization}</span>
                </div>
              </div>
              <div className="p-3 space-y-1">
                <Link 
                  to="/account" 
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center space-x-4 px-5 py-4 text-sm font-black text-on-surface-variant hover:bg-primary/5 hover:text-primary rounded-2xl transition-all uppercase tracking-widest group rtl:space-x-reverse"
                >
                  <UserCircle2 className="w-5 h-5 text-outline-variant group-hover:text-primary" />
                  <span>{t('account.profile_title')}</span>
                </Link>
                <button 
                  onClick={logout}
                  className="w-full flex items-center space-x-4 px-5 py-4 text-sm font-black text-rose-600 hover:bg-rose-50 rounded-2xl transition-all uppercase tracking-widest group rtl:space-x-reverse"
                >
                  <LogOut className="w-5 h-5 text-rose-400 group-hover:text-rose-600" />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { icon: LayoutDashboard, label: t('common.dashboard'), to: '/', roles: ['superadmin', 'admin'] },
    { icon: Layers, label: t('common.groups'), to: '/groups', roles: ['superadmin', 'admin'] },
    { icon: Users, label: t('common.users'), to: '/users', roles: ['superadmin'] },
    { icon: BookUser, label: t('common.contacts'), to: '/contacts', roles: ['superadmin', 'admin', 'agent'] },
    { icon: Library, label: t('common.templates'), to: '/templates', roles: ['superadmin', 'admin', 'agent'] },
    { icon: Send, label: t('common.campaigns'), to: '/campaigns', roles: ['superadmin', 'admin', 'agent'] },
    { icon: Settings, label: t('common.settings'), to: '/account', roles: ['superadmin', 'admin'] },
  ];

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="h-full flex flex-col relative z-10">
      <div className={cn("p-10 flex items-center", collapsed ? "justify-center" : "space-x-5 rtl:space-x-reverse")}>
        <div className="w-14 h-14 bg-primary rounded-[1.5rem] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(var(--color-primary),0.3)] shrink-0">
          <MessageSquare className="text-white w-8 h-8" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <h1 className="font-black text-2xl text-on-surface tracking-tighter leading-none">EasyBulk</h1>
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mt-1">Enterprise</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
            active={location.pathname === item.to}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="p-8">
        <div className={cn(
          "bg-surface-container/50 p-6 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group",
          collapsed ? "items-center px-4" : ""
        )}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" />
          <div className={cn("flex items-center relative z-10", collapsed ? "justify-center" : "space-x-4 rtl:space-x-reverse")}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-outline-variant/5">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-[10px] font-black text-on-surface uppercase tracking-widest">v4.2 PRO</p>
                <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Premium Support</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-surface overflow-hidden relative font-sans text-on-surface selection:bg-primary/10 selection:text-primary">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -mr-[300px] -mt-[300px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[100px] -ml-[200px] -mb-[200px] pointer-events-none" />

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-xl z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 320 : 120 }}
        className="hidden lg:flex bg-white/80 backdrop-blur-2xl border-r border-outline-variant/10 flex-col z-[90] relative shadow-2xl"
      >
        <SidebarContent collapsed={!isSidebarOpen} />
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "absolute -right-5 top-12 w-10 h-10 bg-white border border-outline-variant/20 rounded-2xl flex items-center justify-center text-outline hover:text-primary shadow-xl hover:shadow-primary/20 transition-all z-[100]",
            !isSidebarOpen ? "rotate-180" : ""
          )}
        >
          <ChevronRight className={cn("w-5 h-5", i18n.dir() === 'rtl' ? 'rotate-180' : '')} />
        </button>
      </motion.aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={{ x: i18n.dir() === 'rtl' ? '100%' : '-100%' }}
        animate={{ x: isMobileMenuOpen ? 0 : (i18n.dir() === 'rtl' ? '100%' : '-100%') }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 bottom-0 w-80 bg-white z-[110] lg:hidden flex flex-col shadow-[0_0_80px_-20px_rgba(0,0,0,0.3)]",
          i18n.dir() === 'rtl' ? 'right-0' : 'left-0'
        )}
      >
        <SidebarContent collapsed={false} />
        <div className="p-6 mt-auto">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full py-5 bg-surface-container rounded-[1.5rem] text-on-surface font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center space-x-3 shadow-inner"
          >
            <X className="w-5 h-5" />
            <span>Fermer le menu</span>
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-28 bg-white/40 backdrop-blur-xl border-b border-white/50 px-6 md:px-12 flex items-center justify-between shrink-0 relative z-40">
          <div className="flex items-center space-x-6 rtl:space-x-reverse">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="p-4 bg-white shadow-xl shadow-on-surface/5 border border-outline-variant/10 lg:hidden text-on-surface-variant hover:bg-primary hover:text-white rounded-2xl transition-all"
             >
               <Menu className="w-6 h-6" />
             </button>
             <div className="hidden sm:flex flex-col">
               <h2 className="text-2xl font-black text-on-surface tracking-tighter leading-none">
                 {menuItems.find(i => i.to === location.pathname)?.label || t('common.dashboard')}
               </h2>
               <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 <span className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">Live Sync Active</span>
               </div>
             </div>
          </div>

          <div className="flex items-center space-x-4 md:space-x-8 rtl:space-x-reverse">
             <LanguageSwitcher />
             <div className="hidden sm:block w-px h-10 bg-outline-variant/10" />
             <div className="flex items-center space-x-3 md:space-x-6 rtl:space-x-reverse">
               <NotificationBell />
               <UserMenu />
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12">
           <AnimatePresence mode="wait">
             <motion.div 
               key={location.pathname}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
               className="max-w-7xl mx-auto"
             >
               {children}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const login = async (userData: User) => {
     setUser(userData);
     localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const authValue = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading
  };

  if (isLoading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-surface">
      <div className="relative">
        <div className="w-20 h-20 border-8 border-primary/10 rounded-full"></div>
        <div className="w-20 h-20 border-8 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
    </div>
  );

  return (
    <Router>
      <AuthContext.Provider value={authValue}>
        {user ? (
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/groups" element={<GroupsView />} />
              <Route path="/users" element={<UsersView />} />
              <Route path="/contacts" element={<ContactsView />} />
              <Route path="/templates" element={<TemplatesView />} />
              <Route path="/campaigns" element={<CampaignsView />} />
              <Route path="/account" element={<AccountView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route path="/invitation/:token" element={<InvitationView />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </AuthContext.Provider>
    </Router>
  );
}
