import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
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
  FileText
} from 'lucide-react';
import { Card } from '../components/ui/Cards';
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

const INITIAL_CONTACTS: Contact[] = [
  { id: 1, name: 'Jean Dupont', phone: '+216 22 333 444', email: 'jean@example.com', tags: ['vip', 'promo'], lastActive: '2026-04-20' },
  { id: 2, name: 'Sonia Ben Ali', phone: '+216 55 666 777', email: 'sonia@test.tn', tags: ['nouveau'], lastActive: '2026-04-24' },
  { id: 3, name: 'Marc Durand', phone: '+216 99 888 111', email: 'marc@corp.com', tags: ['pro', 'b2b'], lastActive: '2026-03-15' },
  { id: 4, name: 'Linda G.', phone: '+216 44 555 666', email: 'linda@gmail.com', tags: ['promo'], lastActive: '2026-04-22' },
];

export default function ContactsView() {
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

  const deleteContact = async (id: number) => {
    if (!confirm('Supprimer ce contact ?')) return;
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
      
      // Detect header
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Carnet d'Adresses</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos listes de destinataires et leurs métadonnées.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 shadow-sm transition-all"
          >
            <Upload className="w-5 h-5" />
            <span>Importer CSV</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            <span>Ajouter Contact</span>
          </button>
        </div>
      </div>

      {/* Toolbox */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Chercher par nom, téléphone ou email..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="flex items-center space-x-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600">
               <QrCode className="w-5 h-5" />
            </button>
         </div>
      </Card>

      {/* Contacts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 w-10">
                   <input type="checkbox" className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Identité</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Coordonnées</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tags</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut / Activité</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right text-transparent">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" 
                    />
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{contact.name}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" /> {contact.phone}
                      </div>
                      <div className="flex items-center text-xs text-slate-400">
                        <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" /> {contact.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {contact.tags.map(tag => (
                        <span key={tag} className="flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-tight">
                          <TagIcon className="w-2.5 h-2.5 mr-1" /> {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-500">Actif le : <span className="font-bold text-slate-700">{contact.lastActive}</span></div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditClick(contact)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteContact(contact.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Ajouter un Contact</h2>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-xl">
                    <X className="w-5 h-5" />
                  </button>
               </div>
               <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom complet</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      placeholder="ex: Jean Dupont"
                      value={newContact.name}
                      onChange={e => setNewContact({...newContact, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Téléphone</label>
                    <input 
                      type="tel" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      placeholder="+216 11 222 333"
                      value={newContact.phone}
                      onChange={e => setNewContact({...newContact, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email (optionnel)</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      placeholder="jean@example.com"
                      value={newContact.email}
                      onChange={e => setNewContact({...newContact, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Tags (séparés par des virgules)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      placeholder="vip, client, promo"
                      value={newContact.tags}
                      onChange={e => setNewContact({...newContact, tags: e.target.value})}
                    />
                  </div>
               </div>
               <div className="p-6 bg-slate-50 flex gap-3">
                  <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-white transition-all">Annuler</button>
                  <button 
                    onClick={handleAddContact}
                    disabled={!newContact.name || !newContact.phone}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    Ajouter
                  </button>
               </div>
            </motion.div>
          </div>
        )}

        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Importer contacts CSV</h2>
                  <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-xl">
                    <X className="w-5 h-5" />
                  </button>
               </div>
               <div className="p-8 space-y-6">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 bg-slate-50 hover:bg-white hover:border-blue-400 transition-all cursor-pointer relative group">
                    <input 
                      type="file" 
                      accept=".csv"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImportCSV}
                    />
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">Cliquer ou glisser le fichier CSV</p>
                    <p className="text-xs text-slate-400">Le fichier doit contenir Nom, Téléphone, Email</p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Format recommandé</h3>
                    <div className="bg-slate-900 rounded-xl p-4 font-mono text-[10px] text-slate-300">
                      name, phone, email, tags<br/>
                      Jean Dupont, +216..., jean@example.com, vip;promo
                    </div>
                  </div>
               </div>
               <div className="p-6 bg-slate-50 flex justify-end">
                  <button onClick={() => setIsImportModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-white transition-all">Fermer</button>
               </div>
            </motion.div>
          </div>
        )}

        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Modifier le Contact</h2>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-xl">
                    <X className="w-5 h-5" />
                  </button>
               </div>
               <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom complet</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      placeholder="ex: Jean Dupont"
                      value={newContact.name}
                      onChange={e => setNewContact({...newContact, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Téléphone</label>
                    <input 
                      type="tel" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      placeholder="+216 11 222 333"
                      value={newContact.phone}
                      onChange={e => setNewContact({...newContact, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email (optionnel)</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      placeholder="jean@example.com"
                      value={newContact.email}
                      onChange={e => setNewContact({...newContact, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Tags (séparés par des virgules)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      placeholder="vip, client, promo"
                      value={newContact.tags}
                      onChange={e => setNewContact({...newContact, tags: e.target.value})}
                    />
                  </div>
               </div>
               <div className="p-6 bg-slate-50 flex gap-3">
                  <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-white transition-all">Annuler</button>
                  <button 
                    onClick={handleUpdateContact}
                    disabled={!newContact.name || !newContact.phone}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    Mettre à jour
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
