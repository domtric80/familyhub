import { useEffect, useState, type FormEvent } from 'react'
import { Shield, CheckCircle, Copy } from 'react-feather'
import { authApi, apiError } from '../../services/api'
import type { MfaSetupResponse } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

export default function MfaSetupPage() {
  const { user, refresh } = useAuth()
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user?.mfa && !user.mfa.setup_required) {
      window.location.replace('/dashboard')
      return
    }

    authApi.me()
      .then((profile) => {
        if (profile.mfa && !profile.mfa.setup_required) {
          window.location.replace('/dashboard')
          return null
        }

        return authApi.setupMfa()
      })
      .then((response) => {
        if (!response) return

        setSetup(response)
        if (response.already_enabled) {
          refresh().finally(() => window.location.replace('/dashboard'))
        }
      })
      .catch(() => setError('Impossibile avviare setup MFA'))
  }, [refresh, user])

  const copySecret = () => {
    if (setup?.secret) {
      navigator.clipboard.writeText(setup.secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await authApi.confirmMfa(code)
      await refresh()
      window.location.replace('/dashboard')
    } catch (err) {
      setError(apiError(err).message ?? 'Codice non valido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8fb' }}>
      <div className='card' style={{ maxWidth: 480, width: '100%', padding: 40, borderRadius: 16, boxShadow: '0 8px 40px rgba(115,102,255,0.12)' }}>
        <div className='text-center mb-4'>
          <Shield size={52} color='#7366ff' />
          <h4 style={{ marginTop: 16, fontWeight: 700 }}>Configura l'autenticazione a due fattori</h4>
          <p style={{ color: '#8d8d8d' }}>Richiesta per il tuo ruolo. Scansiona il QR con Google Authenticator o Authy.</p>
        </div>

        {error && <div className='alert alert-danger'>{error}</div>}

        {setup ? (
          <>
            {/* QR Code tramite Google Charts API */}
            <div className='text-center mb-4'>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup.otp_auth_url ?? '')}`}
                alt='QR Code MFA'
                style={{ borderRadius: 8, border: '1px solid #eee', padding: 8 }}
              />
            </div>

            {/* Codice segreto manuale */}
            <div style={{ background: '#f0eeff', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <code style={{ fontSize: 14, letterSpacing: 2, color: '#7366ff', wordBreak: 'break-all' }}>{setup.secret}</code>
              <button onClick={copySecret} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7366ff', marginLeft: 8 }}>
                {copied ? <CheckCircle size={18} color='#28a745' /> : <Copy size={18} />}
              </button>
            </div>

            {/* Codici di recupero */}
            {setup.recovery_codes.length > 0 && (
              <div style={{ background: '#fff8e1', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>⚠️ Codici di recupero (salvali in luogo sicuro)</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {setup.recovery_codes.map((c) => (
                    <code key={c} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>{c}</code>
                  ))}
                </div>
              </div>
            )}

            {/* Verifica codice */}
            <form onSubmit={handleConfirm}>
              <div className='form-group'>
                <label className='col-form-label'>Inserisci il codice dall'app per confermare</label>
                <input
                  className='form-control'
                  type='text'
                  inputMode='numeric'
                  maxLength={6}
                  pattern='[0-9]{6}'
                  placeholder='000000'
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ letterSpacing: 8, textAlign: 'center', fontSize: 24, padding: '12px 0' }}
                  autoFocus
                />
              </div>
              <button
                type='submit'
                className='btn btn-primary btn-block'
                disabled={loading || code.length < 6}
                style={{ width: '100%', padding: '12px 0', marginTop: 8, borderRadius: 8 }}
              >
                {loading ? 'Verifica in corso…' : 'Conferma e attiva MFA'}
              </button>
            </form>
          </>
        ) : (
          <div className='text-center' style={{ padding: 40 }}>
            <div className='loader'></div>
          </div>
        )}
      </div>
    </div>
  )
}
