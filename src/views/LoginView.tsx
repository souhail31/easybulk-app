import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  MessageSquare,
  ChevronRight,
  Building2,
  AlertCircle,
  Languages,
  ArrowLeft
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function LoginView() {
  const { login } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('auth.login_error'));

      const orgRes = await fetch(`/api/auth/organizations?userId=${data.id}`);
      const orgData = await orgRes.json();
      if (!orgRes.ok) throw new Error(orgData.error || t('auth.org_error'));

      if (orgData.length === 0) throw new Error(t('auth.no_org_error'));

      setAuthenticatedUser(data);
      setOrganizations(orgData);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOrg = (orgName: string) => {
    if (authenticatedUser) {
      login({ ...authenticatedUser, organization: orgName });
    }
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'fr' ? 'en' : i18n.language === 'en' ? 'ar' : 'fr';
    i18n.changeLanguage(next);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 bg-surface relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] -ml-40 -mb-40"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Language Switcher Overlay */}
      <div className={cn(
        "absolute top-8 z-50",
        i18n.dir() === 'rtl' ? 'left-8' : 'right-8'
      )}>
        <button 
          onClick={toggleLanguage}
          className="flex items-center space-x-2 px-6 py-3 bg-white/40 backdrop-blur-xl border border-white/50 rounded-full text-on-surface font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-on-surface/5"
        >
          <Languages className="w-4 h-4" />
          <span>{i18n.language}</span>
        </button>
      </div>

      <div className="w-full max-w-xl bg-white/70 backdrop-blur-3xl rounded-[3.5rem] shadow-3xl shadow-primary/5 p-10 md:p-16 relative z-10 border border-white/50 overflow-hidden group">
        {/* Decorative corner accent */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
        
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-col items-center text-center space-y-6 mb-14">
                <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-3xl shadow-primary/30 relative">
                  <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] animate-ping opacity-20"></div>
                  <MessageSquare className="text-white w-12 h-12 relative z-10" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-3">{t('auth.welcome')}</h1>
                  <p className="text-on-surface-variant font-bold text-lg opacity-60 tracking-tight">{t('auth.welcome_sub')}</p>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-10 p-6 bg-rose-50 border-2 border-rose-100 text-rose-600 rounded-3xl text-sm font-black flex items-center uppercase tracking-widest shadow-lg shadow-rose-500/5"
                >
                  <AlertCircle className="w-6 h-6 mr-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2 rtl:ml-0 rtl:mr-2">{t('auth.email_label')}</label>
                  <div className="relative group">
                    <Mail className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-6 h-6 text-outline group-focus-within:text-primary transition-colors",
                      i18n.dir() === 'rtl' ? 'right-6' : 'left-6'
                    )} />
                    <input 
                      type="text" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className={cn(
                        "w-full py-6 rounded-[2rem] bg-surface-container/50 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none text-on-surface font-black text-lg shadow-inner",
                        i18n.dir() === 'rtl' ? 'pr-16 pl-6' : 'pl-16 pr-6'
                      )}
                      placeholder={t('auth.email_placeholder')}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-2 rtl:ml-0 rtl:mr-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">{t('auth.password_label')}</label>
                    <button type="button" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">{t('auth.forgot_password')}</button>
                  </div>
                  <div className="relative group">
                    <Lock className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-6 h-6 text-outline group-focus-within:text-primary transition-colors",
                      i18n.dir() === 'rtl' ? 'right-6' : 'left-6'
                    )} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={cn(
                        "w-full py-6 rounded-[2rem] bg-surface-container/50 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none text-on-surface font-black text-lg shadow-inner",
                        i18n.dir() === 'rtl' ? 'pr-16 pl-16' : 'pl-16 pr-16'
                      )}
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors",
                        i18n.dir() === 'rtl' ? 'left-6' : 'right-6'
                      )}
                    >
                      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-6 mt-4 rounded-[2rem] bg-primary hover:bg-on-surface text-white font-black text-xl transition-all shadow-3xl shadow-primary/30 flex items-center justify-center space-x-3 disabled:opacity-70 group"
                >
                  {isLoading ? (
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="uppercase tracking-[0.2em] text-sm">{t('auth.login_btn')}</span>
                      <ChevronRight className={cn(
                        "w-6 h-6 transition-transform group-hover:translate-x-2",
                        i18n.dir() === 'rtl' ? 'rotate-180 group-hover:-translate-x-2' : ''
                      )} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-col items-center text-center space-y-6 mb-14">
                <div className="w-24 h-24 bg-surface-container rounded-[2.5rem] flex items-center justify-center shadow-2xl relative group/org">
                  <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] scale-0 group-hover/org:scale-100 transition-transform duration-500"></div>
                  <Building2 className="text-on-surface-variant w-12 h-12 relative z-10" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-3">{t('auth.choose_org')}</h1>
                  <p className="text-on-surface-variant font-bold text-lg opacity-60 tracking-tight">{t('auth.choose_org_sub')}</p>
                </div>
              </div>

              <div className="space-y-5">
                {organizations.map((org, idx) => (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={org.id}
                    onClick={() => handleSelectOrg(org.name)}
                    className="w-full flex items-center justify-between p-7 rounded-[2.5rem] border-2 border-outline-variant/10 hover:border-primary hover:bg-primary/5 transition-all group shadow-sm bg-white/50 backdrop-blur-sm"
                  >
                    <div className="flex items-center space-x-6 rtl:space-x-reverse">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container group-hover:bg-primary/10 flex items-center justify-center transition-all group-hover:rotate-6 shadow-inner">
                        <Building2 className="w-7 h-7 text-outline group-hover:text-primary transition-colors" />
                      </div>
                      <div className="text-left rtl:text-right">
                        <span className="font-black text-on-surface text-xl tracking-tight block">{org.name}</span>
                        <span className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">Accès standard</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-outline-variant/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                      <ChevronRight className={cn(
                        "w-6 h-6 text-outline group-hover:text-white transition-all",
                        i18n.dir() === 'rtl' ? 'rotate-180' : ''
                      )} />
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-12 text-center">
                <button 
                  onClick={() => {
                    setStep(1);
                    setAuthenticatedUser(null);
                    setOrganizations([]);
                  }}
                  className="flex items-center justify-center space-x-3 mx-auto px-8 py-4 rounded-2xl hover:bg-surface-container/50 transition-all text-sm font-black text-on-surface-variant uppercase tracking-widest group rtl:space-x-reverse"
                >
                  <ArrowLeft className={cn(
                    "w-5 h-5 transition-transform group-hover:-translate-x-2",
                    i18n.dir() === 'rtl' ? 'rotate-180 group-hover:translate-x-2' : ''
                  )} />
                  <span>{t('auth.back_to_login')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-14 pt-10 border-t-2 border-outline-variant/5 text-center">
           <p className="text-[10px] text-on-surface-variant/40 font-black uppercase tracking-[0.3em] flex items-center justify-center">
             {t('auth.certified_by')} 
             <span className="text-primary ml-2 rtl:mr-2 rtl:ml-0 px-2 py-0.5 bg-primary/5 rounded-md border border-primary/10">EasyBulk Quantum v4</span>
           </p>
        </div>
      </div>
    </div>
  );
}
