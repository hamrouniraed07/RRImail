import { useReducer, useState, useMemo, createContext, useContext, useEffect } from 'react'
import {
  LayoutGrid,
  Inbox,
  Send,
  Mail,
  Search,
  Bell,
  Moon,
  BarChart3,
  Settings,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight,
  FileText,
  X,
  Loader,
} from 'lucide-react'

// ============ TYPES & CONSTANTS ============

type MailItem = {
  id: string
  subject: string
  sender: string
  dueDate: string
  receivedDate: string
  priority: 'Urgent' | 'Normal' | 'Faible'
  status: 'Enregistré' | 'En révision' | 'Assigné' | 'En cours' | 'Traité'
  summary: string
  category: string
  documentContent?: string
  suggestedService?: string
  aiConfidence?: number
  assignedTo?: string
  notes?: string
  dispatchHistory?: {
    timestamp: string
    service: string
    instructions: string
    dispatchedBy: string
  }[]
}

type MailAction =
  | { type: 'FETCH_MAILS'; payload: MailItem[] }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: MailItem['status'] } }
  | { type: 'ASSIGN_MAIL'; payload: { id: string; service: string; instructions: string } }
  | { type: 'ADD_NOTE'; payload: { id: string; note: string } }
  | { type: 'LOADING'; payload: boolean }

type MailState = {
  mails: MailItem[]
  loading: boolean
  error: string | null
}

const SERVICES = ['Scolarité', 'Direction', 'Finances', 'Juridique', 'Ressources Humaines']

const INITIAL_MAILS: MailItem[] = [
  {
    id: 'CE-2026-0142',
    subject: 'Demande de stage PFE - Lot 12 étudiants',
    sender: 'Université Blida',
    receivedDate: '2026-04-07',
    dueDate: '2026-04-14',
    priority: 'Urgent',
    status: 'Enregistré',
    summary: "Demande de stage PFE pour 12 étudiants en informatique de l'Université de Blida. Convention de partenariat requise avant le 2026-04-14.",
    category: 'Stage / PFE',
    suggestedService: 'Scolarité',
    aiConfidence: 92,
    documentContent: `RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
Ministère de l'Enseignement Supérieur
Université de Blida

Objet: Demande de stage PFE - Lot 12 étudiants

Monsieur le Directeur,
J'ai l'honneur de porter à votre connaissance que dans le cadre de la formation de nos étudiants en Master 2 Informatique, nous souhaitons établir une convention de stage pour un groupe de 12 étudiants.

Nous vous prions de bien vouloir examiner cette demande et de nous communiquer votre décision dans les meilleurs délais.

Veuillez agréer l'expression de nos salutations distinguées.
Le Vice-Recteur chargé de la Formation Supérieure`,
  },
  {
    id: 'CE-2026-0141',
    subject: 'Convention de coopération internationale',
    sender: 'Ambassade de France',
    receivedDate: '2026-04-05',
    dueDate: '2026-04-20',
    priority: 'Normal',
    status: 'En révision',
    summary: "Proposition de convention de coopération internationale pour échanges académiques entre universités.",
    category: 'Convention',
    suggestedService: 'Direction',
    aiConfidence: 85,
  },
  {
    id: 'CE-2026-0139',
    subject: 'Réclamation étudiant - Note contestée',
    sender: 'Étudiant Benali K.',
    receivedDate: '2026-04-02',
    dueDate: '2026-04-09',
    priority: 'Urgent',
    status: 'En révision',
    summary: "Réclamation concernant une note contestée en examen final, demande de réévaluation par le comité pédagogique.",
    category: 'Réclamation',
    suggestedService: 'Scolarité',
    aiConfidence: 88,
  },
  {
    id: 'CE-2026-0137',
    subject: 'Offre de formation continue - IA & Data',
    sender: 'Google Education',
    receivedDate: '2026-03-28',
    dueDate: '2026-04-18',
    priority: 'Faible',
    status: 'Assigné',
    summary: "Proposition d'offre de formation continue en IA et data science pour les enseignants et le personnel administratif.",
    category: 'Formation',
    suggestedService: 'Direction',
    aiConfidence: 78,
    assignedTo: 'Direction',
  },
]

// ============ REDUCER (Business Logic) ============

function mailReducer(state: MailState, action: MailAction): MailState {
  switch (action.type) {
    case 'FETCH_MAILS':
      return { ...state, mails: action.payload, loading: false, error: null }
    
    case 'UPDATE_STATUS':
      return {
        ...state,
        mails: state.mails.map((mail) =>
          mail.id === action.payload.id ? { ...mail, status: action.payload.status } : mail
        ),
      }
    
    case 'ASSIGN_MAIL':
      return {
        ...state,
        mails: state.mails.map((mail) =>
          mail.id === action.payload.id
            ? {
                ...mail,
                assignedTo: action.payload.service,
                status: 'Assigné',
                dispatchHistory: [
                  ...(mail.dispatchHistory || []),
                  {
                    timestamp: new Date().toLocaleString('fr-FR'),
                    service: action.payload.service,
                    instructions: action.payload.instructions,
                    dispatchedBy: 'Dr. Khelifi',
                  },
                ],
              }
            : mail
        ),
      }
    
    case 'ADD_NOTE':
      return {
        ...state,
        mails: state.mails.map((mail) =>
          mail.id === action.payload.id ? { ...mail, notes: action.payload.note } : mail
        ),
      }
    
    case 'LOADING':
      return { ...state, loading: action.payload }
    
    default:
      return state
  }
}

// ============ CONTEXT (Global State) ============

const MailContext = createContext<{
  state: MailState
  dispatch: React.Dispatch<MailAction>
} | null>(null)

function useMailContext() {
  const ctx = useContext(MailContext)
  if (!ctx) throw new Error('useMailContext doit être dans MailProvider')
  return ctx
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function getCurrentUserId() {
  const stored = localStorage.getItem('currentUser')
  if (!stored) throw new Error('Utilisateur non authentifié')
  const user = JSON.parse(stored)
  return user._id || user.id || user.userId || ''
}

function formatDate(dateString: string | Date | null | undefined) {
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
    case 'High':
      return 'Normal'
    case 'Urgent':
      return 'Urgent'
    default:
      return 'Normal'
  }
}

function normalizeMail(mail: any): MailItem {
  return {
    id: mail._id || mail.id,
    subject: mail.subject || 'Sans objet',
    sender: mail.sender || 'Expéditeur inconnu',
    receivedDate: formatDate(mail.createdAt || mail.receivedDate),
    dueDate: formatDate(mail.slaDeadline || mail.dueDate),
    priority: normalizePriority(mail.priority),
    status: normalizeStatus(mail.status) as MailItem['status'],
    summary: mail.aiSummary || mail.description || '',
    category: mail.category?.name || mail.category || 'Sans catégorie',
    documentContent: mail.pdfUrl || mail.description || '',
    suggestedService: mail.aiSuggestedDepartment || mail.suggestedService,
    aiConfidence: mail.aiConfidenceScore ? Math.round(mail.aiConfidenceScore * 100) : mail.aiConfidence,
    assignedTo:
      typeof mail.assignedTo === 'string'
        ? mail.assignedTo
        : mail.assignedTo?.name || mail.assignedTo?.email || '',
    dispatchHistory: mail.statusHistory
      ? mail.statusHistory.map((entry: any) => ({
          timestamp: formatDate(entry.changedAt),
          service: entry.status,
          instructions: entry.note || '',
          dispatchedBy: entry.changedBy?.name || entry.changedBy?.email || 'Système',
        }))
      : mail.dispatchHistory,
  }
}

async function fetchMailsAPI(): Promise<MailItem[]> {
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

async function assignMailAPI(mailId: string, service: string, instructions: string): Promise<void> {
  const currentUserId = getCurrentUserId()
  const response = await fetch(`${apiBaseUrl}/mails/${mailId}/assign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    } as Record<string, string>,
    body: JSON.stringify({
      assignedTo: currentUserId,
      instructions,
    }),
  })

  const payload = await response.json()
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Impossible d’assigner le courrier')
  }
}

// ============ COMPONENTS ============

type DispatcherSidebarProps = {
  activeSection: string
  onSectionChange: (section: string) => void
  onNavigate?: (page: 'dashboard' | 'dispatcher') => void
}

function Sidebar({ activeSection, onSectionChange, onNavigate }: DispatcherSidebarProps) {
  return (
    <aside className="w-72 bg-slate-900 text-white flex flex-col overflow-y-auto shadow-lg">
      <div className="p-7 border-b border-slate-800">
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

      <nav className="px-4 py-6 flex-1">
        <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Principal</p>
        <div className="space-y-2">
          {[
            { label: 'Tableau de bord', icon: LayoutGrid },
            { label: 'Dispatcher', icon: Mail, badge: '4' },
            { label: 'Courrier Entrant', icon: Inbox },
            { label: 'Courrier Sortant', icon: Send },
            { label: 'Courrier Interne', icon: Mail },
            { label: 'Mon Suivi', icon: Search },
          ].map((item) => {
            const Icon = item.icon
            const isActive = item.label === activeSection

            return (
              <button
                key={item.label}
                onClick={() => {
                  onSectionChange(item.label)
                  if (item.label === 'Tableau de bord') {
                    onNavigate?.('dashboard')
                  } else if (item.label === 'Dispatcher') {
                    onNavigate?.('dispatcher')
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
            )
          })}
        </div>

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
  )
}

function MailListView({ selectedMailId, onSelectMail, onDispatch }: any) {
  const { state } = useMailContext()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const filteredMails = useMemo(
    () =>
      state.mails.filter((mail) => {
        const matchesSearch =
          mail.subject.toLowerCase().includes(search.toLowerCase()) ||
          mail.id.toLowerCase().includes(search.toLowerCase()) ||
          mail.sender.toLowerCase().includes(search.toLowerCase())
        const matchesFilter = !filterStatus || mail.status === filterStatus
        return matchesSearch && matchesFilter
      }),
    [search, filterStatus, state.mails]
  )

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
        return 'text-blue-600'
      case 'En révision':
        return 'text-purple-600'
      case 'Assigné':
        return 'text-green-600'
      case 'Traité':
        return 'text-gray-600'
      default:
        return 'text-slate-600'
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4 px-8 py-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              placeholder="Rechercher un courrier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-12 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
              <Bell size={18} />
            </button>
            <button className="p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
              <Moon size={18} />
            </button>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-bold text-white">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="space-y-3">
          {state.loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader className="animate-spin text-blue-600" size={40} />
            </div>
          ) : filteredMails.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <AlertTriangle size={48} className="mx-auto mb-4 text-slate-300" />
              <p>Aucun courrier trouvé</p>
            </div>
          ) : (
            filteredMails.map((mail) => (
              <button
                key={mail.id}
                onClick={() => onSelectMail(mail.id)}
                className={`w-full text-left rounded-2xl border-2 px-6 py-4 shadow-sm transition-all ${
                  selectedMailId === mail.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-xs font-bold uppercase text-slate-500">{mail.id}</p>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getPriorityColor(mail.priority)}`}>
                        {mail.priority}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{mail.subject}</h3>
                    <p className="text-xs text-slate-500 mt-1">{mail.sender}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-semibold ${getStatusColor(mail.status)}`}>{mail.status}</p>
                    {mail.assignedTo && (
                      <p className="text-xs text-green-600 font-semibold mt-1">→ {mail.assignedTo}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{mail.category}</span>
                  <span className="font-medium">{mail.dueDate}</span>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="mt-6 text-center text-sm text-slate-600 font-medium">
          {filteredMails.length} / {state.mails.length} courrier(s)
        </div>
      </div>
    </div>
  )
}

function DetailDrawer({ mail, isOpen, onClose }: any) {
  const { dispatch } = useMailContext()
  const [selectedService, setSelectedService] = useState(mail?.assignedTo || '')
  const [isAssigning, setIsAssigning] = useState(false)
  const [instructions, setInstructions] = useState('')

  const QUICK_INSTRUCTIONS = [
    { label: '🔴 Urgent', text: 'À traiter en priorité' },
    { label: 'ℹ️ Pour info', text: 'Pour information - Classement' },
    { label: '✓ Approuvé', text: 'À approuver et traiter' },
    { label: '📋 À classer', text: 'À archiver après traitement' },
    { label: '⚠️ Vérifier', text: 'À vérifier avant action' },
  ]

  const handleQuickInstruction = (text: string) => {
    setInstructions(text)
  }

  const handleAssign = async () => {
    if (!selectedService) return
    setIsAssigning(true)
    try {
      await assignMailAPI(mail.id, selectedService, instructions)
      dispatch({
        type: 'ASSIGN_MAIL',
        payload: { id: mail.id, service: selectedService, instructions },
      })
      setInstructions('')
      setTimeout(onClose, 300)
    } catch (error) {
      console.error(error)
      window.alert(error instanceof Error ? error.message : 'Erreur lors de l’assignation')
    } finally {
      setIsAssigning(false)
    }
  }

  if (!isOpen || !mail) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-start justify-end">
      <div className="w-96 bg-white h-screen shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="border-b border-slate-100 p-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Détails</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status */}
          <div>
            <p className="text-xs font-bold uppercase text-slate-500 mb-2">Statut Actuel</p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
              <p className="text-sm font-semibold text-slate-900">{mail.status}</p>
            </div>
          </div>

          {/* Document Preview */}
          <div>
            <p className="text-xs font-bold uppercase text-slate-500 mb-2">Document</p>
            <div className="rounded-xl bg-slate-100 p-4 flex items-center justify-center h-32">
              <FileText size={32} className="text-slate-400" />
            </div>
          </div>

          {/* AI Summary */}
          {mail.suggestedService && (
            <div className="rounded-2xl border-l-4 border-l-blue-500 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-blue-600" />
                <p className="text-xs font-bold text-slate-900">Suggestion IA</p>
                <span className="ml-auto text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-lg">
                  {mail.aiConfidence}%
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-5">
                Assigner à <span className="font-bold">{mail.suggestedService}</span>
              </p>
            </div>
          )}

          {/* Service Assignment */}
          <div>
            <p className="text-xs font-bold uppercase text-slate-500 mb-3">Assigner au Service</p>
            <div className="space-y-2">
              {SERVICES.map((service) => (
                <button
                  key={service}
                  onClick={() => setSelectedService(service)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    selectedService === service
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                  }`}
                >
                  {service}
                  {selectedService === service && <CheckCircle size={16} className="inline-block ml-2" />}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500 mb-1">Expéditeur</p>
              <p className="text-sm font-semibold text-slate-900">{mail.sender}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500 mb-1">Catégorie</p>
              <p className="text-sm font-semibold text-slate-900">{mail.category}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500 mb-1">Échéance</p>
              <p className="text-sm font-semibold text-rose-700">{mail.dueDate}</p>
            </div>
          </div>

          {/* Dispatch History */}
          {mail.dispatchHistory && mail.dispatchHistory.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500 mb-3">Historique du Dispatching</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mail.dispatchHistory.map((entry: { timestamp: string; service: string; instructions: string; dispatchedBy: string }, idx: number) => (
                  <div key={idx} className="text-xs border-l-2 border-blue-300 pl-3 py-1">
                    <p className="font-semibold text-slate-900">
                      {entry.service} par {entry.dispatchedBy}
                    </p>
                    <p className="text-slate-600">{entry.instructions}</p>
                    <p className="text-slate-500 text-xs mt-1">{entry.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions Section */}
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Quick Instructions */}
          <div>
            <p className="text-xs font-bold uppercase text-slate-500 mb-2">Instructions Rapides</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_INSTRUCTIONS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleQuickInstruction(item.text)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    instructions === item.text
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
              Instructions Personnalisées
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ajouter une instruction pour le service... (ex: À traiter d'urgence avant la réunion de demain)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 p-6 space-y-3">
          <button
            onClick={handleAssign}
            disabled={!selectedService || isAssigning}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
              isAssigning
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : selectedService
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isAssigning
              ? 'Dispatching en cours...'
              : mail.assignedTo
                ? '✓ Mettre à jour'
                : 'Dispatcher le courrier'}
          </button>
          <button className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">
            Demander plus d'infos
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ MAIN APP ============

type DispatcherPageProps = {
  onBack?: () => void
  onNavigate?: (page: 'dashboard' | 'dispatcher') => void
}

export default function NexusMail({ onBack, onNavigate }: DispatcherPageProps) {
  const [state, dispatch] = useReducer(mailReducer, {
    mails: [],
    loading: true,
    error: null,
  })

  const [selectedMailId, setSelectedMailId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('Dispatcher')

  // Fetch mails on mount
  const loadMails = async () => {
    dispatch({ type: 'LOADING', payload: true })
    const mails = await fetchMailsAPI()
    dispatch({ type: 'FETCH_MAILS', payload: mails })
  }

  useEffect(() => {
    loadMails()
  }, [])

  const selectedMail = state.mails.find((m) => m.id === selectedMailId)

  return (
    <MailContext.Provider value={{ state, dispatch }}>
      <div className="min-h-screen bg-slate-50">
        <div className="flex h-screen overflow-hidden">
          <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} onNavigate={onNavigate} />
          <MailListView
            selectedMailId={selectedMailId}
            onSelectMail={(id: string) => {
              setSelectedMailId(id)
              setDetailOpen(true)
            }}
          />
          <DetailDrawer mail={selectedMail} isOpen={detailOpen} onClose={() => setDetailOpen(false)} />
        </div>
      </div>
    </MailContext.Provider>
  )
}