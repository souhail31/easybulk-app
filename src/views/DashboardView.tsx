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
import { Send, Users, CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { StatCard, Card } from '../components/ui/Cards';
import { motion } from 'motion/react';

export default function DashboardView() {
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
      setData(null); // Ensure data is null on error so fallback is used
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const { topStats, primaryStats, budgetDistribution, dailyStats } = data || {
    topStats: { quotaRestant: 0, campagnesActives: 0 },
    primaryStats: { smsEnvoyes: 0, totalContacts: 0, budgetConsomme: 0, tauxLivraison: '0%' },
    budgetDistribution: [],
    dailyStats: []
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-blue-600 rounded-[2rem] p-6 md:p-8 text-white shadow-xl shadow-blue-100">
        <div>
          <h1 className="text-2xl font-bold">Bonjour 👋</h1>
          <p className="text-blue-100 mt-1">Voici ce qui se passe sur votre plateforme EasyBulk aujourd'hui.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Quota Restant</span>
            <span className="text-xl font-bold mt-1">{topStats.quotaRestant.toLocaleString()}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Campagnes Actives</span>
            <span className="text-xl font-bold mt-1">{topStats.campagnesActives}</span>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Sms envoyés" 
          value={primaryStats.smsEnvoyes} 
          icon={Send} 
          color="blue"
        />
        <StatCard 
          label="Total Contacts" 
          value={primaryStats.totalContacts} 
          icon={Users} 
          color="green"
        />
        <StatCard 
          label="Budget Consommé" 
          value={`${primaryStats.budgetConsomme} DT`} 
          icon={CreditCard} 
          color="orange"
        />
        <StatCard 
          label="Taux de Livraison" 
          value={primaryStats.tauxLivraison} 
          icon={CheckCircle} 
          color="purple"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Evolution Chart */}
        <Card className="lg:col-span-2 p-5 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Évolution des envois</h3>
              <p className="text-sm text-slate-500">Volume de messages sur les 7 derniers jours</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 py-2.5 px-4">
              <option>7 derniers jours</option>
              <option>30 derniers jours</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="sent" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Envoyés" />
                <Bar dataKey="delivered" fill="#10B981" radius={[4, 4, 0, 0]} name="Livrés" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution Chart */}
        <Card className="p-5 md:p-8 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Budget par Groupe</h3>
          <p className="text-sm text-slate-500 mb-8">Répartition des coûts actuels</p>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            {budgetDistribution.length > 0 ? (
              <>
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {budgetDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900">100%</span>
                    <span className="text-xs text-slate-400 font-medium">TOTAL</span>
                  </div>
                </div>

                <div className="w-full space-y-3 mt-4">
                  {budgetDistribution.map((item: any) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{item.value} DT</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-sm">Aucune donnée disponible</div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Alerts/Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Dernières Activités</h3>
            <button className="text-blue-600 font-semibold text-sm hover:underline">Voir tout</button>
          </div>
          <div className="space-y-6">
            {[
              { type: 'campaign', msg: 'Campagne "Soldes Été" lancée par Agent.Sarah', time: 'Il y a 5 min', icon: Send, color: 'blue' },
              { type: 'budget', msg: 'Budget Groupe "Marketing" augmenté de 500 DT', time: 'Il y a 2h', icon: CreditCard, color: 'emerald' },
              { type: 'warning', msg: 'Quota critique atteint pour le Groupe "Service Client"', time: 'Il y a 4h', icon: AlertCircle, color: 'amber' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg bg-${activity.color}-50 text-${activity.color}-600`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 leading-snug">{activity.msg}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 font-display">Statut des Serveurs</h3>
          <div className="space-y-4">
            {[
              { name: 'Passerelle Kannel 01', status: 'Optimal', health: 98, color: 'emerald' },
              { name: 'Système d\'envoi Bulk', status: 'Stable', health: 100, color: 'emerald' },
              { name: 'API Transactionnelle', status: 'Normal', health: 85, color: 'blue' },
            ].map((service, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-800">{service.name}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-${service.color}-100 text-${service.color}-700`}>
                    {service.status}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${service.health}%` }}
                    className={`h-full bg-${service.color}-500 rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
