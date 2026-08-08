import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../services/api'
import type { UserProfile, MfaClientState } from '../types'

interface AuthState {
  user: UserProfile | null
  token: string | null
  loading: boolean
  /** Ritorna l'oggetto mfa dalla LoginResponse così il chiamante può leggere setup_required */
  login: (email: string, password: string, otp?: string, loginContextToken?: string | null) => Promise<MfaClientState>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  hasRole: (roleCodes: string[]) => boolean
  hasPermission: (permissionCode: string) => boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'))
  const [loading, setLoading] = useState(true)

  const saveToken = useCallback((t: string) => {
    localStorage.setItem('access_token', t)
    setToken(t)
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem('access_token')
    setToken(null)
    setUser(null)
  }, [])

  // Carica profilo utente all'avvio se c'è già un token
  const refresh = useCallback(async () => {
    if (!localStorage.getItem('access_token')) {
      setLoading(false)
      return
    }
    try {
      const u = await authApi.me()
      setUser(u)
    } catch {
      clearAuth()
    } finally {
      setLoading(false)
    }
  }, [clearAuth])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string, otp?: string, loginContextToken?: string | null) => {
    const resp = await authApi.login({
      email,
      password,
      otp: otp ?? null,
      device_name: navigator.userAgent.slice(0, 100),
      login_context_token: loginContextToken ?? null,
    })
    saveToken(resp.access_token)
    // Carica profilo completo solo se non è richiesto il setup MFA
    // (setup_required = true significa che non ha ancora configurato MFA)
    if (!resp.mfa.setup_required) {
      const fullUser = await authApi.me()
      setUser(fullUser)
    }
    // Restituisce lo stato MFA al chiamante per decidere il redirect
    return resp.mfa
  }, [saveToken])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignora */ }
    clearAuth()
  }, [clearAuth])

  const hasRole = useCallback((roleCodes: string[]) => {
    if (!user?.user_facility_roles) return false
    const normalized = roleCodes.map((c) => c.toLowerCase())
    return user.user_facility_roles
      .filter((fr) => fr.is_active !== false)
      .some((fr) => fr.role && normalized.includes(fr.role.code.toLowerCase()))
  }, [user])

  // Controlla permesso effettivo da capabilities (richiesta 006)
  const hasPermission = useCallback((permissionCode: string) => {
    return user?.capabilities?.permissions?.includes(permissionCode) ?? false
  }, [user])

  const value = useMemo<AuthState>(() => ({
    user,
    token,
    loading,
    login,
    logout,
    refresh,
    hasRole,
    hasPermission,
    isAuthenticated: !!user && !!token,
  }), [user, token, loading,login, logout, refresh, hasRole, hasPermission])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used in useAuthContext')
  return ctx
}
