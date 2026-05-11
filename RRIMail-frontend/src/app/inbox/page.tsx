import React, { useState, useEffect, useMemo } from 'react'
import {
  LayoutGrid,
  Inbox,
  Send,
  Mail,
  Search,
  Settings,
  Bell,
  Moon,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Plus,
  X,
  Upload,
  ChevronDown,
  Sparkles,
} from 'lucide-react'

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
  const statusMap: Record<string, string> = {
    Registered: 'Enregistré',
    'Under Review': 'En révision',
    Assigned: 'Assigné',
    'In Progress': 'En cours',
    Processed: 'Traité',
  }
  return statusMap[status] || status
}

function normalizePriority(priority: string) {
  const priorityMap: Record<string, string> = {
    Low: 'Faible',
    Medium: 'Normal',
    High: 'Normal',
    Urgent: 'Urgent',
  }
  return priorityMap[priority] || 'Normal'
}

async function fetchIncomingMails(): Promise<any[]> {
  const response = await fetch(`${apiBaseUrl}/mails?type=Incoming&limit=100`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    } as Record<string, string>,
  })
  const payload = await response.json()
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Impossible de récupérer les courriers')
  }
  return payload.data || []
}

async function createMail(data: any): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/mails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    } as Record<string, string>,
    body: JSON.stringify(data),
  })
  const payload = await response.json()
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Impossible d'enregistrer le courrier")
  }
  return payload.data
}

type InboxPageProps = {
  onNavigate?: (page: 'dashboard' | 'dispatcher' | 'inbox') => void
}

export default function InboxPage({ onNavigate }: InboxPageProps) {
  const [activeNav, setActiveNav] = useState('inbox')
  const [mails, setMails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterService, setFilterService] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    subject: '',
    sender: '',
    type: 'Incoming',
    priority: 'Medium',
    description: '',
    slaDeadline: '',
    category: '',
  })

  // Load mails on mount
  useEffect(() => {
    const loadMails = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchIncomingMails()
        setMails(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    loadMails()
  }, [])

  const filteredMails = useMemo(() => {
    return mails.filter((mail) => {
      const matchesSearch =
        mail.subject?.toLowerCase().includes(search.toLowerCase()) ||
        mail.sender?.toLowerCase().includes(search.toLowerCase()) ||
        mail._id?.toLowerCase().includes(search.toLowerCase())

      const matchesType = filterType === 'all' || mail.type === filterType
      const matchesService =
        filterService === 'all' || (mail.category?.name || mail.category) === filterService

      return matchesSearch && matchesType && matchesService
    })
  }, [mails, search, filterType, filterService])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.subject || !formData.sender) {
      setError('Veuillez remplir les champs obligatoires')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const mailPayload = {
        subject: formData.subject,
        sender: formData.sender,
        type: 'Incoming',
        priority: formData.priority,
        description: formData.description,
        slaDeadline: formData.slaDeadline || null,
        category: formData.category || null,
      }

      const newMail = await createMail(mailPayload)
      setMails([newMail, ...mails])
      setIsModalOpen(false)
      setFormData({
        subject: '',
        sender: '',
        type: 'Incoming',
        priority: 'Medium',
        description: '',
        slaDeadline: '',
        category: '',
      })
      setUploadedFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    const files = 'dataTransfer' in e ? e.dataTransfer.files : e.currentTarget.files
    if (files && files[0]) {
      setUploadedFile(files[0])
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-700'
      case 'Normal':
        return 'bg-blue-100 text-blue-700'
      case 'Faible':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Enregistré':
        return 'bg-blue-100 text-blue-700'
      case 'En révision':
        return 'bg-purple-100 text-purple-700'
      case 'Assigné':
        return 'bg-green-100 text-green-700'
      case 'En cours':
        return 'bg-amber-100 text-amber-700'
      case 'Traité':
        return 'bg-emerald-100 text-emerald-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const navPrimary = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutGrid },
    { id: 'dispatcher', label: 'Dispatcher', icon: Mail, badge: '4' },
    { id: 'inbox', label: 'Courrier Entrant', icon: Inbox },
    { id: 'outbox', label: 'Courrier Sortant', icon: Send },
    { id: 'internal', label: 'Courrier Interne', icon: Mail },
    { id: 'tracking', label: 'Mon Suivi', icon: Search },
  ]

  const services = ['Scolarité', 'Direction', 'Finances', 'Juridique', 'Informatique', 'Ressources Humaines']

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-slate-950 text-white flex flex-col overflow-y-auto shadow-lg">
          <div className="p-7 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-lg">
                N
              </div>
              <div>
                <p className="font-bold text-base">NexusMail</p>
                <p className="text-slate-400 text-xs">Gestion des Courriers</p>
              </div>
            </div>
          </div>

          <nav className="px-4 py-6 flex-1 space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Principal</p>
              <div className="space-y-2">
                {navPrimary.map((item) => {
                  const Icon = item.icon
                  const isActive = activeNav === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveNav(item.id)
                        if (item.id === 'dashboard') onNavigate?.('dashboard')
                        else if (item.id === 'dispatcher') onNavigate?.('dispatcher')
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
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
                  )
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Administration</p>
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

          <div className="m-4 p-5 rounded-2xl bg-slate-800/60 border border-slate-700">
            <div className="flex items-start gap-3 mb-3">
              <Sparkles size={18} className="text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-sm">IA Assistant actif</p>
                <p className="text-xs text-slate-400 mt-1">Analyse des courriers en temps réel.</p>
              </div>
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
              IA
            </span>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
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
          <div className="p-8 space-y-6">
            {/* Header Section */}
            <section className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Courrier Entrant</h1>
                <p className="text-slate-600 mt-1">{filteredMails.length} courriers enregistrés</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg transition-all"
              >
                <Plus size={20} />
                Nouveau courrier
              </button>
            </section>

            {/* Error Alert */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">{error}</p>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <section className="flex gap-4 items-center bg-white rounded-xl p-4 border border-slate-100">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm"
                />
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="appearance-none px-4 py-2 pr-10 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm bg-white cursor-pointer"
                  >
                    <option value="all">Tous les types</option>
                    <option value="Incoming">Entrant</option>
                    <option value="Outgoing">Sortant</option>
                    <option value="Internal">Interne</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={filterService}
                    onChange={(e) => setFilterService(e.target.value)}
                    className="appearance-none px-4 py-2 pr-10 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm bg-white cursor-pointer"
                  >
                    <option value="all">Tous les services</option>
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </section>

            {/* Table */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">N° Chrono</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Date</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Expéditeur</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Objet</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Service</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Échéance</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Priorité</th>
                      <th className="px-8 py-4 text-left font-semibold text-slate-700">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-8 py-8 text-center">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin">
                              <Clock className="text-blue-600" size={24} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredMails.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-8 py-8 text-center text-slate-500">
                          Aucun courrier trouvé
                        </td>
                      </tr>
                    ) : (
                      filteredMails.map((mail) => (
                        <tr key={mail._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4 font-mono font-semibold text-slate-900">
                            {mail.referenceNumber || mail._id?.slice(-6)}
                          </td>
                          <td className="px-8 py-4 text-slate-600">{formatDate(mail.createdAt)}</td>
                          <td className="px-8 py-4 text-slate-600">{mail.sender}</td>
                          <td className="px-8 py-4 text-slate-700 max-w-xs truncate">{mail.subject}</td>
                          <td className="px-8 py-4 text-slate-600">
                            {mail.category?.name || mail.category || '—'}
                          </td>
                          <td className="px-8 py-4 text-slate-600">{formatDate(mail.slaDeadline)}</td>
                          <td className="px-8 py-4">
                            <span
                              className={`px-3 py-1 rounded-lg font-semibold text-xs ${getPriorityColor(
                                normalizePriority(mail.priority)
                              )}`}
                            >
                              {normalizePriority(mail.priority)}
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            <span
                              className={`px-3 py-1 rounded-lg font-semibold text-xs inline-flex items-center gap-2 ${getStatusColor(
                                normalizeStatus(mail.status)
                              )}`}
                            >
                              <span className="w-2 h-2 rounded-full bg-current"></span>
                              {normalizeStatus(mail.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">Enregistrer un nouveau courrier</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setError(null)
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Upload Zone */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">Document scanné</label>
                <div
                  onDrop={handleFileUpload}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-blue-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <Upload size={40} className="text-blue-400 mb-3" />
                  <p className="text-center">
                    <span className="font-semibold text-slate-900">Glissez votre PDF ici</span>
                    <br />
                    <span className="text-slate-500 text-sm">ou cliquez pour sélectionner</span>
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadedFile && (
                    <p className="text-sm text-green-600 font-semibold mt-3">
                      ✓ {uploadedFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Grid Form */}
              <div className="grid grid-cols-2 gap-6">
                {/* Type de support */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Type de support</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white cursor-pointer text-sm"
                  >
                    <option value="Incoming">Papier</option>
                    <option value="Digital">Numérique</option>
                  </select>
                </div>

                {/* Priorité */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Priorité</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white cursor-pointer text-sm"
                  >
                    <option value="Low">Faible</option>
                    <option value="Medium">Normal</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                {/* Expéditeur */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Expéditeur *</label>
                  <input
                    type="text"
                    value={formData.sender}
                    onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                    placeholder="Nom de l'expéditeur"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm"
                    required
                  />
                </div>

                {/* Service destinataire */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Service destinataire</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white cursor-pointer text-sm"
                  >
                    <option value="">Sélectionner un service</option>
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Objet */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Objet *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Objet du courrier"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm"
                  required
                />
              </div>

              {/* Date limite de traitement */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Date limite de traitement</label>
                <input
                  type="date"
                  value={formData.slaDeadline}
                  onChange={(e) => setFormData({ ...formData, slaDeadline: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm"
                />
              </div>

              {/* Notes supplémentaires */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Notes supplémentaires</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Observations éventuelles..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setError(null)
                  }}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.subject || !formData.sender}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer & Envoyer au Directeur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}