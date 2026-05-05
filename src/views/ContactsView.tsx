import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users,
  Upload, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Tag as TagIcon, 
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  QrCode,
  X,
  FileText,
  UserCheck,
  UserX,
  Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, StatCard } from '../components/ui/Cards';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Contact {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  lastActive: string;
}

export default function ContactsView() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<Array<string | number>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form state
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    tags: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const normalizeContact = (contact: any): Contact => ({
    id: contact?.id ?? contact?.phone ?? '',
    name: contact?.name ?? contact?.phone ?? 'Sans nom',
    phone: contact?.phone ?? '',
    email: contact?.email ?? '',
    tags: Array.isArray(contact?.tags)
      ? contact.tags
      : typeof contact?.tags === 'string'
        ? contact.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [],
    lastActive: typeof contact?.lastActive === 'string' ? contact.lastActive : ''
  });

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();
      setContacts(Array.isArray(data) ? data.map(normalizeContact) : []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string | number) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) return;

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContact.name,
          phone: newContact.phone,
          email: newContact.email || 'non-renseigné',
          tags: newContact.tags.split(',').map(t => t.trim()).filter(t => t !== '')
        })
      });
      
      if (response.ok) {
        fetchContacts();
        setIsAddModalOpen(false);
        setNewContact({ name: '', phone: '', email: '', tags: '' });
      }
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setNewContact({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      tags: contact.tags ? (Array.isArray(contact.tags) ? contact.tags.join(', ') : '') : ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!newContact.name || !newContact.phone || !editingContact) return;

    try {
      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContact.name,
          phone: newContact.phone,
          email: newContact.email,
          tags: newContact.tags.split(',').map(t => t.trim()).filter(t => t !== '')
        })
      });

      if (response.ok) {
        fetchContacts();
        setIsEditModalOpen(false);
        setEditingContact(null);
        setNewContact({ name: '', phone: '', email: '', tags: '' });
      }
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const deleteContact = async (id: string | number) => {
    if (!confirm(t('common.delete_confirm'))) return;
    try {
      await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const startIdx = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('nom') ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 2) {
          await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: parts[0]?.trim() || 'Sans nom',
              phone: parts[1]?.trim() || 'S/N',
              email: parts[2]?.trim() || 'non-renseigné',
              tags: parts[3] ? parts[3].split(';').map(t => t.trim()).filter(t => t !== '') : []
            })
          });
        }
      }
      fetchContacts();
      setIsImportModalOpen(false);
    };
    reader.readAsText(file);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <UserPlus className="text-primary w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t('common.management')}</span>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter">{t('contacts.title')}</h1>
          <p className="text-on-surface-variant font-bold mt-2 text-lg">{t('contacts.subtitle')}</p>
        </motion.div>
        
        <div className="flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center space-x-3 bg-white border-2 border-outline-variant/10 text-on-surface px-8 py-5 rounded-[2rem] transition-all shadow-xl font-black uppercase tracking-widest text-sm"
          >
            <Upload className="w-6 h-6" />
            <span>{t('contacts.import_btn')}</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-3 bg-primary text-white px-8 py-5 rounded-[2rem] transition-all shadow-2xl shadow-primary/30 font-black uppercase tracking-widest text-sm group"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            <span>{t('contacts.add_btn')}</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label={t('contacts.total_contacts')}
          value={contacts.length.toString()}
          icon={Users}
          trend={{ value: "+8%", up: true }}
          color="blue"
        />
        <StatCard 
          label={t('contacts.new_this_month')}
          value="124"
          icon={UserCheck}
          trend={{ value: "+15%", up: true }}
          color="green"
        />
        <StatCard 
          label={t('contacts.blacklisted')}
          value="12"
          icon={UserX}
          trend={{ value: "-2%", up: true }}
          color="orange"
        />
      </div>

      {/* Toolbox */}
      <div className="grid grid-cols-1 gap-8">
        <Card className="p-5 md:p-6 border-outline-variant/10 shadow-xl shadow-surface-variant/5 bg-white/80 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder={t('contacts.search_placeholder')}
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
              <button className="flex items-center space-x-3 px-8 py-5 bg-white border-2 border-outline-variant/10 rounded-[1.5rem] text-sm font-black text-on-surface-variant hover:bg-surface-container transition-all uppercase tracking-widest hover:border-primary/20">
                <Download className="w-5 h-5" />
                <span>{t('common.export')}</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Contacts Table */}
        <Card className="overflow-hidden border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/60 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-surface-container/20 border-b border-outline-variant/10">
                  <th className="px-10 py-6 w-10">
                     <input type="checkbox" className="w-6 h-6 rounded-lg border-outline-variant/30 text-primary focus:ring-primary" />
                  </th>
                  <th className="px-10 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em]">{t('contacts.label_col')}</th>
                  <th className="px-10 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em]">{t('contacts.coord_col')}</th>
                  <th className="px-10 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em]">{t('contacts.tags_col')}</th>
                  <th className="px-10 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em]">{t('contacts.activity_col')}</th>
                  <th className="px-10 py-6 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.25em] text-right rtl:text-left">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {loading ? (
                   <tr><td colSpan={6} className="py-20 text-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                ) : filteredContacts.length === 0 ? (
                  <tr><td colSpan={6} className="py-20 text-center text-xl font-black text-on-surface-variant/30 uppercase tracking-widest">{t('common.no_data')}</td></tr>
                ) : filteredContacts.map((contact) => (
                  <motion.tr 
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-primary/5 transition-all group/row"
                  >
                    <td className="px-10 py-8">
                      <input 
                        type="checkbox" 
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        className="w-6 h-6 rounded-lg border-outline-variant/30 text-primary focus:ring-primary" 
                      />
                    </td>
                    <td className="px-10 py-8">
                       <div className="font-black text-on-surface text-xl tracking-tighter group-hover/row:text-primary transition-colors">{contact.name}</div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-1.5">
                        <div className="flex items-center text-sm font-black text-on-surface">
                          <Phone className="w-4 h-4 mr-3 rtl:ml-3 rtl:mr-0 text-primary" /> {contact.phone}
                        </div>
                        <div className="flex items-center text-xs font-bold text-on-surface-variant/50 uppercase tracking-wide">
                          <Mail className="w-4 h-4 mr-3 rtl:ml-3 rtl:mr-0 text-outline" /> {contact.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-wrap gap-2">
                        {contact.tags.map(tag => (
                          <span key={tag} className="flex items-center px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant text-[10px] font-black uppercase tracking-[0.1em] border border-outline-variant/10">
                            <TagIcon className="w-3 h-3 mr-1.5 rtl:ml-1.5 rtl:mr-0" /> {tag}
                          </span>
                        ))}
                        {contact.tags.length === 0 && <span className="text-[10px] font-black text-outline/30 uppercase tracking-widest">Aucun tag</span>}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="text-xs font-black text-on-surface uppercase tracking-widest">
                         <span className="text-on-surface-variant/40 mr-2 rtl:ml-2 rtl:mr-0">Actif :</span>
                         <span className="text-primary">{contact.lastActive || '---'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right rtl:text-left">
                      <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse opacity-0 group-hover/row:opacity-100 transition-all scale-90 group-hover/row:scale-100">
                        <button 
                          onClick={() => handleEditClick(contact)}
                          className="p-4 text-outline hover:text-blue-600 hover:bg-white rounded-[1.25rem] transition-all shadow-lg shadow-on-surface/5 border-2 border-transparent hover:border-outline-variant/10"
                        >
                          <Edit2 className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={() => deleteContact(contact.id)}
                          className="p-4 text-outline hover:text-rose-600 hover:bg-white rounded-[1.25rem] transition-all shadow-lg shadow-on-surface/5 border-2 border-transparent hover:border-outline-variant/10"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
              className="absolute inset-0 bg-on-surface/60 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 50 }}
              className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20"
            >
               <div className="p-12 pb-8 border-b border-outline-variant/10 bg-surface-container/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black text-on-surface tracking-tighter">
                      {isEditModalOpen ? t('contacts.edit_title') : t('contacts.add_title')}
                    </h2>
                    <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="text-outline hover:text-rose-500 bg-white p-5 rounded-[2rem] shadow-xl border border-outline-variant/20 transition-all hover:rotate-90">
                      <X className="w-8 h-8" />
                    </button>
                  </div>
               </div>
               <div className="p-12 space-y-10">
                  <div className="grid grid-cols-2 gap-10">
                    <div className="col-span-2 md:col-span-1 space-y-3">
                      <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('contacts.form_name')}</label>
                      <input 
                        type="text" 
                        className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg" 
                        placeholder="ex: Jean Dupont"
                        value={newContact.name}
                        onChange={e => setNewContact({...newContact, name: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-3">
                      <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('contacts.form_phone')}</label>
                      <input 
                        type="tel" 
                        className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg" 
                        placeholder="+216 11 222 333"
                        value={newContact.phone}
                        onChange={e => setNewContact({...newContact, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('contacts.form_email')}</label>
                    <input 
                      type="email" 
                      className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg" 
                      placeholder="jean@example.com"
                      value={newContact.email}
                      onChange={e => setNewContact({...newContact, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('contacts.form_tags')}</label>
                    <input 
                      type="text" 
                      className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg" 
                      placeholder="vip, client, promo"
                      value={newContact.tags}
                      onChange={e => setNewContact({...newContact, tags: e.target.value})}
                    />
                  </div>
               </div>
               <div className="p-12 bg-surface-container/20 border-t border-outline-variant/10 flex gap-6">
                  <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 px-10 py-6 rounded-[2rem] border-2 border-outline-variant/30 text-on-surface font-black uppercase tracking-widest text-sm hover:bg-white transition-all">{t('common.cancel')}</button>
                  <button 
                    onClick={isEditModalOpen ? handleUpdateContact : handleAddContact}
                    disabled={!newContact.name || !newContact.phone}
                    className="flex-1 px-10 py-6 rounded-[2rem] bg-primary text-white font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_-10px_rgba(var(--color-primary),0.3)] hover:bg-primary-container transition-all disabled:opacity-50"
                  >
                    {isEditModalOpen ? t('common.save') : t('common.add')}
                  </button>
               </div>
            </motion.div>
          </div>
        )}

        {isImportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
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
                    <h2 className="text-4xl font-black text-on-surface tracking-tighter">{t('contacts.import_title')}</h2>
                    <button onClick={() => setIsImportModalOpen(false)} className="text-outline hover:text-rose-500 bg-white p-5 rounded-[2rem] shadow-xl border border-outline-variant/20 transition-all hover:rotate-90">
                      <X className="w-8 h-8" />
                    </button>
                  </div>
               </div>
               <div className="p-12 space-y-10">
                  <div className="flex flex-col items-center justify-center border-4 border-dashed border-outline-variant/10 rounded-[3rem] p-16 bg-surface-container/20 hover:bg-white hover:border-primary/30 transition-all cursor-pointer relative group">
                    <input 
                      type="file" 
                      accept=".csv"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImportCSV}
                    />
                    <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <FileText className="w-12 h-12 text-primary" />
                    </div>
                    <p className="text-xl font-black text-on-surface mb-2">{t('contacts.import_drop')}</p>
                    <p className="text-sm font-bold text-on-surface-variant/40 uppercase tracking-widest">{t('contacts.import_format')}</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-on-surface-variant/50 uppercase tracking-[0.25em] ml-2">{t('contacts.import_example')}</h3>
                    <div className="bg-on-surface rounded-[2rem] p-8 font-mono text-sm text-surface-container-highest shadow-inner overflow-x-auto">
                      <span className="text-primary-container">name, phone, email, tags</span><br/>
                      Jean Dupont, +216..., jean@example.com, vip;promo
                    </div>
                  </div>
               </div>
               <div className="p-12 bg-surface-container/20 border-t border-outline-variant/10 flex justify-end">
                  <button onClick={() => setIsImportModalOpen(false)} className="px-12 py-6 rounded-[2rem] bg-white border-2 border-outline-variant/10 font-black uppercase tracking-widest text-sm text-on-surface hover:bg-surface-container transition-all">{t('common.cancel')}</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
