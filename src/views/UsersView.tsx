import React, { useEffect, useState } from 'react';
import { UserPlus, Search, Mail, ShieldCheck, UserCircle2, X } from 'lucide-react';
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

export default function UsersView() {
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
      throw new Error(result?.error || 'Impossible de charger les utilisateurs.');
    }

    setUsers(Array.isArray(result) ? result.map(normalizeUser) : []);
  };

  const fetchMetadata = async () => {
    const response = await fetch('/api/users/metadata');
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error || 'Impossible de charger les roles et groupes.');
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
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les utilisateurs.');
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
        setErrorMessage(result?.error || 'Erreur lors de l\'invitation.');
        return;
      }

      setInviteDelivery(result?.delivery || null);
      await fetchUsers();
      closeModal();
    } catch (error) {
      console.error('Error inviting user:', error);
      setErrorMessage('Impossible d\'envoyer l\'invitation.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les accès, rôles et invitations de votre équipe.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          disabled={groups.length === 0}
          className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          <UserPlus className="w-5 h-5" />
          <span>Inviter un utilisateur</span>
        </button>
      </div>

      {inviteDelivery && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <div>{inviteDelivery.message}</div>
          {inviteDelivery.previewUrl && (
            <a href={inviteDelivery.previewUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-blue-700 underline">
              Ouvrir le lien d'invitation
            </a>
          )}
        </div>
      )}

      {errorMessage && !isModalOpen && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      {groups.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Aucun groupe n'existe dans la base. Creez d'abord un groupe pour pouvoir inviter un utilisateur.
        </div>
      )}

      <Card className="p-4 flex gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou email..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">
            {users.length} utilisateur{users.length > 1 ? 's' : ''}
         </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rôle / Groupe</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                    Chargement des utilisateurs depuis la base...
                  </td>
                </tr>
              )}

              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                    Aucun utilisateur ou invitation ne correspond a la recherche.
                  </td>
                </tr>
              )}

              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm',
                        user.recordType === 'invitation' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{user.role}</span>
                      <span className="text-xs text-slate-400">{user.group}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      user.status === 'Actif' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      user.status === 'Inactif' ? "bg-slate-100 text-slate-400 border border-slate-200" :
                      "bg-amber-50 text-amber-600 border border-amber-100"
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      'inline-flex items-center space-x-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
                      user.recordType === 'invitation'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    )}>
                      {user.recordType === 'invitation' ? <Mail className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>{user.recordType === 'invitation' ? 'Invitation' : 'Compte'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Inviter un utilisateur</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-xl">
                    <X className="w-5 h-5" />
                  </button>
               </div>
               <div className="p-6 space-y-4">
                  {errorMessage && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {errorMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom complet</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="ex: Ahmed Ben Tourki"
                      value={newUser.name}
                      onChange={e => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email professionnel</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="email@example.com"
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Rôle</label>
                      <select 
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                        value={newUser.role}
                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                      >
                        {roles.map(role => (
                          <option key={role.id} value={role.label}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Groupe</label>
                      <select 
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                        value={newUser.groupId}
                        onChange={e => setNewUser({...newUser, groupId: e.target.value})}
                      >
                        {groups.map(group => (
                          <option key={group.id} value={group.id}>
                            {group.name} - {group.organizationName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                    L'utilisateur recevra un email avec un lien vers un formulaire pour completer ses informations personnelles et choisir son mot de passe.
                  </div>
               </div>
               <div className="p-6 bg-slate-50 flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-white transition-all">Annuler</button>
                  <button 
                    onClick={handleInvite}
                    disabled={isSaving || !newUser.name.trim() || !newUser.email.trim() || !newUser.groupId}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'Envoi...' : 'Envoyer l\'invitation'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
