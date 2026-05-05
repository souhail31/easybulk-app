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
  X,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

const StatusBadge = ({ status }: { status: Campaign['status'] }) => {
  const { t } = useTranslation();
  const styles = {
    'Planifiée': 'bg-blue-50 text-blue-700 border-blue-200/50',
    'En cours': 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    'Clôturée': 'bg-surface-container text-on-surface-variant border-outline-variant/20',
    'À valider': 'bg-amber-50 text-amber-700 border-amber-200/50',
    'Erreur': 'bg-rose-50 text-rose-700 border-rose-200/50',
  };

  return (
    <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border-2", styles[status])}>
      {status}
    </span>
  );
};

export default function CampaignsView() {
  const { t } = useTranslation();
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
    if (!confirm(t('common.delete_confirm'))) return;
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
    <div className="space-y-10 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Send className="text-primary w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t('common.management')}</span>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter">{t('campaigns.title')}</h1>
          <p className="text-on-surface-variant font-bold mt-2 text-lg">{t('campaigns.subtitle')}</p>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-3 bg-primary text-white px-8 py-5 rounded-[2rem] transition-all shadow-2xl shadow-primary/30 font-black uppercase tracking-widest text-sm group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          <span>{t('campaigns.add_btn')}</span>
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 bg-surface-container/30 p-2 rounded-[2rem] w-fit border-2 border-outline-variant/10">
        {['all', 'active', 'scheduled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "px-8 py-3.5 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-[0.15em]",
              activeTab === tab 
                ? "bg-white text-primary shadow-xl shadow-on-surface/5" 
                : "text-outline hover:text-on-surface"
            )}
          >
            {t(`campaigns.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Campaign List */}
      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          <div className="py-20 text-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="py-20 text-center text-xl font-black text-on-surface-variant/30 uppercase tracking-widest">{t('common.no_data')}</div>
        ) : (
          filteredCampaigns.map((campaign) => (
            <motion.div
              layout
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="group hover:border-primary/30 transition-all duration-500 shadow-xl shadow-surface-variant/5 bg-white/60 backdrop-blur-md overflow-hidden">
                <div className="p-8 flex flex-col lg:flex-row items-center gap-10">
                  {/* Type Icon */}
                  <div className={cn(
                    "w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner border-4 border-white",
                    campaign.type === 'Classique' ? "bg-primary/5 text-primary" : "bg-secondary/5 text-secondary"
                  )}>
                    {campaign.type === 'Classique' ? <Layers className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <h3 className="text-2xl font-black text-on-surface tracking-tighter group-hover:text-primary transition-colors">
                        {campaign.name}
                      </h3>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-xs font-black uppercase tracking-widest text-on-surface-variant/50">
                       <div className="flex items-center"><Layers className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary" /> {campaign.group}</div>
                       <div className="flex items-center"><Calendar className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary" /> {campaign.startDate ? formatDate(campaign.startDate) : '---'}</div>
                    </div>
                  </div>

                  {/* Progress */}
                  {campaign.contactsCount > 0 && (
                    <div className="w-full lg:w-64 shrink-0 space-y-4">
                      <div className="flex items-end justify-between">
                        <span className="text-[10px] font-black text-outline uppercase tracking-widest">{t('campaigns.progression')}</span>
                        <span className="text-xl font-black text-on-surface tracking-tighter">{Math.round((campaign.deliveredCount / campaign.contactsCount) * 100)}%</span>
                      </div>
                      <div className="h-4 bg-surface-container rounded-full overflow-hidden p-1 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(campaign.deliveredCount / campaign.contactsCount) * 100}%` }}
                          className="h-full bg-primary rounded-full transition-all shadow-sm"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-outline">
                        <span>{campaign.deliveredCount} {t('campaigns.stats.delivered')}</span>
                        <span>{campaign.contactsCount} {t('common.users')}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-4 rtl:space-x-reverse shrink-0">
                     <button className="flex items-center space-x-3 px-6 py-4 bg-white border-2 border-outline-variant/10 rounded-[1.5rem] text-xs font-black text-on-surface-variant hover:bg-surface-container transition-all uppercase tracking-widest shadow-sm">
                        <BarChart3 className="w-5 h-5" />
                        <span>{t('common.stats')}</span>
                     </button>
                     <div className="w-px h-10 bg-outline-variant/20 hidden lg:block" />
                     <button 
                       onClick={() => deleteCampaign(campaign.id)}
                       className="p-4 text-outline hover:text-rose-600 hover:bg-white rounded-[1.5rem] transition-all shadow-sm border-2 border-transparent hover:border-outline-variant/10"
                     >
                        <Trash2 className="w-6 h-6" />
                     </button>
                     <button className="w-14 h-14 rounded-[1.5rem] bg-primary/5 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/10 border-2 border-primary/10">
                        <ArrowRight className="w-7 h-7" />
                     </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="p-10 bg-gradient-to-br from-primary to-primary-container text-white border-none shadow-[0_30px_60px_-15px_rgba(var(--color-primary),0.3)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <h3 className="text-3xl font-black tracking-tighter mb-4">{t('campaigns.needs_attention')}</h3>
            <p className="text-primary-container-highest font-bold mb-8 text-lg opacity-80">{t('campaigns.needs_attention_sub')}</p>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center justify-between bg-white/10 p-5 rounded-[2rem] border border-white/10 backdrop-blur-md">
                   <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="w-12 h-12 rounded-[1.25rem] bg-white/20 flex items-center justify-center font-black">A</div>
                      <div className="min-w-0">
                        <p className="font-black truncate tracking-tight text-lg">Promo Flash v{i}</p>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Soumis il y a {i}h</p>
                      </div>
                   </div>
                   <button className="px-6 py-3 bg-white text-primary text-xs font-black rounded-2xl hover:bg-primary-container hover:text-white transition-all uppercase tracking-widest shadow-xl">{t('campaigns.validate')}</button>
                </div>
              ))}
            </div>
         </Card>

         <Card className="p-10 border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/80 backdrop-blur-xl">
            <h3 className="text-2xl font-black text-on-surface tracking-tighter mb-6">{t('campaigns.global_success')}</h3>
            <div className="flex items-end justify-between mb-8">
               <div>
                  <div className="text-6xl font-black text-on-surface tracking-tighter">98.2%</div>
                  <p className="text-sm font-bold text-on-surface-variant/60 uppercase tracking-widest mt-2">{t('campaigns.global_success_sub')}</p>
               </div>
               <div className="text-emerald-500 flex items-center text-sm font-black bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                 <TrendingUp className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" /> +2.4%
               </div>
            </div>
            <div className="flex gap-2 h-40 items-end">
               {[40, 70, 45, 90, 65, 80, 55, 100, 75, 85].map((h, i) => (
                 <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className="flex-1 bg-primary/10 rounded-t-2xl relative group transition-all hover:bg-primary"
                 >
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                      {h}%
                    </div>
                 </motion.div>
               ))}
            </div>
         </Card>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-on-surface/60 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 50 }}
              className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-3xl overflow-hidden border border-white/20"
            >
              <div className="p-12 pb-8 border-b border-outline-variant/10 bg-surface-container/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-black text-on-surface tracking-tighter">{t('campaigns.add_title')}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-outline hover:text-rose-500 bg-white p-5 rounded-[2rem] shadow-xl border border-outline-variant/20 transition-all hover:rotate-90">
                    <X className="w-8 h-8" />
                  </button>
                </div>
              </div>
              
              <div className="p-12 space-y-10 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('campaigns.form_label')}</label>
                  <input 
                    type="text" 
                    className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg" 
                    placeholder="ex: Promo Printemps 2026"
                    value={newCampaign.name}
                    onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('campaigns.form_type')}</label>
                    <select 
                      className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg"
                      value={newCampaign.type}
                      onChange={e => setNewCampaign({...newCampaign, type: e.target.value as any})}
                    >
                      <option value="Classique">Classique (Marketing)</option>
                      <option value="Transactionnelle">Transactionnelle (OTP, Alertes)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('campaigns.form_group')}</label>
                    <select 
                      className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg"
                      value={newCampaign.groupId}
                      onChange={e => setNewCampaign({...newCampaign, groupId: e.target.value})}
                    >
                      {groups.length === 0 ? (
                        <option value="" disabled>Aucun groupe</option>
                      ) : (
                        groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('campaigns.form_template')}</label>
                  <select 
                    className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg"
                    value={newCampaign.templateId}
                    onChange={e => setNewCampaign({...newCampaign, templateId: e.target.value})}
                  >
                    {templates.length === 0 ? (
                      <option value="" disabled>Aucun modèle</option>
                    ) : (
                      <>
                        <option value="">{t('campaigns.form_template_placeholder')}</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div className="pt-8 border-t border-outline-variant/10">
                  <h4 className="text-lg font-black text-on-surface mb-6 flex items-center">
                    <Calendar className="w-6 h-6 mr-3 rtl:ml-3 rtl:mr-0 text-primary" />
                    {t('campaigns.planning')}
                  </h4>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('campaigns.date')}</label>
                      <input 
                        type="date" 
                        className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg"
                        value={newCampaign.startDate}
                        onChange={e => setNewCampaign({...newCampaign, startDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('campaigns.time')}</label>
                      <input 
                        type="time" 
                        className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg"
                        value={newCampaign.startTime}
                        onChange={e => setNewCampaign({...newCampaign, startTime: e.target.value})}
                      />
                    </div>
                  </div>
                  <p className="mt-6 text-sm font-bold text-on-surface-variant/40 italic text-center uppercase tracking-widest">{t('campaigns.planning_hint')}</p>
                </div>
              </div>

              <div className="p-12 bg-surface-container/20 border-t border-outline-variant/10 flex gap-6">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-10 py-6 rounded-[2rem] border-2 border-outline-variant/30 text-on-surface font-black uppercase tracking-widest text-sm hover:bg-white transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={handleCreateCampaign}
                  disabled={!newCampaign.name}
                  className="flex-1 px-10 py-6 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all disabled:opacity-50"
                >
                  {t('campaigns.create_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
