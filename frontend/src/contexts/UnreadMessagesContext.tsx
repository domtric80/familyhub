import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { internalMessageApi, staffMemberApi } from '../services/api'
import { useAuth } from './AuthContext'

interface UnreadMessagesContextValue {
  totalUnread: number
  /** Risolve lo user_id in un nome leggibile usando la mappa degli staff member */
  getUserName: (userId: number | null | undefined, fallback?: string) => string
  refresh: () => void
}

const UnreadMessagesContext = createContext<UnreadMessagesContextValue>({
  totalUnread: 0,
  getUserName: (_id, fb) => fb ?? 'Utente',
  refresh: () => {},
})

const POLL_INTERVAL_MS = 30_000

export function UnreadMessagesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [totalUnread, setTotalUnread] = useState(0)
  // mappa user_id → nome visualizzato
  const [userNameMap, setUserNameMap] = useState<Map<number, string>>(new Map())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /** Carica staff member e costruisce la mappa user_id → nome */
  const loadUserNames = async () => {
    try {
      const members = await staffMemberApi.list()
      const map = new Map<number, string>()
      for (const m of members) {
        if (m.user_id) {
          const name =
            m.display_name?.trim() ||
            `${m.last_name} ${m.first_name}`.trim() ||
            m.email?.trim() ||
            `Operatore #${m.user_id}`
          map.set(m.user_id, name)
        }
      }
      setUserNameMap(map)
    } catch {
      // Endpoint non disponibile o permessi insufficienti — la mappa rimane vuota
    }
  }

  const refreshThreads = async () => {
    if (!isAuthenticated) return
    try {
      const threads = await internalMessageApi.listThreads()
      const total = threads.reduce((sum, t) => sum + (t.unread_count ?? 0), 0)
      setTotalUnread(total)
    } catch {
      // Backend messaggistica non disponibile
    }
  }

  const refresh = useCallback(() => {
    refreshThreads()
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!isAuthenticated) return
    loadUserNames()
    refreshThreads()
    intervalRef.current = setInterval(refreshThreads, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isAuthenticated]) // eslint-disable-line

  const getUserName = useCallback(
    (userId: number | null | undefined, fallback = 'Utente'): string => {
      if (!userId) return fallback
      return userNameMap.get(userId) ?? fallback
    },
    [userNameMap]
  )

  return (
    <UnreadMessagesContext.Provider value={{ totalUnread, getUserName, refresh }}>
      {children}
    </UnreadMessagesContext.Provider>
  )
}

export function useUnreadMessages() {
  return useContext(UnreadMessagesContext)
}
