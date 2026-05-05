import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  History,
  LayoutGrid,
  X,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Building2,
  AlertCircle,
  Layers
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, StatCard } from '../components/ui/Cards';
import { cn, formatNumber } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Group {
  id: number;
  name: string;
  description: string;
  usersCount: number;
  type: 'Classique' | 'Transactionnelle' | 'Mixte';
  budget: number;
  status: 'active' | 'inactive';
  admin: string;
}

export default function GroupsView() {
  const { t, i18n } = useTranslation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [newGroup, setNewGroup] = useState({
    name: '',
    budget: '',
    type: 'Classique' as Group['type'],
    description: '',
    status: 'active' as Group['status'],
    selectedUsers: [] as number[]
  });

  const [allUsers, setAllUsers] = useState<{id: number, name: string, email: string}[]>([]);

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (Array.isArray(data)) {
        setAllUsers(data
          .filter(u => u.recordType === 'user' && u.id.startsWith('user-'))
          .map(u => ({
            id: parseInt(u.id.replace('user-', '')),
            name: u.name,
            email: u.email
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      setGroups((Array.isArray(data) ? data : []).map((g: any) => ({
        ...g,
        budget: parseFloat(g.budget || g.quota || 0),
        usersCount: parseInt(g.users_count || 0)
      })));
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.budget) return;

    try {
      const isEditing = editingGroupId !== null;
      const url = isEditing ? `/api/groups/${editingGroupId}` : '/api/groups';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description || 'Nouveau groupe',
          selectedUsers: newGroup.selectedUsers,
          type: newGroup.type,
          budget: parseFloat(newGroup.budget),
          status: newGroup.status,
          admin: 'Moi'
        })
      });

      if (response.ok) {
        fetchGroups();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving group:', error);
    }
  };

  const handleEditClick = (group: Group) => {
    setEditingGroupId(group.id);
    setNewGroup({
      name: group.name,
      budget: group.budget.toString(),
      type: group.type,
      description: group.description,
      status: group.status,
      selectedUsers: []
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGroupId(null);
    setNewGroup({ name: '', budget: '', type: 'Classique', description: '', status: 'active', selectedUsers: [] });
  };

  const deleteGroup = async (id: number) => {
    if (!confirm(t('groups.delete_confirm'))) return;
    try {
      await fetch(`/api/groups/${id}`, { method: 'DELETE' });
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setNewGroup(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBudget = groups.reduce((acc, g) => acc + g.budget, 0);
  const activeGroups = groups.filter(g => g.status === 'active').length;

  return (
    <div className="space-y-10 pb-16 font-sans">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Building2 className="text-primary w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t('common.management')}</span>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter">{t('groups.title')}</h1>
          <p className="text-on-surface-variant font-bold mt-2 text-lg">{t('groups.subtitle')}</p>
        </motion.div>
        
        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-3 bg-primary hover:bg-primary-container text-white px-8 py-5 rounded-[2rem] transition-all shadow-2xl shadow-primary/30 font-black uppercase tracking-widest text-sm group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          <span>{t('groups.add_btn')}</span>
        </motion.button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label={t('groups.total_groups')}
          value={groups.length.toString()}
          icon={Users}
          trend={{ value: "+12%", up: true }}
          color="blue"
        />
        <StatCard 
          label={t('groups.active_groups')}
          value={activeGroups.toString()}
          icon={ShieldCheck}
          trend={{ value: "Stable", up: true }}
          color="green"
        />
        <StatCard 
          label={t('groups.total_budget')}
          value={`${formatNumber(totalBudget)} DT`}
          icon={Zap}
          trend={{ value: "+5%", up: true }}
          color="orange"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8">
        <Card className="p-5 md:p-6 border-outline-variant/10 shadow-xl shadow-surface-variant/5 bg-white/80 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder={t('groups.search_placeholder')}
                className="w-full pl-14 pr-6 py-5 bg-surface-container/30 border-2 border-transparent focus:border-primary focus:bg-white rounded-[1.5rem] text-on-surface font-black text-lg transition-all outline-none placeholder:text-outline-variant"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button className="flex items-center space-x-3 px-8 py-5 bg-white border-2 border-outline-variant/10 rounded-[1.5rem] text-sm font-black text-on-surface-variant hover:bg-surface-container transition-all uppercase tracking-widest hover:border-primary/20">
                <Filter className="w-5 h-5" />
                <span>{t('common.filter')}</span>
              </button>
              <button className="p-5 bg-white border-2 border-outline-variant/10 rounded-[1.5rem] text-outline hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                 <LayoutGrid className="w-6 h-6" />
              </button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/60 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-surface-container/20 border-b border-outline-variant/10">
                  <th className="px-10 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em]">{t('groups.label_col')}</th>
                  <th className="px-10 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em]">{t('groups.users_col')}</th>
                  <th className="px-10 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em]">{t('groups.type_col')}</th>
                  <th className="px-10 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em]">{t('groups.budget_col')}</th>
                  <th className="px-10 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em]">{t('groups.status_col')}</th>
                  <th className="px-10 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em] text-right rtl:text-left">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-10 py-20 text-center">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-10 py-20 text-center">
                      <p className="text-xl font-black text-on-surface-variant/40 uppercase tracking-widest">{t('common.no_data')}</p>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((group) => (
                    <motion.tr 
                      key={group.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-primary/5 transition-all group/row"
                    >
                      <td className="px-10 py-8">
                        <div>
                          <div className="font-black text-on-surface text-xl tracking-tighter group-hover/row:text-primary transition-colors">{group.name}</div>
                          <div className="text-sm font-bold text-on-surface-variant/50 mt-1.5 uppercase tracking-wide">{group.description}</div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                           <div className="w-12 h-12 rounded-[1.25rem] bg-surface-container flex items-center justify-center text-lg font-black text-primary border-2 border-outline-variant/5 shadow-inner">
                             {group.usersCount}
                           </div>
                           <span className="text-xs font-black text-on-surface-variant uppercase tracking-[0.1em]">{t('common.users')}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={cn(
                          "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border-2",
                          group.type === 'Classique' ? "bg-amber-50 text-amber-700 border-amber-200/50" :
                          group.type === 'Transactionnelle' ? "bg-blue-50 text-blue-700 border-blue-200/50" :
                          "bg-purple-50 text-purple-700 border-purple-200/50"
                        )}>
                          {group.type}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-end space-x-1.5 font-black text-on-surface text-2xl tracking-tighter">
                           <span>{formatNumber(group.budget)}</span>
                           <span className="text-xs text-on-surface-variant uppercase tracking-widest font-black mb-1.5">DT</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center">
                          <div className={cn(
                            "w-3 h-3 rounded-full mr-3 rtl:ml-3 rtl:mr-0 shadow-sm",
                            group.status === 'active' ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-outline/30"
                          )} />
                          <span className="text-xs font-black text-on-surface uppercase tracking-[0.2em]">
                            {group.status === 'active' ? t('common.active') : t('common.inactive')}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right rtl:text-left">
                        <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse opacity-0 group-hover/row:opacity-100 transition-all scale-90 group-hover/row:scale-100">
                          <button className="p-4 text-outline hover:text-primary hover:bg-white rounded-[1.25rem] transition-all shadow-lg shadow-on-surface/5 border-2 border-transparent hover:border-outline-variant/10" title={t('common.history')}>
                            <History className="w-6 h-6" />
                          </button>
                          <button 
                            onClick={() => handleEditClick(group)}
                            className="p-4 text-outline hover:text-blue-600 hover:bg-white rounded-[1.25rem] transition-all shadow-lg shadow-on-surface/5 border-2 border-transparent hover:border-outline-variant/10" title={t('common.edit')}>
                            <Edit2 className="w-6 h-6" />
                          </button>
                          <button 
                            onClick={() => deleteGroup(group.id)}
                            className="p-4 text-outline hover:text-rose-600 hover:bg-white rounded-[1.25rem] transition-all shadow-lg shadow-on-surface/5 border-2 border-transparent hover:border-outline-variant/10" title={t('common.delete')}>
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

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
              className="relative w-full max-w-3xl bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20"
            >
              <div className="p-12 pb-8 border-b border-outline-variant/10 bg-surface-container/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl font-black text-on-surface tracking-tighter">
                      {editingGroupId ? t('groups.edit_title') : t('groups.add_title')}
                    </h2>
                    <p className="text-lg font-bold text-on-surface-variant/60 mt-2 uppercase tracking-wide">{t('groups.modal_subtitle')}</p>
                  </div>
                  <button onClick={closeModal} className="text-outline hover:text-rose-500 bg-white p-5 rounded-[2rem] shadow-xl border border-outline-variant/20 transition-all hover:rotate-90">
                    <X className="w-8 h-8" />
                  </button>
                </div>
              </div>
              
              <div className="p-12 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-10">
                  <div className="col-span-2 md:col-span-1 space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('groups.form_name')}</label>
                    <input 
                      type="text" 
                      className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg" 
                      placeholder="ex: Marketing Automne"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1 space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('common.status')}</label>
                    <div className="flex items-center space-x-5 rtl:space-x-reverse bg-surface-container rounded-[2rem] p-3">
                      <button 
                        onClick={() => setNewGroup({...newGroup, status: 'active'})}
                        className={cn(
                          "flex-1 py-4 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest",
                          newGroup.status === 'active' ? "bg-white text-emerald-600 shadow-xl" : "text-outline hover:text-on-surface"
                        )}
                      >
                        {t('common.active')}
                      </button>
                      <button 
                        onClick={() => setNewGroup({...newGroup, status: 'inactive'})}
                        className={cn(
                          "flex-1 py-4 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest",
                          newGroup.status === 'inactive' ? "bg-white text-on-surface shadow-xl" : "text-outline hover:text-on-surface"
                        )}
                      >
                        {t('common.inactive')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('groups.form_budget')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full pl-8 pr-16 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-2xl tracking-tighter" 
                        placeholder="0.00"
                        value={newGroup.budget}
                        onChange={(e) => setNewGroup({...newGroup, budget: e.target.value})}
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-black text-outline uppercase tracking-widest">DT</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('groups.form_type')}</label>
                    <select 
                      className="w-full px-8 py-6.5 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg"
                      value={newGroup.type}
                      onChange={(e) => setNewGroup({...newGroup, type: e.target.value as Group['type']})}
                    >
                      <option value="Classique">Classique</option>
                      <option value="Transactionnelle">Transactionnelle</option>
                      <option value="Mixte">Mixte</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em]">{t('groups.form_users')}</label>
                    <button 
                      onClick={() => setNewGroup({...newGroup, selectedUsers: allUsers.map(u => u.id)})}
                      className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      {t('common.select_all')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container/30 p-8 rounded-[3rem] border-2 border-outline-variant/10 max-h-72 overflow-y-auto custom-scrollbar shadow-inner">
                    {allUsers.map(user => (
                      <label key={user.id} className="flex items-center space-x-5 rtl:space-x-reverse p-5 rounded-[1.75rem] bg-white/50 hover:bg-white transition-all cursor-pointer border-2 border-transparent hover:border-primary/20 shadow-sm group/user">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-xl text-primary focus:ring-primary border-outline-variant/30 transition-all group-hover/user:scale-110"
                          checked={newGroup.selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-lg font-black text-on-surface truncate tracking-tight">{user.name}</span>
                          <span className="text-[11px] font-bold text-on-surface-variant/40 truncate uppercase tracking-widest mt-0.5">{user.email}</span>
                        </div>
                      </label>
                    ))}
                    {allUsers.length === 0 && (
                      <div className="col-span-2 text-center py-12">
                        <AlertCircle className="w-12 h-12 text-outline/20 mx-auto mb-4" />
                        <p className="text-lg font-black text-on-surface-variant/30 uppercase tracking-widest">{t('groups.no_users')}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-black text-primary uppercase tracking-[0.25em] text-center bg-primary/5 py-3 rounded-full border border-primary/10">
                    {newGroup.selectedUsers.length} {t('groups.users_selected')}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('groups.form_desc')}</label>
                  <textarea 
                    className="w-full px-8 py-6 rounded-[2.5rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none h-40 resize-none font-bold text-lg" 
                    placeholder={t('groups.form_desc_placeholder')}
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-12 bg-surface-container/20 border-t border-outline-variant/10 flex gap-6">
                <button 
                  onClick={closeModal}
                  className="flex-1 px-10 py-6 rounded-[2rem] border-2 border-outline-variant/30 text-on-surface font-black uppercase tracking-widest text-sm hover:bg-white transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={handleCreateGroup}
                  disabled={!newGroup.name || !newGroup.budget}
                  className="flex-1 px-10 py-6 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_-10px_rgba(var(--color-primary),0.3)] hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingGroupId ? t('common.save') : t('groups.create_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
