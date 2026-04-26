import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Type, X } from 'lucide-react';
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

const INITIAL_TEMPLATES: Template[] = [
  { id: 1, name: 'Bienvenue', type: 'Classique', content: 'Bonjour {{name}}, bienvenue chez EasyBulk !', status: true },
  { id: 2, name: 'Alerte OTP', type: 'Transactionnelle', content: 'Votre code de vérification est : {{code}}', status: true },
  { id: 3, name: 'Promo Flash', type: 'Classique', content: 'Profitez de -50% sur tout le site avec le code SAVE50.', status: false },
];

const TemplatesView = () => {
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
      setErrorMessage('Impossible de charger les modeles depuis la base de donnees.');
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
        setErrorMessage(result?.error || 'Erreur lors de l\'enregistrement du modele.');
        return;
      }

      await fetchTemplates();
      closeModal();
    } catch (error) {
      console.error('Error saving template:', error);
      setErrorMessage('Impossible d\'enregistrer le modele.');
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
    if (!confirm('Supprimer ce modèle ?')) return;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Modèles de Message</h1>
          <p className="text-slate-500 text-sm mt-1">Créez des messages réutilisables avec des variables personnalisées.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Créer un modèle</span>
        </button>
      </div>

      {errorMessage && !isModalOpen && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(tpl => (
          <Card key={tpl.id} className="p-6 flex flex-col h-full bg-white border border-slate-100 hover:border-blue-200 transition-all">
             <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  tpl.type === 'Classique' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                )}>
                  <Type className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => toggleTemplateStatus(tpl)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    tpl.status ? "bg-emerald-500 shadow-lg shadow-emerald-100" : "bg-slate-300"
                  )} 
                />
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-2">{tpl.name}</h3>
             <div className="flex items-center space-x-2 mb-4">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{tpl.type}</span>
             </div>
             <div className="flex-1 p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-slate-600 text-sm mb-6">
               "{tpl.content}"
             </div>
             <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-50">
                <button 
                  onClick={() => openEditModal(tpl)}
                  className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteTemplate(tpl.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
             </div>
          </Card>
        ))}
      </div>

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
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingTemplate ? 'Modifier le modèle' : 'Créer un nouveau modèle'}
                </h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                {errorMessage && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Libellé du modèle *</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" 
                      placeholder="ex: Message de bienvenue"
                      value={newTemplate.name}
                      onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newTemplate.type}
                      onChange={e => setNewTemplate({...newTemplate, type: e.target.value})}
                    >
                      <option>Classique</option>
                      <option>Transactionnelle</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Statut</label>
                    <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                      <button 
                        onClick={() => setNewTemplate({...newTemplate, status: true})}
                        className={cn(
                          "flex-1 py-1 rounded-lg text-xs font-bold transition-all",
                          newTemplate.status ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-400"
                        )}
                      >
                        Actif
                      </button>
                      <button 
                        onClick={() => setNewTemplate({...newTemplate, status: false})}
                        className={cn(
                          "flex-1 py-1 rounded-lg text-xs font-bold transition-all",
                          !newTemplate.status ? "bg-slate-400 text-white shadow-md" : "text-slate-400"
                        )}
                      >
                        Inactif
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-700">Contenu du message *</label>
                    <span className="text-[10px] text-slate-400 font-mono">Utilisez {"{{variable}}"} pour personnaliser</span>
                  </div>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none h-32 resize-none" 
                    placeholder="Ecrivez votre message ici..."
                    value={newTemplate.content}
                    onChange={e => setNewTemplate({...newTemplate, content: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex gap-4">
                <button 
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-white transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleCreateOrUpdate}
                  disabled={isSaving || !newTemplate.name.trim() || !newTemplate.content.trim()}
                  className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : editingTemplate ? 'Enregistrer' : 'Créer le modèle'}
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
