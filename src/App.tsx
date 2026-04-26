import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  TrendingUp,
  CreditCard,
  MessageSquare
} from 'lucide-react';

// Views (to be implemented)
import DashboardView from './views/DashboardView';
import GroupsView from './views/GroupsView';
import UsersView from './views/UsersView';
import ContactsView from './views/ContactsView';
import TemplatesView from './views/TemplatesView';
import CampaignsView from './views/CampaignsView';
import AccountView from './views/AccountView';
import LoginView from './views/LoginView';
import InvitationView from './views/InvitationView';

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
  login: (credentials: any) => Promise<void>;
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

// --- Layout Components ---

const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean, key?: React.Key }) => (
  <Link
    to={to}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
    <span className="font-medium">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-pill"
        className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
      />
    )}
  </Link>
);

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm">
          {user?.name.charAt(0)}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-slate-900 leading-none">{user?.name}</p>
          <p className="text-xs text-slate-500 mt-1">{user?.role}</p>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20"
            >
              <div className="p-4 border-bottom border-slate-50">
                <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider font-bold">{user?.organization}</p>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <UserCircle className="w-4 h-4" />
                  <span>Mon compte</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <Building2 className="w-4 h-4" />
                  <span>Changer d'organisation</span>
                </button>
                <button 
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', to: '/', roles: ['superadmin', 'admin'] },
    { icon: Users, label: 'Gestion des groupes', to: '/groups', roles: ['superadmin', 'admin'] },
    { icon: UserCircle, label: 'Utilisateurs', to: '/users', roles: ['superadmin'] },
    { icon: BookUser, label: 'Carnet d\'adresse', to: '/contacts', roles: ['superadmin', 'admin', 'agent'] },
    { icon: Library, label: 'Modèles messages', to: '/templates', roles: ['superadmin', 'admin', 'agent'] },
    { icon: Send, label: 'Campagnes', to: '/campaigns', roles: ['superadmin', 'admin', 'agent'] },
    { icon: Settings, label: 'Configuration', to: '/account', roles: ['superadmin', 'admin'] },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-slate-200 flex flex-col z-30"
      >
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <MessageSquare className="text-white w-6 h-6" />
          </div>
          {isSidebarOpen && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-xl text-slate-800 tracking-tight"
            >
              EasyBulk
            </motion.h1>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={isSidebarOpen ? item.label : ''}
              to={item.to}
              active={location.pathname === item.to}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
           <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
           >
             {isSidebarOpen ? <Menu className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
           </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <header className="h-20 bg-white border-bottom border-slate-200 px-8 flex items-center justify-between z-20">
          <div className="flex items-center space-x-4">
             <h2 className="text-lg font-bold text-slate-800">
               {menuItems.find(i => i.to === location.pathname)?.label || 'Aperçu'}
             </h2>
          </div>

          <div className="flex items-center space-x-4">
             <button className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
               <Bell className="w-5 h-5" />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="w-px h-8 bg-slate-200 mx-2"></div>
             <UserMenu />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           <div className="max-w-7xl mx-auto">
             {children}
           </div>
        </div>
      </main>
    </div>
  );
};

// --- App Root ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulated auth check
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setIsLoading(false);
  }, []);

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

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

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
