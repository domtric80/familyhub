import { useEffect, useState, type FormEvent } from 'react'
import { Container, Row, Col, Card, CardHeader, CardBody, Button, Form, FormGroup, Label, Input, Alert } from 'reactstrap'
import { toast } from 'react-toastify'
import { Shield, CheckCircle, Copy, AlertTriangle } from 'react-feather'
import { authApi, apiError } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type { MfaStatusResponse, MfaSetupResponse } from '../../types'

type Step = 'status' | 'setup' | 'confirm' | 'done'

export default function MfaConfigPage() {
  const { refresh } = useAuth()
  const [status, setStatus] = useState<MfaStatusResponse | null>(null)
  const [setup, setSetup] = useState<MfaSetupResponse | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [step, setStep] = useState<Step>('status')
  const [code, setCode] = useState('')
  const [regenCode, setRegenCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showRegen, setShowRegen] = useState(false)
  const [showDisable, setShowDisable] = useState(false)

  const loadStatus = () => {
    setLoadingStatus(true)
    authApi.mfaStatus()
      .then(setStatus)
      .catch((e) => toast.error(apiError(e).message ?? 'Errore stato MFA'))
      .finally(() => setLoadingStatus(false))
  }

  useEffect(() => { loadStatus() }, [])

  const handleActivate = async () => {
    setLoading(true)
    try {
      const s = await authApi.setupMfa()
      setSetup(s)
      setStep('setup')
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.confirmMfa(code)
      await refresh()
      toast.success('MFA attivata con successo')
      setStep('done')
      loadStatus()
    } catch (e) {
      toast.error(apiError(e).message ?? 'Codice non valido')
    } finally {
      setLoading(false)
    }
  }

  const handleRegen = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.regenerateRecoveryCodes(regenCode)
      setRecoveryCodes(res.recovery_codes)
      toast.success('Codici di recupero rigenerati')
      setShowRegen(false)
      setRegenCode('')
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore rigenerazione')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    try {
      await authApi.disableMfa()
      await refresh()
      toast.success('MFA disabilitata')
      setShowDisable(false)
      setStep('status')
      loadStatus()
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore disabilitazione')
    } finally {
      setLoading(false)
    }
  }

  const copySecret = () => {
    if (setup?.secret) {
      navigator.clipboard.writeText(setup.secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Container fluid>
      <div className="page-title">
        <Row>
          <Col xs={6}><h3>Configurazione MFA</h3></Col>
          <Col xs={6}>
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item">Sicurezza</li>
              <li className="breadcrumb-item active">Configurazione MFA</li>
            </ol>
          </Col>
        </Row>
      </div>

      <Row>
        <Col sm={12}>
          <Card>
            <CardHeader className="d-flex align-items-center gap-2">
              <Shield size={18} className={status?.confirmed ? 'text-success' : 'text-warning'} />
              <h5 className="mb-0">Stato autenticazione a due fattori</h5>
            </CardHeader>
            <CardBody>
              {loadingStatus ? (
                <div className="text-center py-4"><div className="loader-box"><div className="loader-15" /></div></div>
              ) : status ? (
                <div className="d-flex align-items-center flex-wrap gap-3">
                  <div>
                    <div className="f-16 f-w-600">
                      {status.confirmed ? 'MFA attiva e confermata' : 'MFA non attiva'}
                    </div>
                    {status.confirmed && (
                      <div className="text-muted f-12 mt-1">
                        Codici di recupero rimanenti: <strong>{status.recovery_codes_remaining}</strong>
                      </div>
                    )}
                  </div>
                  <div className="ms-auto d-flex gap-2 flex-wrap">
                    {!status.confirmed && (
                      <Button color="primary" onClick={handleActivate} disabled={loading}>
                        {loading ? 'Caricamento…' : 'Attiva MFA'}
                      </Button>
                    )}
                    {status.confirmed && (
                      <>
                        <Button color="warning" outline size="sm" onClick={() => setShowRegen(!showRegen)}>
                          Rigenera codici di recupero
                        </Button>
                        <Button color="danger" outline size="sm" onClick={() => setShowDisable(!showDisable)}>
                          Disabilita MFA
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </Col>

        {/* Setup flow */}
        {step === 'setup' && setup && (
          <Col sm={12}>
            <Card>
              <CardHeader><h5 className="mb-0">Attiva MFA — Scansiona QR Code</h5></CardHeader>
              <CardBody>
                <Row>
                  <Col md={4} className="text-center mb-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setup.otp_auth_url ?? '')}`}
                      alt="QR Code MFA"
                      style={{ borderRadius: 8, border: '1px solid #eee', padding: 8 }}
                    />
                  </Col>
                  <Col md={8}>
                    <p className="text-muted">Scansiona il QR con Google Authenticator o Authy, oppure inserisci il codice segreto manualmente.</p>

                    <div className="d-flex align-items-center p-3 mb-3 rounded" style={{ background: '#f0eeff' }}>
                      <code style={{ fontSize: 13, letterSpacing: 1, color: '#7366ff', wordBreak: 'break-all', flex: 1 }}>{setup.secret}</code>
                      <Button color="link" className="p-1" onClick={copySecret}>
                        {copied ? <CheckCircle size={18} color="#28a745" /> : <Copy size={18} />}
                      </Button>
                    </div>

                    {setup.recovery_codes.length > 0 && (
                      <Alert color="warning" className="mb-3">
                        <div className="d-flex align-items-center gap-1 mb-2">
                          <AlertTriangle size={14} />
                          <strong className="f-12">Codici di recupero — salvali in un luogo sicuro</strong>
                        </div>
                        <div className="d-flex flex-wrap gap-1">
                          {setup.recovery_codes.map((c) => (
                            <code key={c} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>{c}</code>
                          ))}
                        </div>
                      </Alert>
                    )}

                    <Form onSubmit={handleConfirm} className="form theme-form">
                      <FormGroup>
                        <Label>Codice OTP dall'app <span className="text-danger">*</span></Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          pattern="[0-9]{6}"
                          placeholder="000000"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          style={{ letterSpacing: 6, textAlign: 'center', fontSize: 20, maxWidth: 200 }}
                          autoFocus
                        />
                      </FormGroup>
                      <Button color="primary" type="submit" disabled={loading || code.length < 6}>
                        {loading ? 'Verifica…' : 'Conferma MFA'}
                      </Button>
                    </Form>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        )}

        {/* Rigenera codici */}
        {showRegen && (
          <Col sm={12}>
            <Card>
              <CardHeader><h5 className="mb-0">Rigenera codici di recupero</h5></CardHeader>
              <CardBody>
                <p className="text-muted">Inserisci il codice OTP corrente. I vecchi codici saranno invalidati.</p>
                <Form onSubmit={handleRegen} className="form theme-form">
                  <FormGroup>
                    <Label>Codice OTP <span className="text-danger">*</span></Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      placeholder="000000"
                      value={regenCode}
                      onChange={(e) => setRegenCode(e.target.value)}
                      style={{ letterSpacing: 6, textAlign: 'center', fontSize: 20, maxWidth: 200 }}
                    />
                  </FormGroup>
                  <Button color="warning" type="submit" disabled={loading || regenCode.length < 6} className="me-2">
                    {loading ? 'Rigenerazione…' : 'Rigenera codici'}
                  </Button>
                  <Button color="light" type="button" onClick={() => setShowRegen(false)}>Annulla</Button>
                </Form>
                {recoveryCodes.length > 0 && (
                  <Alert color="warning" className="mt-3">
                    <p className="f-w-600 f-12 mb-2">Nuovi codici di recupero — salvali subito</p>
                    <div className="d-flex flex-wrap gap-1">
                      {recoveryCodes.map((c) => (
                        <code key={c} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>{c}</code>
                      ))}
                    </div>
                  </Alert>
                )}
              </CardBody>
            </Card>
          </Col>
        )}

        {/* Disabilita MFA */}
        {showDisable && (
          <Col sm={12}>
            <Card className="border border-danger">
              <CardHeader className="bg-danger text-white">
                <h5 className="mb-0">Disabilita MFA</h5>
              </CardHeader>
              <CardBody>
                <Alert color="danger">
                  Sei sicuro di voler disabilitare l'autenticazione a due fattori? Questa operazione riduce la sicurezza del tuo account.
                </Alert>
                <Button color="danger" onClick={handleDisable} disabled={loading} className="me-2">
                  {loading ? 'Disabilitazione…' : 'Conferma disabilitazione'}
                </Button>
                <Button color="light" type="button" onClick={() => setShowDisable(false)}>Annulla</Button>
              </CardBody>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  )
}
