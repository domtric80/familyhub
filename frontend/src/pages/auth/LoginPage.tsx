import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { apiError, authApi } from '../../services/api'

export default function LoginPage() {
  const { login } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [otp,      setOtp]      = useState('')
  // step: 'credentials' → schermata email+password | 'otp' → schermata codice MFA
  const [step,     setStep]     = useState<'credentials' | 'otp'>('credentials')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [sessionMsg, setSessionMsg] = useState<string | null>(null)
  const [loginContextToken, setLoginContextToken] = useState<string | null>(null)

  useEffect(() => {
    // Mostra messaggio di sessione scaduta proveniente dal interceptor 401
    const msg = sessionStorage.getItem('auth_expired_message')
    if (msg) {
      setSessionMsg(msg)
      sessionStorage.removeItem('auth_expired_message')
    }

    let mounted = true
    authApi.loginContext()
      .then((ctx) => {
        if (mounted) setLoginContextToken(ctx.token)
      })
      .catch(() => {
        if (mounted) setError('Impossibile inizializzare la sessione di login. Ricarica la pagina.')
      })

    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const submittedEmail    = String(formData.get('email')    ?? email).trim()
    const submittedPassword = String(formData.get('password') ?? password)
    const submittedOtp      = String(formData.get('otp')      ?? otp).trim()
    try {
      // Primo step: nessun OTP. Secondo step: inviamo il codice.
      await login(submittedEmail, submittedPassword, step === 'otp' ? submittedOtp : undefined, loginContextToken)
      window.location.replace('/dashboard')
    } catch (err) {
      const ae  = apiError(err)
      const msg = ae.message ?? ''
      const needsOtp =
        msg.toLowerCase().includes('otp') ||
        msg.toLowerCase().includes('mfa') ||
        msg.toLowerCase().includes('two factor')

      if (needsOtp && step === 'credentials') {
        // Backend chiede OTP: passiamo allo step OTP senza mostrare errore rosso
        setStep('otp')
        setOtp('')
      } else if (step === 'otp' && (needsOtp || ae.status === 422)) {
        // Codice OTP inserito non valido
        setError('Codice non valido o scaduto. Riprova.')
        setOtp('')
      } else if (ae.status === 419) {
        setError('Sessione login scaduta. Ricarica la pagina e riprova.')
        setOtp('')
        setStep('credentials')
        setLoginContextToken(null)
        authApi.loginContext().then((ctx) => setLoginContextToken(ctx.token)).catch(() => null)
      } else if (ae.status === 401 || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('unauthorized')) {
        setError('Email o password non corretti')
      } else {
        setError(msg || 'Credenziali non valide')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBackToCredentials = () => {
    setStep('credentials')
    setOtp('')
    setError(null)
  }

  return (
    <div className='login-card'>
      <div>
        <div className='logo text-center'>
          <h2 className='text-primary f-w-700'>FamilyHub</h2>
          <p className='text-muted'>Gestione Case-famiglia</p>
        </div>

        <div className='login-main'>
          <form className='form theme-form login-form' onSubmit={handleSubmit}>

            {step === 'credentials' ? (
              <>
                <h4>Accedi al tuo account</h4>
                <p>Inserisci le tue credenziali per continuare</p>

                {sessionMsg && (
                  <div className='alert alert-warning' role='alert'>
                    <strong>Sessione terminata</strong> — {sessionMsg}
                  </div>
                )}

                {error && (
                  <div className='alert alert-danger' role='alert'>{error}</div>
                )}

                <div className='form-group'>
                  <label className='col-form-label'>Indirizzo email</label>
                  <input
                    id='login-email'
                    name='email'
                    className='form-control'
                    type='email'
                    required
                    autoComplete='email'
                    placeholder='nome@struttura.it'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className='form-group'>
                  <label className='col-form-label'>Password</label>
                  <div className='position-relative'>
                    <input
                      id='login-password'
                      name='password'
                      className='form-control'
                      type={showPwd ? 'text' : 'password'}
                      required
                      autoComplete='current-password'
                      placeholder='••••••••'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className='show-hide' onClick={() => setShowPwd((v) => !v)}>
                      <span className={showPwd ? '' : 'show'} />
                    </div>
                  </div>
                </div>

                <div className='form-group mb-0'>
                  <button
                    type='submit'
                    className='btn btn-primary btn-block w-100'
                    disabled={loading || !loginContextToken}
                  >
                    {loading
                      ? <><span className='spinner-border spinner-border-sm me-2' role='status' />Verifica…</>
                      : 'Accedi'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4>Verifica in due passaggi</h4>

                {/* Banner informativo neutro — non è un errore, è una istruzione */}
                <div className='alert alert-info mb-3' role='status'>
                  Inserisci il codice a 6 cifre dalla tua app autenticatore
                  (Google Authenticator, Authy, ecc.).
                </div>

                {/* Errore OTP in rosso — solo se il codice inserito è sbagliato */}
                {error && (
                  <div className='alert alert-danger' role='alert'>{error}</div>
                )}

                {/* Campi email+password nascosti per il re-submit con OTP */}
                <input type='hidden' name='email'    value={email} />
                <input type='hidden' name='password' value={password} />

                <div className='form-group'>
                  <label className='col-form-label'>Codice di verifica</label>
                  <input
                    id='login-otp'
                    name='otp'
                    className='form-control text-center'
                    type='text'
                    inputMode='numeric'
                    pattern='[0-9]{6}'
                    maxLength={6}
                    placeholder='000000'
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      setOtp(val)
                      if (val.length === 6) {
                        setTimeout(() => e.target.form?.requestSubmit(), 0)
                      }
                    }}
                    autoFocus
                    autoComplete='one-time-code'
                    style={{ letterSpacing: 10, fontSize: 22 }}
                  />
                </div>

                <div className='form-group mb-0'>
                  <button
                    type='submit'
                    className='btn btn-primary btn-block w-100'
                    disabled={loading || otp.length < 6 || !loginContextToken}
                  >
                    {loading
                      ? <><span className='spinner-border spinner-border-sm me-2' role='status' />Verifica…</>
                      : 'Verifica codice'}
                  </button>
                </div>

                <p className='mt-3 mb-0 text-center'>
                  <button
                    type='button'
                    className='btn btn-link btn-sm p-0 text-muted'
                    onClick={handleBackToCredentials}
                  >
                    ← Torna al login
                  </button>
                </p>
              </>
            )}

            <p className='mt-4 mb-0 text-center'>
              {/* Link registrazione */}
              <span>Non hai un account? </span>
              <a className='ms-2' href='#!'>Contatta l'amministratore</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
