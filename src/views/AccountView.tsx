import React, { useState } from 'react';
import { Key, Shield, User, Bell, Globe, Terminal, Save, Trash2, Plus, Code, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Cards';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function AccountView() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState({
    weekly: true,
    quota: true,
    success: false
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
              <Settings className="text-primary w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t('common.management')}</span>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter">{t('account.title')}</h1>
          <p className="text-on-surface-variant font-bold mt-2 text-lg">{t('account.subtitle')}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile & API Keys */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-10 border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/60 backdrop-blur-md rounded-[3rem]">
            <h3 className="text-2xl font-black text-on-surface mb-8 flex items-center tracking-tight">
              <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center mr-4 rtl:ml-4 rtl:mr-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              {t('account.profile_title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('account.form_name')}</label>
                <input 
                  type="text" 
                  className="w-full px-8 py-6 rounded-[2rem] bg-surface-container border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-black text-on-surface text-lg" 
                  defaultValue="Amal Mahdhi" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">{t('account.form_email')}</label>
                <input 
                  type="email" 
                  className="w-full px-8 py-6 rounded-[2rem] bg-surface-container/50 border-2 border-transparent outline-none font-black text-on-surface-variant/50 text-lg cursor-not-allowed" 
                  defaultValue="amal@easybulk.tn" 
                  readOnly 
                />
              </div>
            </div>
            <div className="mt-10 pt-10 border-t border-outline-variant/10 flex justify-end">
               <button className="flex items-center space-x-3 bg-primary text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all group">
                  <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>{t('account.save_changes')}</span>
               </button>
            </div>
          </Card>

          {/* API Keys */}
          <Card className="p-10 border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/60 backdrop-blur-md rounded-[3rem]">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black text-on-surface flex items-center tracking-tight">
                 <div className="w-12 h-12 rounded-[1.25rem] bg-amber-500/10 flex items-center justify-center mr-4 rtl:ml-4 rtl:mr-0">
                   <Key className="w-6 h-6 text-amber-600" />
                 </div>
                 {t('account.api_keys')}
               </h3>
               <button className="text-xs font-black text-primary flex items-center hover:bg-primary/5 px-6 py-3 rounded-[1.5rem] transition-all uppercase tracking-widest border-2 border-transparent hover:border-primary/10">
                 <Plus className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" /> {t('account.generate_key')}
               </button>
             </div>
             <div className="space-y-4">
                {[
                  { name: 'Production CRM', value: '4589d38a...129c', created: '2026-01-10', lastUsed: 'Il y a 2h' },
                  { name: 'Tester Postman', value: 'b83d810x...ff32', created: '2026-03-24', lastUsed: 'Hier' },
                ].map((key, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-surface-container rounded-[2rem] border border-transparent hover:border-outline-variant/10 group transition-all">
                     <div className="flex items-center space-x-5 rtl:space-x-reverse mb-4 sm:mb-0">
                        <div className="p-4 bg-white text-on-surface-variant rounded-[1.25rem] shadow-sm">
                           <Code className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-lg font-black text-on-surface tracking-tight">{key.name}</p>
                           <p className="text-sm font-bold font-mono text-outline mt-1 bg-white px-2 py-0.5 rounded-lg inline-block">{key.value}</p>
                        </div>
                     </div>
                     <div className="flex items-center justify-between sm:justify-end space-x-6 rtl:space-x-reverse">
                        <div className="text-left sm:text-right">
                           <p className="text-[10px] uppercase font-black text-outline tracking-[0.2em]">{t('account.last_used')}</p>
                           <p className="text-sm font-black text-on-surface mt-1">{key.lastUsed}</p>
                        </div>
                        <button className="p-4 text-outline hover:text-rose-600 hover:bg-white rounded-[1.25rem] transition-all shadow-sm border border-transparent hover:border-rose-100 bg-white sm:bg-transparent sm:shadow-none sm:opacity-0 sm:group-hover:opacity-100">
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
           <Card className="p-10 bg-on-surface text-white border-none shadow-[0_30px_60px_-15px_rgba(var(--color-on-surface),0.5)] rounded-[3rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <h3 className="text-2xl font-black mb-8 flex items-center tracking-tight relative z-10">
                 <div className="w-12 h-12 rounded-[1.25rem] bg-white/10 flex items-center justify-center mr-4 rtl:ml-4 rtl:mr-0 backdrop-blur-md">
                   <Shield className="w-6 h-6 text-white" />
                 </div>
                 {t('account.security')}
              </h3>
              <div className="space-y-4 relative z-10">
                 <button className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md">
                    <span className="text-sm font-black uppercase tracking-widest">{t('account.change_password')}</span>
                 </button>
                 <button className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md">
                    <span className="text-sm font-black uppercase tracking-widest">{t('account.2fa')}</span>
                    <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">{t('common.active')}</span>
                 </button>
                 <button className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 transition-all border border-white/10 backdrop-blur-md">
                    <span className="text-sm font-black uppercase tracking-widest">{t('account.active_sessions')}</span>
                 </button>
              </div>
           </Card>

           <Card className="p-10 border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/60 backdrop-blur-md rounded-[3rem]">
              <h3 className="text-2xl font-black text-on-surface mb-8 flex items-center tracking-tight">
                <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center mr-4 rtl:ml-4 rtl:mr-0">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                {t('account.notifications')}
              </h3>
              <div className="space-y-6">
                 {[
                   { id: 'weekly', label: t('account.weekly_reports'), desc: t('account.weekly_reports_desc') },
                   { id: 'quota', label: t('account.quota_alerts'), desc: t('account.quota_alerts_desc') },
                   { id: 'success', label: t('account.campaign_success'), desc: t('account.campaign_success_desc') },
                 ].map((n) => (
                   <div key={n.id} className="flex flex-col p-4 bg-surface-container rounded-[1.5rem] border border-transparent hover:border-outline-variant/10 transition-all">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-sm font-black text-on-surface uppercase tracking-widest">{n.label}</span>
                         <button 
                           onClick={() => setNotifications(prev => ({ ...prev, [n.id]: !prev[n.id as keyof typeof prev] }))}
                           className={cn(
                             "w-12 h-6 rounded-full p-1 transition-all duration-300 relative",
                             notifications[n.id as keyof typeof notifications] ? "bg-primary shadow-lg shadow-primary/20" : "bg-outline-variant/30"
                           )}
                         >
                           <motion.div 
                             animate={{ x: notifications[n.id as keyof typeof notifications] ? (document.dir === 'rtl' ? -24 : 24) : 0 }}
                             className="w-4 h-4 bg-white rounded-full shadow-sm" 
                           />
                         </button>
                      </div>
                      <span className="text-xs font-bold text-outline">{n.desc}</span>
                   </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
