import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Send, Users, CreditCard, Clock, CheckCircle, AlertCircle, TrendingUp, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { Card } from '../components/ui/Cards';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const PremiumStatCard = ({ label, value, icon: Icon, color, trend }: { label: string, value: string | number, icon: any, color: string, trend?: string }) => (
  <Card className="p-8 bg-white/60 backdrop-blur-md border-outline-variant/10 shadow-xl shadow-surface-variant/5 group overflow-hidden relative rounded-[2.5rem]">
    <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000 rounded-full", color)} />
    <div className="flex items-center justify-between relative z-10">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">{label}</p>
        <p className="text-3xl font-black text-on-surface tracking-tighter">{value}</p>
        {trend && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
            <span className="text-emerald-500 text-xs font-black bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">+{trend}%</span>
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">vs hier</span>
          </div>
        )}
      </div>
      <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner border-4 border-white/50", color.replace('bg-', 'text-').replace('-500', ''), color.replace('bg-', 'bg-').replace('-500', '/10'))}>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  </Card>
);

export default function DashboardView() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'API Error');
      }
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[70vh]"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const { topStats, primaryStats, budgetDistribution, dailyStats } = data || {
    topStats: { quotaRestant: 0, campagnesActives: 0 },
    primaryStats: { smsEnvoyes: 0, totalContacts: 0, budgetConsomme: 0, tauxLivraison: '0%' },
    budgetDistribution: [],
    dailyStats: []
  };

  return (
    <div className="space-y-10 pb-16 font-sans">
      {/* Top Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-on-surface rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(var(--color-primary),0.4)]" />
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/10 rounded-full blur-3xl -mr-[15rem] -mt-[15rem] group-hover:scale-110 transition-transform duration-1000" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 p-10 md:p-14 text-white">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-white/20 shadow-xl">
                EasyBulk Cloud v4.2
              </div>
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-primary bg-white/20 backdrop-blur-sm" />
                ))}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
              {t('common.welcome')} <span className="text-white/60 font-medium font-sans italic">👋</span>
            </h1>
            <p className="text-xl font-bold text-white/80 leading-relaxed">
              {t('common.welcome_sub')}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button className="flex items-center space-x-3 bg-white text-primary px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-primary-container hover:text-white transition-all group">
                <span>{t('campaigns.add_btn')}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform rtl:rotate-180" />
              </button>
              <button className="flex items-center space-x-3 bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:bg-white/20 transition-all">
                <Zap className="w-5 h-5" />
                <span>{t('dashboard.view_all')}</span>
              </button>
            </div>
          </div>

          <div className="flex gap-6 shrink-0">
            <div className="bg-white/10 backdrop-blur-xl border-2 border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center min-w-[14rem] shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">{t('dashboard.quota_remaining')}</span>
              <span className="text-5xl font-black tracking-tighter tabular-nums">{topStats.quotaRestant.toLocaleString()}</span>
              <div className="mt-4 w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl border-2 border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center min-w-[14rem] shadow-2xl hidden md:flex">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">{t('dashboard.active_campaigns')}</span>
              <span className="text-5xl font-black tracking-tighter tabular-nums">{topStats.campagnesActives}</span>
              <span className="mt-4 text-[10px] font-black text-white/40 uppercase tracking-widest">En cours</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <PremiumStatCard label={t('dashboard.sent_sms')} value={primaryStats.smsEnvoyes} icon={Send} color="bg-blue-500" trend="12.5" />
        <PremiumStatCard label={t('dashboard.total_contacts')} value={primaryStats.totalContacts} icon={Users} color="bg-emerald-500" trend="3.2" />
        <PremiumStatCard label={t('dashboard.budget_consumed')} value={`${primaryStats.budgetConsomme} DT`} icon={CreditCard} color="bg-amber-500" />
        <PremiumStatCard label={t('dashboard.delivery_rate')} value={primaryStats.tauxLivraison} icon={CheckCircle} color="bg-purple-500" trend="1.8" />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Bar Chart - Performance Evolution */}
        <Card className="lg:col-span-2 p-10 border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/80 backdrop-blur-xl rounded-[3rem]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h3 className="text-2xl font-black text-on-surface tracking-tighter">{t('dashboard.evolution_chart')}</h3>
              <p className="text-sm font-bold text-on-surface-variant/60 uppercase tracking-widest mt-1">{t('dashboard.evolution_sub')}</p>
            </div>
            <div className="flex items-center space-x-2 bg-surface-container/50 p-2 rounded-2xl border border-outline-variant/10 rtl:space-x-reverse">
              <button className="px-6 py-2.5 rounded-xl bg-white text-xs font-black text-primary shadow-xl shadow-on-surface/5 uppercase tracking-widest">7d</button>
              <button className="px-6 py-2.5 rounded-xl text-xs font-black text-outline hover:text-on-surface uppercase tracking-widest">30d</button>
            </div>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 12 }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 40px 60px -15px rgba(0,0,0,0.1)', fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px', padding: '16px' }}
                />
                <Bar dataKey="sent" fill="url(#colorSent)" radius={[8, 8, 0, 0]} name="Envoyés" barSize={32} />
                <Bar dataKey="delivered" fill="url(#colorDelivered)" radius={[8, 8, 0, 0]} name="Livrés" barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart - Cost Distribution */}
        <Card className="p-10 border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/80 backdrop-blur-xl rounded-[3rem] flex flex-col">
          <h3 className="text-2xl font-black text-on-surface tracking-tighter mb-1">{t('dashboard.budget_distribution')}</h3>
          <p className="text-sm font-bold text-on-surface-variant/60 uppercase tracking-widest mb-10">{t('dashboard.budget_sub')}</p>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            {budgetDistribution.length > 0 ? (
              <>
                <div className="h-72 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={10}
                        dataKey="value"
                        stroke="none"
                      >
                        {budgetDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} className="outline-none" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-on-surface tracking-tighter">100%</span>
                    <span className="text-[10px] text-outline font-black tracking-[0.2em] uppercase mt-1">Total</span>
                  </div>
                </div>

                <div className="w-full space-y-4 mt-10">
                  {budgetDistribution.map((item: any) => (
                    <div key={item.name} className="flex items-center justify-between p-4 bg-surface-container/30 rounded-[1.25rem] border border-outline-variant/10 group hover:bg-white transition-all">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-black text-on-surface-variant uppercase tracking-widest">{item.name}</span>
                      </div>
                      <span className="text-sm font-black text-on-surface">{item.value} <span className="text-[10px] text-outline font-bold">DT</span></span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-on-surface-variant/30 text-xl font-black uppercase tracking-widest">{t('common.no_data')}</div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Feed */}
        <Card className="p-10 border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/80 backdrop-blur-xl rounded-[3rem]">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-black text-on-surface tracking-tighter">{t('dashboard.recent_activity')}</h3>
            <button className="text-primary font-black text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 bg-primary/5 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/5 border border-primary/10">{t('dashboard.view_all')}</button>
          </div>
          <div className="space-y-8">
            {[
              { type: 'campaign', msg: 'Campagne "Soldes Été" lancée par Agent.Sarah', time: 'Il y a 5 min', icon: Send, color: 'text-primary bg-primary/10' },
              { type: 'budget', msg: 'Budget Groupe "Marketing" augmenté de 500 DT', time: 'Il y a 2h', icon: CreditCard, color: 'text-emerald-500 bg-emerald-500/10' },
              { type: 'warning', msg: 'Quota critique atteint pour le Groupe "Service Client"', time: 'Il y a 4h', icon: AlertCircle, color: 'text-amber-500 bg-amber-500/10' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start space-x-6 rtl:space-x-reverse group">
                <div className={cn("p-4 rounded-[1.5rem] shadow-sm shrink-0 transition-transform group-hover:scale-110 duration-500", activity.color)}>
                  <activity.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-base font-black text-on-surface leading-snug tracking-tight group-hover:text-primary transition-colors">{activity.msg}</p>
                  <p className="text-[10px] text-outline flex items-center font-black uppercase tracking-widest">
                    <Clock className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-primary" /> {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* System Status */}
        <Card className="p-10 border-outline-variant/10 shadow-2xl shadow-surface-variant/5 bg-white/80 backdrop-blur-xl rounded-[3rem]">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-black text-on-surface tracking-tighter">{t('dashboard.server_status')}</h3>
            <div className="w-10 h-10 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-6">
            {[
              { name: 'Passerelle Kannel 01', status: 'Optimal', health: 98, color: 'emerald' },
              { name: 'Système d\'envoi Bulk', status: 'Stable', health: 100, color: 'emerald' },
              { name: 'API Transactionnelle', status: 'Normal', health: 85, color: 'blue' },
            ].map((service, i) => (
              <div key={i} className="p-8 bg-surface-container/30 rounded-[2.5rem] border border-outline-variant/10 group hover:bg-white transition-all shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-black text-on-surface text-lg tracking-tighter">{service.name}</span>
                  <span className="text-[10px] font-black px-4 py-1.5 rounded-full bg-white shadow-xl border border-outline-variant/10 uppercase tracking-widest text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    {service.status}
                  </span>
                </div>
                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden p-1 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${service.health}%` }}
                    className="h-full bg-primary rounded-full shadow-sm"
                  />
                </div>
                <div className="mt-4 flex justify-between text-[10px] font-black uppercase tracking-widest text-outline opacity-60">
                  <span>Performance</span>
                  <span>{service.health}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
