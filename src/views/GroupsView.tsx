import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ToggleLeft as Toggle, 
  History,
  TrendingUp,
  LayoutGrid,
  X
} from 'lucide-react';
import { Card } from '../components/ui/Cards';
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

const INITIAL_GROUPS: Group[] = [
  { id: 1, name: 'Marketing', description: 'Campagnes promotionnelles automne', usersCount: 12, type: 'Classique', budget: 5000, status: 'active', admin: 'Sarah J.' },
  { id: 2, name: 'Support Client', description: 'Notifications automatiques tickets', usersCount: 5, type: 'Transactionnelle', budget: 2000, status: 'active', admin: 'Karim B.' },
  { id: 3, name: 'Alertes Système', description: 'Alertes techniques critiques', usersCount: 3, type: 'Mixte', budget: 1000, status: 'inactive', admin: 'Amal M.' },
  { id: 4, name: 'Ventes', description: 'Prospection directe', usersCount: 8, type: 'Classique', budget: 3500, status: 'active', admin: 'Sarah J.' },
];

const MOCK_USERS = [
  { id: 1, name: 'Amal Mahdhi', email: 'amal@easybulk.tn' },
  { id: 2, name: 'Karim Ben Ali', email: 'karim@marketing.tn' },
  { id: 3, name: 'Sarah Jellouli', email: 'sarah@ops.tn' },
  { id: 4, name: 'Mehdi K.', email: 'm.k@test.com' },
  { id: 5, name: 'Ahmed B.', email: 'ahmed@test.com' },
];

export default function GroupsView() {
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
        // Only get actual users, map to needed format
        // 'user-1' -> 1
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
      selectedUsers: [] // In a real app we'd fetch linked users
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGroupId(null);
    setNewGroup({ name: '', budget: '', type: 'Classique', description: '', status: 'active', selectedUsers: [] });
  };

  const deleteGroup = async (id: number) => {
    if (!confirm('Supprimer ce groupe ?')) return;
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

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestion des Groupes</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos entités, budgets et autorisations de campagne.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200 font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>Ajouter un groupe</span>
        </button>
      </div>

      {/* Filters Card */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher un groupe..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filtrer</span>
            </button>
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600">
               <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>

      {/* Groups Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Libellé Groupe</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Utilisateurs</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredGroups.map((group) => (
                <motion.tr 
                  key={group.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-bold text-slate-800">{group.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{group.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-white">
                         {group.usersCount}
                       </div>
                       <span className="text-sm font-medium text-slate-600">utilisateurs</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      group.type === 'Classique' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      group.type === 'Transactionnelle' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                      "bg-purple-50 text-purple-600 border border-purple-100"
                    )}>
                      {group.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 font-bold text-slate-700">
                       <span>{formatNumber(group.budget)}</span>
                       <span className="text-[10px] text-slate-400">DT</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full mr-2",
                        group.status === 'active' ? "bg-emerald-500 shadow-lg shadow-emerald-200" : "bg-slate-300"
                      )} />
                      <span className="text-sm font-medium text-slate-600">
                        {group.status === 'active' ? 'Activé' : 'Inactif'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Historique">
                        <History className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditClick(group)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Modifier">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteGroup(group.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Group Modal (Simplified Simulation) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingGroupId ? 'Modifier le groupe' : 'Ajouter un nouveau groupe'}
                  </h2>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-xl">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Libellé du groupe *</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
                      placeholder="ex: Marketing Automne"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Statut</label>
                    <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <button 
                        onClick={() => setNewGroup({...newGroup, status: 'active'})}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                          newGroup.status === 'active' ? "bg-emerald-500 text-white shadow-md shadow-emerald-100" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Activé
                      </button>
                      <button 
                        onClick={() => setNewGroup({...newGroup, status: 'inactive'})}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                          newGroup.status === 'inactive' ? "bg-slate-400 text-white shadow-md shadow-slate-100" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        Inactif
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Budget Initial *</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                        placeholder="0.00"
                        value={newGroup.budget}
                        onChange={(e) => setNewGroup({...newGroup, budget: e.target.value})}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">DT</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Type *</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                      value={newGroup.type}
                      onChange={(e) => setNewGroup({...newGroup, type: e.target.value as Group['type']})}
                    >
                      <option>Classique</option>
                      <option>Transactionnelle</option>
                      <option>Mixte</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Sélectionner les utilisateurs</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                    {allUsers.map(user => (
                      <label key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-100">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          checked={newGroup.selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                          <span className="text-[10px] text-slate-400">{user.email}</span>
                        </div>
                      </label>
                    ))}
                    {allUsers.length === 0 && (
                      <div className="col-span-2 text-center text-sm text-slate-400 py-4">Aucun utilisateur trouvé.</div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                    <span>{newGroup.selectedUsers.length} utilisateurs sélectionnés</span>
                    <button 
                      onClick={() => setNewGroup({...newGroup, selectedUsers: allUsers.map(u => u.id)})}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Tout sélectionner
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none h-20 resize-none" 
                    placeholder="Détails du groupe..."
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="p-8 bg-slate-50 flex gap-3">
                <button 
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleCreateGroup}
                  disabled={!newGroup.name || !newGroup.budget}
                  className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingGroupId ? 'Enregistrer les modifications' : 'Créer le groupe'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
