import { useState, type FormEvent } from 'react'

type StatusType = '' | 'error' | 'success'

type Status = {
  type: StatusType
  message: string
}

type AuthUser = {
  id?: string
  email: string
  name?: string
  role?: string
}

type AuthResponse = {
  success?: boolean
  message?: string
  data?: {
    user?: AuthUser
    accessToken?: string
    refreshToken?: string
  }
}

const initialStatus: Status = { type: '', message: '' }
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api'
const signUpRoles = ['Secretary', 'Professor', 'Service Lead', 'Director', 'Admin'] as const

export default function LoginPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState<boolean>(true)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [role, setRole] = useState<(typeof signUpRoles)[number]>('Secretary')
  const [loading, setLoading] = useState<boolean>(false)
  const [status, setStatus] = useState<Status>(initialStatus)

  const resetStatus = () => setStatus(initialStatus)

  const storeAuthSession = (data: NonNullable<AuthResponse['data']>) => {
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken)
    }

    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken)
    }

    if (data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user))
    }
  }

  const parseAuthResponse = async (response: Response) => {
    const payload = (await response.json()) as AuthResponse

    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || 'Une erreur est survenue')
    }

    return payload
  }

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetStatus()
    setLoading(true)

    try {
      if (!email || !password) {
        throw new Error('Veuillez remplir tous les champs')
      }

      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const payload = await parseAuthResponse(response)
      storeAuthSession(payload.data ?? {})

      setStatus({ type: 'success', message: payload.message || 'Connexion réussie.' })
    } catch (error: unknown) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur de connexion',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetStatus()

    if (!name || !email || !password || !confirmPassword) {
      setStatus({ type: 'error', message: 'Veuillez remplir tous les champs' })
      return
    }

    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Les mots de passe ne correspondent pas' })
      return
    }

    if (password.length < 8) {
      setStatus({ type: 'error', message: 'Le mot de passe doit contenir au moins 8 caractères' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      })

      const payload = await parseAuthResponse(response)
      setStatus({ type: 'success', message: payload.message || 'Compte créé avec succès.' })
      setIsLogin(true)
      setConfirmPassword('')
    } finally {
      setLoading(false)
    }
  }

  const title = isLogin ? 'Bon retour' : 'Créer un compte'
  const subtitle = isLogin
    ? 'Connectez-vous à votre espace RRIMail.'
    : 'Créez un compte RRIMail connecté au backend.'

  return (
    <main className="login-shell">
      <section className="login-brand">
        <div className="brand-card">
          <p className="eyebrow">RRIMail</p>
          <h1>Messagerie institutionnelle</h1>
        
          
        </div>
      </section>

      <section className="form-panel">
        <div className="form-card">
          <div className="toggle-row" role="tablist" aria-label="Choix du formulaire">
            <button
              type="button"
              className={isLogin ? 'active' : ''}
              onClick={() => {
                setIsLogin(true)
                resetStatus()
              }}
            >
              Connexion
            </button>
            <button
              type="button"
              className={isLogin ? '' : 'active'}
              onClick={() => {
                setIsLogin(false)
                resetStatus()
              }}
            >
              Inscription
            </button>
          </div>

          <h2>{title}</h2>
          <p className="subtext">{subtitle}</p>

          <form onSubmit={isLogin ? handleLoginSubmit : handleSignupSubmit}>
            {!isLogin && (
              <div className="field">
                <label htmlFor="name">Nom complet</label>
                <div className="input-wrap">
                  <span className="input-icon">#</span>
                  <input
                    id="name"
                    type="text"
                    className="form-input"
                    placeholder="Votre nom"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email professionnel</label>
              <div className="input-wrap">
                <span className="input-icon">@</span>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="vous@institution.dz"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <div className="password-row">
                <div>
                  <label htmlFor="password">Mot de passe</label>
                  <div className="input-wrap">
                    <span className="input-icon">*</span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="field">
                <label htmlFor="role">Rôle</label>
                <div className="input-wrap">
                  <span className="input-icon">%</span>
                  <select
                    id="role"
                    className="form-input"
                    value={role}
                    onChange={(event) => setRole(event.target.value as (typeof signUpRoles)[number])}
                  >
                    {signUpRoles.map((currentRole) => (
                      <option key={currentRole} value={currentRole}>
                        {currentRole}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="field">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <div className="input-wrap">
                  <span className="input-icon">*</span>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {status.message ? (
              <div className={`status ${status.type}`}>{status.message}</div>
            ) : null}

            <button className="primary-btn" type="submit" disabled={loading}>
              {loading ? 'Traitement en cours...' : isLogin ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>

          <p className="footer-text">
            {isLogin ? 'Pas encore de compte ?' : 'Vous avez déjà un compte ?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin((value) => !value)
                resetStatus()
                setConfirmPassword('')
              }}
            >
              {isLogin ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}