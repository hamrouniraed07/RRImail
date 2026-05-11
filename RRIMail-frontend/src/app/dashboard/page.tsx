import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  Inbox,
  Send,
  Mail,
  Search,
  TrendingUp,
  Settings,
  Bell,
  Moon,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

function normalizeStatus(status: string) {
  switch (status) {
    case 'Registered':
      return 'Enregistré'
    case 'Under Review':
      return 'En révision'
    case 'Assigned':
      return 'Assigné'
    case 'In Progress':
      return 'En cours'
    case 'Processed':
      return 'Traité'
    default:
      return status
  }
}

function normalizePriority(priority: string) {
  switch (priority) {
    case 'Low':
      return 'Faible'
    case 'Medium':
      return 'Normal'
    case 'High':
      return 'Normal'
    case 'Urgent':
      return 'Urgent'
    default:
      return 'Normal'
  }
}

function normalizeMail(mail: any) {
  return {
    id: mail._id || mail.id,
    subject: mail.subject || 'Sans objet',
    sender: mail.sender || 'Expéditeur inconnu',
    dueDate: formatDate(mail.slaDeadline || mail.dueDate),
    receivedDate: formatDate(mail.createdAt || mail.receivedDate),
    priority: normalizePriority(mail.priority || 'Medium'),
    status: normalizeStatus(mail.status || 'Registered'),
    category: mail.category?.name || mail.category || 'Sans catégorie',
    type: mail.type || 'Incoming',
    isOverdue: mail.isOverdue || false,
    createdAt: mail.createdAt || mail.receivedDate || '',
  }
}

async function fetchDashboardMails(): Promise<any[]> {
  const response = await fetch(`${apiBaseUrl}/mails?limit=50`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    } as Record<string, string>,
  })
  const payload = await response.json()
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Impossible de récupérer les courriers')
  }
  return (payload.data || []).map(normalizeMail)
}

async function fetchMailStats(): Promise<Record<string, number>> {
  const response = await fetch(`${apiBaseUrl}/mails/stats`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    } as Record<string, string>,
  })
  const payload = await response.json()
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Impossible de récupérer les statistiques')
  }
  return payload.data || {}
}


type DashboardPageProps = {
  onNavigate: (page: 'dashboard' | 'dispatcher') => void
}

const Dashboard = ({ onNavigate }: DashboardPageProps) => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mails, setMails] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setError(null)
      try {
        const [dashboardMails, stats] = await Promise.all([fetchDashboardMails(), fetchMailStats()])
        setMails(dashboardMails)
        setStatusCounts(stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement des données')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const mailFlowData = useMemo(() => {
    if (mails.length === 0) {
      return [
        { month: 'Jan', entrant: 30, sortant: 24 },
        { month: 'Fév', entrant: 35, sortant: 26 },
        { month: 'Mar', entrant: 28, sortant: 22 },
        { month: 'Avr', entrant: 42, sortant: 28 },
      ]
    }

    const monthMap = new Map<string, { month: string; entrant: number; sortant: number }>()
    mails.forEach((mail) => {
      const date = mail.createdAt ? new Date(mail.createdAt) : null
      if (!date) return
      const month = date.toLocaleString('fr-FR', { month: 'short' })
      const entry = monthMap.get(month) || { month, entrant: 0, sortant: 0 }
      if (mail.type === 'Incoming') {
        entry.entrant += 1
      } else if (mail.type === 'Outgoing') {
        entry.sortant += 1
      } else {
        entry.entrant += 1
      }
      monthMap.set(month, entry)
    })

    return Array.from(monthMap.values()).slice(-4)
  }, [mails])

  const distributionData = useMemo(() => {
    if (mails.length === 0) {
      return [
        { name: 'Scolarité', value: 35 },
        { name: 'Direction', value: 20 },
        { name: 'Finances', value: 15 },
        { name: 'Juridique', value: 10 },
        { name: 'Recherche', value: 12 },
        { name: 'Informatique', value: 8 },
      ]
    }

    const counts: Record<string, number> = {}
    mails.forEach((mail) => {
      const key = mail.category || 'Sans catégorie'
      counts[key] = (counts[key] || 0) + 1
    })

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [mails])

  const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  const totalEntrant = mails.filter((mail) => mail.type === 'Incoming').length
  const totalSortant = mails.filter((mail) => mail.type === 'Outgoing').length
  const totalPending = mails.filter((mail) => mail.status !== 'Traité').length
  const totalOverdue = mails.filter((mail) => mail.isOverdue).length

  const stats = [
    {
      title: 'Courrier Entrant',
      value: String(totalEntrant),
      meta: '+12% vs mois dernier',
      icon: Inbox,
      trend: 'up',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Courrier Sortant',
      value: String(totalSortant),
      meta: '+5% vs mois dernier',
      icon: Send,
      trend: 'up',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'En attente',
      value: String(totalPending),
      meta: '8 assignés, 7 en cours',
      icon: Clock,
      trend: 'neutral',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'En retard',
      value: String(totalOverdue),
      meta: 'Action requise',
      icon: AlertTriangle,
      trend: 'down',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
  ];

  const urgentMails = useMemo(() => {
    if (mails.length === 0) {
      return [
        {
          id: 'CE-2026-0142',
          subject: 'Demande de stage PFE - Lot 12 études...',
          sender: 'Université Blida',
          dueDate: '2026-04-14',
          priority: 'Urgent',
          status: 'Enregistré',
        },
        {
          id: 'CI-2026-0034',
          subject: 'Note de service - Examens S2',
          sender: 'Direction',
          dueDate: '2026-04-10',
          priority: 'Urgent',
          status: 'En cours',
        },
        {
          id: 'CE-2026-0139',
          subject: 'Réclamation étudiant - Note contestée',
          sender: 'Étudiant Benali K.',
          dueDate: '2026-04-09',
          priority: 'Urgent',
          status: 'En révision',
        },
      ]
    }
    return mails.filter((mail) => mail.priority === 'Urgent').slice(0, 3)
  }, [mails])

  const navPrimary = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid, badge: null },
    { id: 'dispatcher', label: 'Dispatcher', icon: Mail, badge: '4' },
    { id: 'inbox', label: 'Courrier Entrant', icon: Inbox, badge: null },
    { id: 'outbox', label: 'Courrier Sortant', icon: Send, badge: null },
    { id: 'internal', label: 'Courrier Interne', icon: Mail, badge: null },
    { id: 'tracking', label: 'Mon Suivi', icon: Search, badge: null },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-slate-900 text-white flex flex-col overflow-y-auto shadow-lg">
          {/* Brand */}
          <div className="p-7">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-lg">
                N
              </div>
              <div>
                <p className="font-bold text-base leading-tight">NexusMail</p>
                <p className="text-slate-400 text-xs">Gestion des Courriers</p>
              </div>
            </div>
          </div>

          {/* Navigation Primary */}
          <nav className="px-4 py-6 flex-1">
            <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Principal</p>
            <div className="space-y-2">
              {navPrimary.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveNav(item.id);
                      if (item.id === 'dispatcher') {
                        onNavigate('dispatcher');
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Administration */}
            <div className="mt-8">
              <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Administration</p>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition-all">
                  <BarChart3 size={20} />
                  <span className="text-sm font-medium">Statistiques</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 transition-all">
                  <Settings size={20} />
                  <span className="text-sm font-medium">Paramètres</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Assistant Box */}
          <div className="m-4 p-5 rounded-2xl bg-slate-800 bg-opacity-60 border border-slate-700">
            <p className="font-bold text-sm mb-2">IA Assistant actif</p>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Analyse en temps réel des courriers et suggestions automatiques.
            </p>
            <span className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
              IA
            </span>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="flex items-center justify-between px-8 py-4 gap-6">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="search"
                    placeholder="Rechercher un courrier... (IA)"
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <Bell size={20} className="text-slate-600" />
                </button>
                <button className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <Moon size={20} className="text-slate-600" />
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
                    DK
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">Dr. Khelifi</p>
                    <p className="text-xs text-slate-500">Directeur</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-8 space-y-8">
            {/* Hero Section */}
            <section className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-2">TABLEAU DE BORD</p>
                <h1 className="text-3xl font-bold text-slate-900">Vue d'ensemble de la gestion des courriers</h1>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition-colors">
                  4 courriers à dispatcher
                </button>
                <button
                  onClick={() => onNavigate('dispatcher')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2"
                >
                  Dispatcher <ChevronRight size={18} />
                </button>
              </div>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-4 gap-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className={`${stat.bgColor} rounded-2xl p-6 shadow-sm border border-slate-100`}>
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-slate-700 font-semibold text-sm">{stat.title}</p>
                      <div className={`${stat.iconColor}`}>
                        <Icon size={24} />
                      </div>
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900 mb-3">{stat.value}</h2>
                    <p className="text-sm text-slate-600">{stat.meta}</p>
                  </div>
                );
              })}
            </section>

            {/* Insights Card */}
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start gap-8">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                    <TrendingUp size={18} /> INSIGHTS IA
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    Le temps de traitement moyen a diminué de 18% ce mois-ci.
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    3 courriers dépassent leur échéance et nécessitent une action immédiate. Le Service Scolarité traite 40% du volume total.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-50 border border-green-200">
                    <CheckCircle size={18} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Performance ↑</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-50 border border-red-200">
                    <AlertTriangle size={18} className="text-red-600" />
                    <span className="text-sm font-semibold text-red-700">3 retards</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Charts Grid */}
            <section className="grid grid-cols-3 gap-6">
              {/* Line Chart */}
              <div className="col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Évolution du flux courrier</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mailFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="entrant"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', r: 5 }}
                      name="Entrant"
                    />
                    <Line
                      type="monotone"
                      dataKey="sortant"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ fill: '#16a34a', r: 5 }}
                      name="Sortant"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Distribution par service</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-2">
                  {distributionData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx] }}
                      />
                      <span className="text-slate-700">{item.name}</span>
                      <span className="text-slate-500 ml-auto font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Urgent Mails Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex justify-between items-center p-8 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="text-red-600" />
                  <h3 className="text-lg font-bold text-slate-900">Courriers urgents & à dispatcher</h3>
                </div>
                <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-2">
                  Voir tout <ChevronRight size={16} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">N° Chrono</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Objet</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Expéditeur</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Échéance</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Priorité</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgentMails.map((mail) => (
                      <tr key={mail.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4 font-mono font-semibold text-slate-900">{mail.id}</td>
                        <td className="px-8 py-4 text-slate-700">{mail.subject}</td>
                        <td className="px-8 py-4 text-slate-600">{mail.sender}</td>
                        <td className="px-8 py-4 text-slate-600">{mail.dueDate}</td>
                        <td className="px-8 py-4">
                          <span className="px-3 py-1 rounded-lg bg-red-100 text-red-700 font-semibold text-xs">
                            {mail.priority}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <span
                            className={`px-3 py-1 rounded-lg font-semibold text-xs ${
                              mail.status === 'Enregistré'
                                ? 'bg-blue-100 text-blue-700'
                                : mail.status === 'En cours'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {mail.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;