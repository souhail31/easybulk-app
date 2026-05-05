import React, { useEffect, useState } from 'react';
import { UserPlus, Search, Mail, ShieldCheck, UserCircle2, X, AlertCircle, Users, CheckCircle2, Clock, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Cards';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  group: string;
  status: string;
  recordType: 'user' | 'invitation';
}

interface RoleOption {
  id: number;
  code: string;
  label: string;
}

interface GroupOption {
  id: number;
  name: string;
  organizationId: number;
  organizationName: string;
}

interface InviteDelivery {
  mode: 'smtp' | 'preview';
  message: string;
  previewUrl: string | null;
}

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <Card className="p-8 bg-white/60 backdrop-blur-md border-outline-variant/10 shadow-xl shadow-surface-variant/5 group overflow-hidden relative">
    <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000", color)} />
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-4xl font-black text-on-surface tracking-tighter">{value}</p>
      </div>
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", color.replace('bg-', 'text-').replace('-500', ''), color.replace('bg-', 'bg-').replace('-500', '/10'))}>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  </Card>
);

export default function UsersView() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [inviteDelivery, setInviteDelivery] = useState<InviteDelivery | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: '', groupId: '' });

  const normalizeUser = (user: any): UserData => ({
    id: String(user?.id ?? ''),
    name: user?.name ?? user?.email ?? 'Utilisateur sans nom',
    email: user?.email ?? '',
    role: user?.role ?? 'Sans role',
    group: user?.group ?? 'Aucun groupe',
    status: user?.status ?? 'Inactif',
    recordType: user?.recordType === 'invitation' ? 'invitation' : 'user'
  });

  const fetchUsers = async () => {
    const response = await fetch('/api/users');
    const result = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(result?.error || t('common.error_loading'));
    }

    setUsers(Array.isArray(result) ? result.map(normalizeUser) : []);
  };

  const fetchMetadata = async () => {
    const response = await fetch('/api/users/metadata');
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error || t('common.error_loading'));
    }

    const nextRoles = Array.isArray(result?.roles) ? result.roles : [];
    const nextGroups = Array.isArray(result?.groups) ? result.groups : [];

    setRoles(nextRoles);
    setGroups(nextGroups);
    setNewUser((current) => ({
      ...current,
      role: current.role || nextRoles[0]?.label || 'Agent',
      groupId: current.groupId || (nextGroups[0] ? String(nextGroups[0].id) : '')
    }));
  };

  const fetchPageData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      await Promise.all([fetchUsers(), fetchMetadata()]);
    } catch (error) {
      console.error('Error fetching users page data:', error);
      setUsers([]);
      setErrorMessage(error instanceof Error ? error.message : t('common.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setErrorMessage('');
    setNewUser({
      name: '',
      email: '',
      role: roles[0]?.label || 'Agent',
      groupId: groups[0] ? String(groups[0].id) : ''
    });
  };

  const handleInvite = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.groupId) return;

    try {
      setIsSaving(true);
      setErrorMessage('');
      setInviteDelivery(null);

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim(),
          role: newUser.role,
          groupId: Number(newUser.groupId)
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(result?.error || t('users.error_save'));
        return;
      }

      setInviteDelivery(result?.delivery || null);
      await fetchUsers();
      closeModal();
    } catch (error) {
      console.error('Error inviting user:', error);
      setErrorMessage(t('users.error_save'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsersCount = users.filter(u => u.status === 'Actif').length;
  const invitationsCount = users.filter(u => u.recordType === 'invitation').length;

  return (
    <div className="space-y-10 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Users className="text-primary w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t('common.management')}</span>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter">{t('users.title')}</h1>
          <p className="text-on-surface-variant font-bold mt-2 text-lg">{t('users.subtitle')}</p>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          disabled={groups.length === 0}
          className="flex items-center space-x-3 bg-primary text-white px-8 py-5 rounded-[2rem] transition-all shadow-2xl shadow-primary/30 font-black uppercase tracking-widest text-sm group disabled:opacity-50"
        >
          <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span>{t('users.add_btn')}</span>
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label={t('common.users')} value={users.length} icon={Users} color="bg-blue-500" />
        <StatCard label={t('common.active')} value={activeUsersCount} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard label={t('users.type_invite')} value={invitationsCount} icon={Mail} color="bg-amber-500" />
      </div>

      {inviteDelivery && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] border-2 border-primary/20 bg-primary/5 px-10 py-6 text-sm font-black text-primary flex flex-col md:flex-row items-center justify-between gap-6 uppercase tracking-widest shadow-xl shadow-primary/5"
        >
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <CheckCircle2 className="w-8 h-8" />
            <span>{inviteDelivery.message}</span>
          </div>
          {inviteDelivery.previewUrl && (
            <a href={inviteDelivery.previewUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-2 bg-white text-primary px-6 py-3 rounded-2xl shadow-xl hover:bg-primary hover:text-white transition-all">
              <Mail className="w-5 h-5" />
              <span>{t('users.invite_preview')}</span>
            </a>
          )}
        </motion.div>
      )}

      {errorMessage && !isModalOpen && (
        <div className="rounded-[2rem] border-2 border-rose-200/50 bg-rose-50 px-8 py-4 text-sm font-black text-rose-700 flex items-center space-x-4 uppercase tracking-widest">
          <AlertCircle className="w-6 h-6" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search & Filter */}
      <Card className="p-4 rounded-[2.5rem] flex flex-col md:flex-row gap-4 border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/80 backdrop-blur-xl">
         <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-outline" />
            <input 
              type="text" 
              placeholder={t('users.search_placeholder')} 
              className="w-full pl-16 pr-8 py-5 bg-surface-container/50 border-2 border-transparent focus:border-primary focus:bg-white rounded-[2rem] text-sm font-black text-on-surface outline-none transition-all" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </Card>

      {/* Table */}
      <Card className="rounded-[3rem] border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/60 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="bg-surface-container/30 border-b-4 border-white">
                <th className="px-10 py-8 text-[11px] font-black text-outline uppercase tracking-[0.2em]">{t('users.col_user')}</th>
                <th className="px-10 py-8 text-[11px] font-black text-outline uppercase tracking-[0.2em]">{t('users.col_role')}</th>
                <th className="px-10 py-8 text-[11px] font-black text-outline uppercase tracking-[0.2em]">{t('users.col_status')}</th>
                <th className="px-10 py-8 text-[11px] font-black text-outline uppercase tracking-[0.2em] text-right rtl:text-left">{t('users.col_type')}</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-xl font-black text-on-surface-variant/30 uppercase tracking-widest">
                    {t('common.no_data')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <motion.tr 
                    layout
                    key={user.id} 
                    className="hover:bg-white/80 transition-all duration-300 group"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center space-x-5 rtl:space-x-reverse">
                        <div className={cn(
                          'w-16 h-16 rounded-[1.75rem] flex items-center justify-center text-xl font-black border-4 border-white shadow-xl',
                          user.recordType === 'invitation' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
                        )}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-lg font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">{user.name}</div>
                          <div className="text-xs font-bold text-outline lowercase">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-on-surface uppercase tracking-widest">{user.role}</span>
                        <span className="text-[10px] font-bold text-outline flex items-center">
                          <Layers className="w-3 h-3 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                          {user.group}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={cn(
                        "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border-2",
                        user.status === 'Actif' ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" :
                        user.status === 'Inactif' ? "bg-surface-container text-on-surface-variant border-outline-variant/20" :
                        "bg-amber-50 text-amber-700 border-amber-200/50"
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right rtl:text-left">
                      <span className={cn(
                        'inline-flex items-center space-x-3 rtl:space-x-reverse rounded-[1.25rem] px-5 py-3 text-[10px] font-black uppercase tracking-widest border-2',
                        user.recordType === 'invitation'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                          : 'bg-primary/5 text-primary border-primary/20'
                      )}>
                        {user.recordType === 'invitation' ? <Mail className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        <span>{user.recordType === 'invitation' ? t('users.type_invite') : t('users.type_account')}</span>
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-on-surface/60 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 50 }}
              className="relative w-full max-w-xl bg-white rounded-[3.5rem] shadow-3xl overflow-hidden border border-white/20"
            >
               <div className="p-12 pb-8 border-b border-outline-variant/10 bg-surface-container/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black text-on-surface tracking-tighter">{t('users.add_title')}</h2>
                    <button onClick={closeModal} className="text-outline hover:text-rose-500 bg-white p-5 rounded-[2rem] shadow-xl border border-outline-variant/20 transition-all hover:rotate-90">
                      <X className="w-8 h-8" />
                    </button>
                  </div>
               </div>
               
               <div className="p-12 space-y-10">
                  {errorMessage && (
                    <div className="rounded-[2rem] border-2 border-rose-200/50 bg-rose-50 px-8 py-4 text-sm font-black text-rose-700 flex items-center space-x-4 uppercase tracking-widest">
                      <AlertCircle className="w-6 h-6" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('users.form_name')}</label>
                    <input 
                      type="text" 
                      className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg" 
                      placeholder="ex: Ahmed Ben Tourki"
                      value={newUser.name}
                      onChange={e => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('users.form_email')}</label>
                    <input 
                      type="email" 
                      className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg" 
                      placeholder="email@example.com"
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('users.form_role')}</label>
                      <select 
                        className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg"
                        value={newUser.role}
                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                      >
                        {roles.map(role => (
                          <option key={role.id} value={role.label}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('users.form_group')}</label>
                      <select 
                        className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg"
                        value={newUser.groupId}
                        onChange={e => setNewUser({...newUser, groupId: e.target.value})}
                      >
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="rounded-[2.5rem] border-2 border-outline-variant/10 bg-surface-container/30 p-8 text-xs font-bold text-on-surface-variant/60 leading-relaxed uppercase tracking-[0.05em]">
                    {t('users.invite_hint')}
                  </div>
               </div>

               <div className="p-12 bg-surface-container/20 border-t border-outline-variant/10 flex gap-6">
                  <button onClick={closeModal} className="flex-1 px-10 py-6 rounded-[2rem] border-2 border-outline-variant/30 text-on-surface font-black uppercase tracking-widest text-sm hover:bg-white transition-all">{t('common.cancel')}</button>
                  <button 
                    onClick={handleInvite}
                    disabled={isSaving || !newUser.name.trim() || !newUser.email.trim() || !newUser.groupId}
                    className="flex-1 px-10 py-6 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all disabled:opacity-50"
                  >
                    {isSaving ? t('common.loading') : t('users.add_btn')}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
