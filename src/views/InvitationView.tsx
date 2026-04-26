import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Mail, 
  Phone,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AtSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InvitationDetails {
  email: string;
  invitedName: string;
  role: string;
  group: string;
  organization: string;
}

export default function InvitationView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${token}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Invitation invalide ou expiré.');
        }
        
        setInvitation(result);
        
        // Try to split the name if it exists
        if (result.invitedName && result.invitedName !== result.email) {
          const parts = result.invitedName.split(' ');
          if (parts.length > 1) {
            setFormData(prev => ({
              ...prev,
              firstName: parts[0],
              lastName: parts.slice(1).join(' ')
            }));
          } else {
            setFormData(prev => ({ ...prev, firstName: parts[0] }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'invitation.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvitation();
    } else {
      setError('Token d\'invitation manquant.');
      setLoading(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          userName: formData.userName,
          phoneNumber: formData.phoneNumber,
          password: formData.password
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création du compte.');
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de créer le compte.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50 -ml-20 -mb-20"></div>

      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 p-12 relative z-10 border border-white">
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200">
            <MessageSquare className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finaliser votre compte</h1>
            <p className="text-slate-500 font-medium mt-2">
              Rejoignez <span className="text-slate-800 font-bold">{invitation?.organization || 'l\'organisation'}</span> sur EasyBulk
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-6 py-8"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Compte créé avec succès !</h2>
                <p className="text-slate-500 mt-2">Vous allez être redirigé vers la page de connexion...</p>
              </div>
            </motion.div>
          ) : error && !invitation ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center"
            >
              <h3 className="font-bold text-rose-800 mb-2">Invitation Invalide</h3>
              <p className="text-sm text-rose-600">{error}</p>
              <button 
                onClick={() => navigate('/login')}
                className="mt-6 px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
              >
                Retour à la connexion
              </button>
            </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 mb-6">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="flex-1">
                    <p className="text-slate-500">Email professionnel</p>
                    <p className="font-bold text-slate-900">{invitation?.email}</p>
                  </div>
                  <div className="w-px h-8 bg-blue-200 mx-2"></div>
                  <div className="flex-1">
                    <p className="text-slate-500">Rôle assigné</p>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <p className="font-bold text-slate-900">{invitation?.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Prénom</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="text" 
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-slate-900 font-medium"
                      placeholder="Prénom"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Nom</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-slate-900 font-medium"
                      placeholder="Nom de famille"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Nom d'utilisateur</label>
                  <div className="relative group">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="text" 
                      name="userName"
                      required
                      value={formData.userName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-slate-900 font-medium"
                      placeholder="Identifiant"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Numéro de téléphone</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="tel" 
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-slate-900 font-medium"
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Mot de passe</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="password" 
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-slate-900 font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Confirmer mot de passe</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="password" 
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all outline-none text-slate-900 font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-4 mt-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg transition-all shadow-xl shadow-blue-200 flex items-center justify-center space-x-2 disabled:opacity-70"
              >
                {submitting ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
