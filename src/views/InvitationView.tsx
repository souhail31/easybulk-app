import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Phone,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AtSign,
  Building2,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

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
  const { t, i18n } = useTranslation();
  
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
          throw new Error(result.error || t('invitation.invalid'));
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
        setError(err instanceof Error ? err.message : t('invitation.invalid'));
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvitation();
    } else {
      setError(t('invitation.missing_token'));
      setLoading(false);
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('invitation.err_password_match'));
      return;
    }
    
    if (formData.password.length < 8) {
      setError(t('invitation.err_password_len'));
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
        throw new Error(result.error || t('invitation.invalid'));
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invitation.invalid'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 bg-surface relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] -ml-40 -mb-40"></div>

      <div className="w-full max-w-2xl bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-primary/5 p-8 md:p-14 relative z-10 border border-white/50">
        <div className="flex flex-col items-center text-center space-y-6 mb-12">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30">
            <MessageSquare className="text-white w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">{t('invitation.title')}</h1>
            <p className="text-on-surface-variant/70 font-bold text-lg">
              {t('invitation.subtitle_prefix')} <span className="text-primary font-black px-2 py-0.5 bg-primary/5 rounded-lg border border-primary/10">{invitation?.organization || 'l\'organisation'}</span> {t('invitation.subtitle_suffix')}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-6 py-12"
            >
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-on-surface tracking-tighter mb-2">{t('invitation.success')}</h2>
                <p className="text-on-surface-variant font-bold text-lg">{t('invitation.success_sub')}</p>
              </div>
            </motion.div>
          ) : error && !invitation ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center py-8"
            >
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-rose-500/20">
                <AlertCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h3 className="text-2xl font-black text-on-surface tracking-tighter mb-2">{t('invitation.invalid')}</h3>
              <p className="text-rose-600 font-bold bg-rose-50 px-4 py-2 rounded-xl mb-8">{error}</p>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-on-surface text-white font-black rounded-[1.5rem] shadow-xl hover:bg-on-surface-variant transition-all uppercase tracking-widest text-sm"
              >
                {t('invitation.back_to_login')}
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit} 
              className="space-y-8"
            >
              {error && (
                <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 flex items-center shadow-sm">
                   <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                  {error}
                </div>
              )}

              <div className="rounded-[2rem] border-2 border-primary/20 bg-primary/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-inner">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">{t('users.form_email')}</p>
                  <p className="font-black text-on-surface text-lg">{invitation?.email}</p>
                </div>
                <div className="hidden md:block w-px h-12 bg-primary/20 mx-4"></div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">{t('users.form_role')}</p>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white w-fit px-3 py-1.5 rounded-xl shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <p className="font-black text-on-surface uppercase tracking-widest text-xs">{invitation?.role}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2 rtl:ml-0 rtl:mr-2">{t('invitation.form_fname')}</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors rtl:left-auto rtl:right-4" />
                    <input 
                      type="text" 
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className={cn(
                        "w-full py-4.5 rounded-[1.5rem] bg-surface-container/50 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none text-on-surface font-bold text-lg shadow-sm",
                        i18n.dir() === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                      )}
                      placeholder={t('invitation.form_fname')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2 rtl:ml-0 rtl:mr-2">{t('invitation.form_lname')}</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-6 py-4.5 rounded-[1.5rem] bg-surface-container/50 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none text-on-surface font-bold text-lg shadow-sm"
                      placeholder={t('invitation.form_lname')}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2 rtl:ml-0 rtl:mr-2">{t('invitation.form_username')}</label>
                  <div className="relative group">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors rtl:left-auto rtl:right-4" />
                    <input 
                      type="text" 
                      name="userName"
                      required
                      value={formData.userName}
                      onChange={handleChange}
                      className={cn(
                        "w-full py-4.5 rounded-[1.5rem] bg-surface-container/50 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none text-on-surface font-bold text-lg shadow-sm",
                        i18n.dir() === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                      )}
                      placeholder="Identifiant"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2 rtl:ml-0 rtl:mr-2">{t('invitation.form_phone')}</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors rtl:left-auto rtl:right-4" />
                    <input 
                      type="tel" 
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={cn(
                        "w-full py-4.5 rounded-[1.5rem] bg-surface-container/50 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none text-on-surface font-bold text-lg shadow-sm",
                        i18n.dir() === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                      )}
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2 rtl:ml-0 rtl:mr-2">{t('invitation.form_password')}</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors rtl:left-auto rtl:right-4" />
                    <input 
                      type="password" 
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={cn(
                        "w-full py-4.5 rounded-[1.5rem] bg-surface-container/50 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none text-on-surface font-bold text-lg shadow-sm",
                        i18n.dir() === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                      )}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2 rtl:ml-0 rtl:mr-2">{t('invitation.form_password_confirm')}</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors rtl:left-auto rtl:right-4" />
                    <input 
                      type="password" 
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={cn(
                        "w-full py-4.5 rounded-[1.5rem] bg-surface-container/50 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none text-on-surface font-bold text-lg shadow-sm",
                        i18n.dir() === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'
                      )}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-5 mt-8 rounded-[1.5rem] bg-primary hover:bg-primary-container text-white font-black text-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center space-x-3 disabled:opacity-70 group"
              >
                {submitting ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="uppercase tracking-widest text-sm">{t('invitation.create_btn')}</span>
                    <ChevronRight className={cn("w-6 h-6 transition-transform group-hover:translate-x-1", i18n.dir() === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : '')} />
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
