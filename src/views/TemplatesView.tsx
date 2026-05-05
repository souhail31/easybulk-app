import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Type, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Cards';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Template {
  id: number;
  name: string;
  type: string;
  content: string;
  status: boolean;
}

const TemplatesView = () => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'Classique',
    content: '',
    status: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const normalizeTemplate = (template: any): Template => ({
    id: Number(template?.id ?? 0),
    name: template?.name ?? 'Modele sans titre',
    type: template?.type ?? 'Classique',
    content: template?.content ?? '',
    status: Boolean(template?.status)
  });

  const fetchTemplates = async () => {
    try {
      setErrorMessage('');
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(Array.isArray(data) ? data.map(normalizeTemplate) : []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
      setErrorMessage(t('common.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) return;

    try {
      setIsSaving(true);
      setErrorMessage('');
      const isEditing = editingTemplate !== null;
      const url = isEditing ? `/api/templates/${editingTemplate.id}` : '/api/templates';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(result?.error || t('templates.error_save'));
        return;
      }

      await fetchTemplates();
      closeModal();
    } catch (error) {
      console.error('Error saving template:', error);
      setErrorMessage(t('templates.error_save'));
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (tpl: Template) => {
    setEditingTemplate(tpl);
    setNewTemplate({
      name: tpl.name,
      type: tpl.type,
      content: tpl.content,
      status: tpl.status
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setErrorMessage('');
    setNewTemplate({ name: '', type: 'Classique', content: '', status: true });
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm(t('common.delete_confirm'))) return;
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const toggleTemplateStatus = async (tpl: Template) => {
    try {
       await fetch(`/api/templates/${tpl.id}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ...tpl, status: !tpl.status })
       });
       fetchTemplates();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

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
              <FileText className="text-primary w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t('common.management')}</span>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter">{t('templates.title')}</h1>
          <p className="text-on-surface-variant font-bold mt-2 text-lg">{t('templates.subtitle')}</p>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-3 bg-primary text-white px-8 py-5 rounded-[2rem] transition-all shadow-2xl shadow-primary/30 font-black uppercase tracking-widest text-sm group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          <span>{t('templates.add_btn')}</span>
        </motion.button>
      </div>

      {errorMessage && !isModalOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border-2 border-rose-200/50 bg-rose-50 px-8 py-4 text-sm font-black text-rose-700 flex items-center space-x-4 uppercase tracking-widest"
        >
          <AlertCircle className="w-6 h-6" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : templates.length === 0 ? (
          <div className="col-span-full py-20 text-center text-xl font-black text-on-surface-variant/30 uppercase tracking-widest">{t('common.no_data')}</div>
        ) : (
          templates.map(tpl => (
            <motion.div
              layout
              key={tpl.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="p-8 flex flex-col h-full bg-white/60 backdrop-blur-md border-outline-variant/10 hover:border-primary/30 transition-all duration-500 shadow-xl shadow-surface-variant/5 group rounded-[2.5rem]">
                 <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                      "p-4 rounded-[1.5rem] shadow-inner",
                      tpl.type === 'Classique' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                    )}>
                      <Type className="w-8 h-8" />
                    </div>
                    <button 
                      onClick={() => toggleTemplateStatus(tpl)}
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-all duration-500 relative",
                        tpl.status ? "bg-emerald-500 shadow-lg shadow-emerald-100" : "bg-outline-variant/30"
                      )} 
                    >
                      <motion.div 
                        animate={{ x: tpl.status ? 24 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm" 
                      />
                    </button>
                 </div>
                 
                 <h3 className="text-xl font-black text-on-surface mb-2 group-hover:text-primary transition-colors tracking-tight">{tpl.name}</h3>
                 <div className="flex items-center space-x-2 mb-6 rtl:space-x-reverse">
                   <span className="text-[10px] font-black text-outline uppercase tracking-widest bg-surface-container/50 px-3 py-1 rounded-full border border-outline-variant/10">{tpl.type}</span>
                 </div>
                 
                 <div className="flex-1 p-6 bg-surface-container/30 rounded-[1.5rem] border border-outline-variant/10 italic text-on-surface-variant font-bold text-sm mb-8 relative group/content">
                   <div className="absolute top-4 left-4 opacity-10"><FileText className="w-10 h-10" /></div>
                   <p className="relative z-10 leading-relaxed">"{tpl.content}"</p>
                 </div>

                 <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-6 border-t border-outline-variant/10">
                    <button 
                      onClick={() => openEditModal(tpl)}
                      className="p-4 text-outline hover:text-primary hover:bg-white rounded-[1.25rem] transition-all shadow-sm border-2 border-transparent hover:border-outline-variant/10"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteTemplate(tpl.id)}
                      className="p-4 text-outline hover:text-rose-600 hover:bg-white rounded-[1.25rem] transition-all shadow-sm border-2 border-transparent hover:border-outline-variant/10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

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
              className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-3xl overflow-hidden border border-white/20"
            >
              <div className="p-12 pb-8 border-b border-outline-variant/10 bg-surface-container/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-black text-on-surface tracking-tighter">
                    {editingTemplate ? t('templates.edit_title') : t('templates.add_title')}
                  </h2>
                  <button onClick={closeModal} className="text-outline hover:text-rose-500 bg-white p-5 rounded-[2rem] shadow-xl border border-outline-variant/20 transition-all hover:rotate-90">
                    <X className="w-8 h-8" />
                  </button>
                </div>
              </div>
              
              <div className="p-12 space-y-10 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {errorMessage && (
                  <div className="rounded-[2rem] border-2 border-rose-200/50 bg-rose-50 px-8 py-4 text-sm font-black text-rose-700 flex items-center space-x-4 uppercase tracking-widest">
                    <AlertCircle className="w-6 h-6" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-10">
                  <div className="col-span-2 space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('templates.form_name')}</label>
                    <input 
                      type="text" 
                      className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg" 
                      placeholder="ex: Message de bienvenue"
                      value={newTemplate.name}
                      onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('templates.form_type')}</label>
                    <select 
                      className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg"
                      value={newTemplate.type}
                      onChange={e => setNewTemplate({...newTemplate, type: e.target.value})}
                    >
                      <option value="Classique">Classique</option>
                      <option value="Transactionnelle">Transactionnelle</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('common.status')}</label>
                    <div className="flex items-center space-x-4 rtl:space-x-reverse bg-surface-container rounded-[2rem] p-2">
                      <button 
                        onClick={() => setNewTemplate({...newTemplate, status: true})}
                        className={cn(
                          "flex-1 py-4 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest",
                          newTemplate.status ? "bg-white text-primary shadow-xl" : "text-outline"
                        )}
                      >
                        {t('common.active')}
                      </button>
                      <button 
                        onClick={() => setNewTemplate({...newTemplate, status: false})}
                        className={cn(
                          "flex-1 py-4 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest",
                          !newTemplate.status ? "bg-white text-rose-600 shadow-xl" : "text-outline"
                        )}
                      >
                        {t('common.inactive')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('templates.form_content')}</label>
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">{t('templates.form_hint')}</span>
                  </div>
                  <textarea 
                    className="w-full px-8 py-6 rounded-[2.5rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none h-48 resize-none font-bold text-on-surface text-lg leading-relaxed" 
                    placeholder={t('templates.form_content_placeholder')}
                    value={newTemplate.content}
                    onChange={e => setNewTemplate({...newTemplate, content: e.target.value})}
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
                  onClick={handleCreateOrUpdate}
                  disabled={isSaving || !newTemplate.name.trim() || !newTemplate.content.trim()}
                  className="flex-1 px-10 py-6 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all disabled:opacity-50"
                >
                  {isSaving ? t('common.loading') : editingTemplate ? t('common.save') : t('templates.add_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemplatesView;
