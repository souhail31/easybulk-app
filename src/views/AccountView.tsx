import React from 'react';
import { Key, Shield, User, Bell, Globe, Terminal, Save, Trash2, Plus, Code } from 'lucide-react';
import { Card } from '../components/ui/Cards';

export default function AccountView() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Configuration de Compte</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos informations, clés API et Webhooks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
              <User className="w-5 h-5 mr-3 text-blue-600" />
              Profil Utilisateur
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nom Complet</label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" defaultValue="Amal Mahdhi" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Adresse e-mail</label>
                <input type="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 opacity-60" defaultValue="amal@easybulk.tn" readOnly />
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-50 flex justify-end">
               <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all">
                  <Save className="w-5 h-5" />
                  <span>Enregistrer les modifications</span>
               </button>
            </div>
          </Card>

          {/* API Keys */}
          <Card className="p-8">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-slate-900 flex items-center">
                 <Key className="w-5 h-5 mr-3 text-blue-600" />
                 Clés API
               </h3>
               <button className="text-sm font-bold text-blue-600 flex items-center hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all">
                 <Plus className="w-4 h-4 mr-1" /> Générer une clé
               </button>
             </div>
             <div className="space-y-4">
                {[
                  { name: 'Production CRM', value: '4589d38a...129c', created: '2026-01-10', lastUsed: 'Il y a 2h' },
                  { name: 'Tester Postman', value: 'b83d810x...ff32', created: '2026-03-24', lastUsed: 'Hier' },
                ].map((key, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                     <div className="flex items-center space-x-4">
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                           <Code className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-800">{key.name}</p>
                           <p className="text-xs font-mono text-slate-400 mt-0.5">{key.value}</p>
                        </div>
                     </div>
                     <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                           <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Dernier usage</p>
                           <p className="text-xs font-bold text-slate-700">{key.lastUsed}</p>
                        </div>
                        <button className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100">
                           <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-8">
           <Card className="p-8 bg-slate-900 text-white border-none shadow-2xl shadow-blue-200">
              <h3 className="font-bold mb-6 flex items-center">
                 <Shield className="w-5 h-5 mr-3 text-blue-400" />
                 Sécurité
              </h3>
              <div className="space-y-4">
                 <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                    <span className="text-sm font-medium">Changer le mot de passe</span>
                 </button>
                 <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                    <span className="text-sm font-medium">Authentification 2FA</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">ACTIF</span>
                 </button>
                 <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5">
                    <span className="text-sm font-medium">Sessions actives</span>
                 </button>
              </div>
           </Card>

           <Card className="p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center font-display">
                <Bell className="w-5 h-5 mr-3 text-blue-600" />
                Notifications
              </h3>
              <div className="space-y-5">
                 {[
                   { label: 'Rapports hebdomadaires', desc: 'Recevoir un récapitulatif par email' },
                   { label: 'Alertes Quota', desc: 'Alerte à 80% et 95% de consommation' },
                   { label: 'Succès Campagne', desc: 'Notification push à la fin du traitement' },
                 ].map((n, i) => (
                   <div key={i} className="flex flex-col">
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-bold text-slate-700">{n.label}</span>
                         <input type="checkbox" className="w-10 h-5 bg-slate-200 border-none rounded-full cursor-pointer appearance-none checked:bg-blue-600 transition-all before:content-[''] before:w-4 before:h-4 before:bg-white before:rounded-full before:absolute before:mt-0.5 before:ml-0.5 checked:before:translate-x-5 before:transition-transform relative" defaultChecked={i < 2} />
                      </div>
                      <span className="text-xs text-slate-400">{n.desc}</span>
                   </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
