import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  Square, 
  BarChart3, 
  MoreVertical,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Trash2,
  X
} from 'lucide-react';
import { Card } from '../components/ui/Cards';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Campaign {
  id: number;
  name: string;
  type: 'Classique' | 'Transactionnelle';
  status: 'Planifiée' | 'En cours' | 'Clôturée' | 'À valider' | 'Erreur';
  startDate: string;
  contactsCount: number;
  deliveredCount: number;
  group: string;
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 1, name: 'Offre Bienvenue Q2', type: 'Classique', status: 'En cours', startDate: '2026-04-25T10:00:00Z', contactsCount: 5000, deliveredCount: 3200, group: 'Marketing' },
  { id: 2, name: 'OTP Login Service', type: 'Transactionnelle', status: 'En cours', startDate: '2026-04-01T00:00:00Z', contactsCount: 15400, deliveredCount: 15380, group: 'Support' },
  { id: 3, name: 'Maintenance Système', type: 'Classique', status: 'Planifiée', startDate: '2026-04-26T08:00:00Z', contactsCount: 120, deliveredCount: 0, group: 'IT' },
  { id: 4, name: 'Flash Sale Vendredi', type: 'Classique', status: 'Clôturée', startDate: '2026-04-20T14:30:00Z', contactsCount: 8500, deliveredCount: 8420, group: 'Marketing' },
  { id: 5, name: 'Validation Inscription', type: 'Transactionnelle', status: 'À valider', startDate: '', contactsCount: 0, deliveredCount: 0, group: 'Admin' },
];

const StatusBadge = ({ status }: { status: Campaign['status'] }) => {
  const styles = {
    'Planifiée': 'bg-blue-50 text-blue-600 border-blue-100',
    'En cours': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Clôturée': 'bg-slate-50 text-slate-600 border-slate-100',
    'À valider': 'bg-amber-50 text-amber-600 border-amber-100',
    'Erreur': 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", styles[status])}>
      {status}
    </span>
  );
};

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [groups, setGroups] = useState<{id: number, name: string}[]>([]);
  const [templates, setTemplates] = useState<{id: number, name: string}[]>([]);

  // Form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'Classique' as Campaign['type'],
    groupId: '',
    templateId: '',
    startDate: '',
    startTime: ''
  });

  useEffect(() => {
    fetchCampaigns();
    fetchGroupsAndTemplates();
  }, []);

  const fetchGroupsAndTemplates = async () => {
    try {
      const [groupsRes, templatesRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/templates')
      ]);
      const groupsData = await groupsRes.json();
      const templatesData = await templatesRes.json();
      
      const parsedGroups = Array.isArray(groupsData) ? groupsData : [];
      const parsedTemplates = Array.isArray(templatesData) ? templatesData : [];
      
      setGroups(parsedGroups);
      setTemplates(parsedTemplates);
      
      setNewCampaign(prev => ({
        ...prev,
        groupId: parsedGroups.length > 0 ? String(parsedGroups[0].id) : '',
        templateId: parsedTemplates.length > 0 ? String(parsedTemplates[0].id) : ''
      }));
    } catch (error) {
      console.error('Error fetching groups/templates:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns((Array.isArray(data) ? data : []).map((c: any) => ({
        ...c,
        startDate: c.start_date,
        contactsCount: c.contacts_count,
        deliveredCount: c.delivered_count,
        group: c.group_name || 'Aucun groupe'
      })));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.groupId) return;

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaign.name,
          type: newCampaign.type,
          status: newCampaign.startDate ? 'Planifiée' : 'À valider',
          start_date: newCampaign.startDate ? `${newCampaign.startDate}T${newCampaign.startTime || '00:00'}:00Z` : null,
          contacts_count: 0,
          delivered_count: 0,
          group_id: parseInt(newCampaign.groupId),
          modele_id: newCampaign.templateId ? parseInt(newCampaign.templateId) : null
        })
      });

      if (response.ok) {
        fetchCampaigns();
        setIsModalOpen(false);
        setNewCampaign({ 
          name: '', 
          type: 'Classique', 
          groupId: groups.length > 0 ? String(groups[0].id) : '', 
          templateId: templates.length > 0 ? String(templates[0].id) : '', 
          startDate: '', 
          startTime: '' 
        });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return campaign.status === 'En cours';
    if (activeTab === 'scheduled') return campaign.status === 'Planifiée';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestion des Campagnes</h1>
          <p className="text-slate-500 text-sm mt-1">Planifiez et suivez l'exécution de vos envois en masse.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all font-display"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvelle Campagne</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {['all', 'active', 'scheduled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize",
              activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab === 'all' ? 'Toutes' : tab === 'active' ? 'En cours' : 'Planifiées'}
          </button>
        ))}
      </div>

      {/* Campaign List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="group hover:border-blue-200 transition-all duration-300">
            <div className="p-6 flex flex-col md:flex-row items-center gap-6">
              {/* Type Icon */}
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0",
                campaign.type === 'Classique' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
              )}>
                {campaign.type === 'Classique' ? <Layers className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="text-lg font-bold text-slate-900 truncate">
                    {campaign.name}
                  </h3>
                  <StatusBadge status={campaign.status} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                   <div className="flex items-center"><Layers className="w-4 h-4 mr-1.5 text-slate-300" /> {campaign.group}</div>
                   <div className="flex items-center"><Calendar className="w-4 h-4 mr-1.5 text-slate-300" /> {campaign.startDate ? formatDate(campaign.startDate) : 'Non planifiée'}</div>
                </div>
              </div>

              {/* Progress */}
              {campaign.contactsCount > 0 && (
                <div className="hidden lg:block w-48 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Progression</span>
                    <span className="text-xs font-bold text-slate-900">{Math.round((campaign.deliveredCount / campaign.contactsCount) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(campaign.deliveredCount / campaign.contactsCount) * 100}%` }}
                      className="h-full bg-blue-600 transition-all"
                    />
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    {campaign.deliveredCount} / {campaign.contactsCount} Contacts
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3 shrink-0">
                 <button className="flex items-center space-x-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all">
                    <BarChart3 className="w-4 h-4" />
                    <span>Stats</span>
                 </button>
                 <div className="w-px h-6 bg-slate-200 hidden md:block" />
                 <button 
                   onClick={() => deleteCampaign(campaign.id)}
                   className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                 >
                    <Trash2 className="w-5 h-5" />
                 </button>
                 <button className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <ArrowRight className="w-5 h-5" />
                 </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary View for Active */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-200">
            <h3 className="text-xl font-bold mb-4">Besoin d'attention</h3>
            <p className="text-blue-100 mb-6 text-sm">Ces campagnes nécessitent une validation manuelle avant exécution.</p>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center justify-between bg-white/10 p-3 rounded-2xl border border-white/10">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">A</div>
                      <div className="text-sm">
                        <p className="font-bold">Validation Inscription v2</p>
                        <p className="text-xs text-blue-200">Soumis il y a 2h</p>
                      </div>
                   </div>
                   <button className="px-4 py-1.5 bg-white text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50">Valider</button>
                </div>
              ))}
            </div>
         </Card>

         <Card className="p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 font-display">Taux de succès global</h3>
            <div className="flex items-end justify-between mb-4">
               <div>
                  <div className="text-4xl font-black text-slate-900 tracking-tighter">98.2%</div>
                  <p className="text-sm text-slate-500 font-medium">Taux moyen de livraison SMS</p>
               </div>
               <div className="text-emerald-500 flex items-center text-sm font-bold">
                 <TrendingUp className="w-4 h-4 mr-1" /> +2.4%
               </div>
            </div>
            <div className="flex gap-1 h-32 items-end">
               {[40, 70, 45, 90, 65, 80, 55, 100, 75, 85].map((h, i) => (
                 <div key={i} className="flex-1 bg-blue-100 rounded-t-lg relative group transition-all hover:bg-blue-600" style={{ height: `${h}%` }}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}%
                    </div>
                 </div>
               ))}
            </div>
         </Card>
      </div>

      {/* Create Modal */}
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
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Nouvelle Campagne</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Libellé de la campagne *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
                    placeholder="ex: Promo Printemps 2026"
                    value={newCampaign.name}
                    onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Type de campagne</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      value={newCampaign.type}
                      onChange={e => setNewCampaign({...newCampaign, type: e.target.value as any})}
                    >
                      <option value="Classique">Classique (Marketing)</option>
                      <option value="Transactionnelle">Transactionnelle (OTP, Alertes)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Groupe destinataire</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      value={newCampaign.groupId}
                      onChange={e => setNewCampaign({...newCampaign, groupId: e.target.value})}
                    >
                      {groups.length === 0 ? (
                        <option value="" disabled>Aucun groupe disponible</option>
                      ) : (
                        groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Modèle de message</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    value={newCampaign.templateId}
                    onChange={e => setNewCampaign({...newCampaign, templateId: e.target.value})}
                  >
                    {templates.length === 0 ? (
                      <option value="" disabled>Aucun modèle disponible</option>
                    ) : (
                      <>
                        <option value="">Sélectionnez un modèle (Optionnel)</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    Planification (Optionnel)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Date</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={newCampaign.startDate}
                        onChange={e => setNewCampaign({...newCampaign, startDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Heure</label>
                      <input 
                        type="time" 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={newCampaign.startTime}
                        onChange={e => setNewCampaign({...newCampaign, startTime: e.target.value})}
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-400 italic">Si aucune date n'est renseignée, le message sera envoyé à validation manuelle.</p>
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-white transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleCreateCampaign}
                  disabled={!newCampaign.name}
                  className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  Créer la Campagne
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
