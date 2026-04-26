import React, { useState } from 'react';
import { 
  Plus, 
  Mail, 
  Lock, 
  ShieldCheck, 
  AtSign, 
  Eye, 
  EyeOff,
  MessageSquare,
  ChevronRight,
  Building2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';

export default function LoginView() {
  const { login } = useAuth();
  
  // States
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

      if (!res.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      // Fetch organizations for this user
      const orgRes = await fetch(`/api/auth/organizations?userId=${data.id}`);
      const orgData = await orgRes.json();

      if (!orgRes.ok) {
        throw new Error(orgData.error || 'Erreur récupération des organisations');
      }

      if (orgData.length === 0) {
        throw new Error('Votre compte n\'est lié à aucune organisation.');
      }

      // Always show organization selection step, even if there is only 1
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50 -ml-20 -mb-20"></div>

      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 p-12 relative z-10 border border-white">
        
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex flex-col items-center text-center space-y-4 mb-10">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200">
                  <MessageSquare className="text-white w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bienvenue sur EasyBulk</h1>
                  <p className="text-slate-500 font-medium">Connectez-vous pour gérer vos campagnes SMS</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Adresse e-mail ou pseudo</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="text" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-slate-900 font-medium"
                      placeholder="nom@entreprise.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-bold text-slate-700">Mot de passe</label>
                    <button type="button" className="text-xs font-bold text-blue-600 hover:underline transition-all">Oublié ?</button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-slate-900 font-medium"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg transition-all shadow-xl shadow-blue-200 flex items-center justify-center space-x-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="flex flex-col items-center text-center space-y-4 mb-10">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-50">
                  <Building2 className="text-blue-600 w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Choisissez votre organisation</h1>
                  <p className="text-slate-500 font-medium mt-1">Vous appartenez à plusieurs espaces.</p>
                </div>
              </div>

              <div className="space-y-3">
                {organizations.map(org => (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrg(org.name)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <Building2 className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
                      </div>
                      <span className="font-bold text-slate-700 group-hover:text-blue-700">{org.name}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button 
                  onClick={() => {
                    setStep(1);
                    setAuthenticatedUser(null);
                    setOrganizations([]);
                  }}
                  className="text-sm font-bold text-slate-500 hover:text-slate-800"
                >
                  ← Retour à la connexion
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 pt-10 border-t border-slate-100 text-center">
           <p className="text-sm text-slate-400 font-medium tracking-tight">
             Solution certifiée par <span className="text-slate-700 font-black">EasyBulk Security</span>
           </p>
        </div>
      </div>
    </div>
  );
}
