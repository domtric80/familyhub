import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Alert, Button, Badge,
} from 'reactstrap'
import { Home, ArrowLeft, Send, Users, MessageSquare, CheckCircle } from 'react-feather'
import { toast } from 'react-toastify'
import { internalMessageApi, apiError } from '../../services/api'
import type { InternalMessageThread, InternalMessage, MessageParticipant } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext'
import RichTextEditor, { richToPlain } from '../../components/common/RichTextEditor'

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fmtDt(s?: string | null) {
  if (!s) return ''
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

const THREAD_TYPE_LABEL: Record<string, string> = {
  facility: 'Di struttura',
  minor:    'Sul minore',
}
const THREAD_TYPE_COLOR: Record<string, string> = {
  facility: 'primary',
  minor:    'info',
}

// â”€â”€â”€ Componente messaggio singolo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function senderDisplayName(msg: InternalMessage, resolve: (id: number | null | undefined) => string): string {
  // Prova sender (schema reale backend)
  if (msg.sender) {
    const n = `${msg.sender.first_name ?? ''} ${msg.sender.last_name ?? ''}`.trim()
    if (n) return n
  }
  // Prova created_by (compat)
  if (msg.created_by) {
    const n = msg.created_by.display_name?.trim()
      || `${msg.created_by.first_name ?? ''} ${msg.created_by.last_name ?? ''}`.trim()
    if (n) return n
  }
  // Fallback: risolvi da partecipanti/staffMembers
  return resolve(msg.sender_user_id ?? msg.created_by?.id)
}

function MessageBubble({
  msg, isOwn, resolve,
}: {
  msg: InternalMessage
  isOwn: boolean
  resolve: (id: number | null | undefined) => string
}) {
  const senderName = senderDisplayName(msg, resolve)
  return (
    <div className={`d-flex mb-3 ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}>
      <div style={{ maxWidth: '70%' }}>
        {!isOwn && (
          <div className='small text-muted mb-1' style={{ paddingLeft: 4 }}>
            {senderName}
          </div>
        )}
        <div
          className={`rounded p-3 ${isOwn ? 'bg-primary text-white msg-own-bubble' : 'bg-light text-dark'}`}
          style={{ fontSize: 14, lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: msg.body }}
        />
        <div
          className={`small text-muted mt-1 ${isOwn ? 'text-end' : ''}`}
          style={{ fontSize: 11, paddingLeft: 4 }}
        >
          {fmtDt(msg.created_at)}
          {isOwn && (
            <span className='ms-1'>· {senderName}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ Pagina â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const POLL_INTERVAL_MS = 15_000

export default function MessaggioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const threadId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refresh: refreshUnread, getUserName } = useUnreadMessages()

  const [thread, setThread]   = useState<InternalMessageThread | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [body, setBody]           = useState('')
  const [sending, setSending]     = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const [markingRead, setMarkingRead] = useState(false)

  const bottomRef       = useRef<HTMLDivElement>(null)
  const prevCountRef    = useRef<number>(0)
  const isFirstLoadRef  = useRef(true)

  // â”€â”€ Caricamento thread â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await internalMessageApi.getThread(threadId)
      const msgs = data.messages ?? []

      // Toast nuovi messaggi (solo dopo il primo caricamento)
      if (!isFirstLoadRef.current && msgs.length > prevCountRef.current) {
        const newMsgs = msgs.slice(prevCountRef.current)
        const fromOthers = newMsgs.filter((m) =>
          m.sender_user_id !== user?.id && m.sender?.id !== user?.id && m.created_by?.id !== user?.id
        )
        if (fromOthers.length > 0) {
          const m0 = fromOthers[0]
          const sender = senderDisplayName(m0, getUserName)
          toast.info(
            fromOthers.length === 1
              ? `Nuovo messaggio da ${sender}`
              : `${fromOthers.length} nuovi messaggi`,
            { icon: <MessageSquare size={14} /> }
          )
        }
        // Scroll in fondo se arrivano nuovi messaggi
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }

      prevCountRef.current = msgs.length
      isFirstLoadRef.current = false
      setThread(data)

      if (!silent) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403)
        setError('Non hai accesso a questa conversazione.')
      else if (ae.status === 404)
        setError('Conversazione non trovata.')
      else
        setError(ae.message ?? 'Errore caricamento')
    } finally {
      setLoading(false)
    }
  }

  // Caricamento iniziale
  useEffect(() => {
    isFirstLoadRef.current = true
    prevCountRef.current = 0
    load()
  }, [threadId]) // eslint-disable-line

  // Polling silenzioso
  useEffect(() => {
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [threadId, user?.id]) // eslint-disable-line

  // â”€â”€ Segna come letto â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleMarkRead = async () => {
    setMarkingRead(true)
    try {
      await internalMessageApi.markRead(threadId)
      toast.success('Conversazione segnata come letta.')
      await load(true)
      refreshUnread()
    } catch (e) {
      const ae = apiError(e)
      toast.error(ae.message ?? 'Errore durante l\'operazione.')
    } finally {
      setMarkingRead(false)
    }
  }

  // â”€â”€ Invia messaggio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSend = async () => {
    setSendError(null)
    if (!richToPlain(body).trim()) { setSendError('Inserisci un messaggio prima di inviare.'); return }
    setSending(true)
    try {
      await internalMessageApi.sendMessage(threadId, body)
      setBody('')
      await load(true)
      refreshUnread()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403)
        setSendError('Non puoi inviare messaggi in questa conversazione.')
      else
        setSendError(ae.message ?? 'Errore durante l\'invio.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const messages: InternalMessage[] = thread?.messages ?? []

  // Risolve il nome da UserProfile annidato (schema reale backend)
  const participantName = (p: MessageParticipant): string => {
    if (p.user) return `${p.user.first_name ?? ''} ${p.user.last_name ?? ''}`.trim()
    if (p.display_name?.trim()) return p.display_name.trim()
    if (p.first_name || p.last_name) return `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
    return getUserName(p.user_id) || `Utente #${p.user_id}`
  }

  // Normalizza partecipanti
  const participants: (MessageParticipant & { _name: string })[] = (thread?.participants ?? []).map((p) => ({
    ...p,
    _name: participantName(p),
  }))

  // Mappa user_id â†’ nome dai partecipanti del thread
  const participantNameMap = new Map<number, string>(
    participants
      .filter((p) => p.user_id && p._name)
      .map((p) => [p.user_id, p._name])
  )

  // Resolver combinato: partecipanti thread â†’ staffMemberApi â†’ fallback
  const resolveSenderName = (userId: number | null | undefined): string => {
    if (!userId) return 'Mittente sconosciuto'
    return participantNameMap.get(userId) || getUserName(userId) || `Utente #${userId}`
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <Button color='light' size='sm' className='d-flex align-items-center gap-1'
                  onClick={() => navigate('/messaggi')}>
                  <ArrowLeft size={13} /> Conversazioni
                </Button>
                {thread && (
                  <h3 className='mb-0 ms-1' style={{ fontSize: 18 }}>{thread.subject}</h3>
                )}
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/messaggi'>Messaggistica</Link></li>
                <li className='breadcrumb-item active'>{thread?.subject ?? '…'}</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        {loading && (
          <div className='text-center py-5'><span className='spinner-border text-primary' /></div>
        )}
        {error && <Alert color='warning'>{error}</Alert>}

        {!loading && thread && (
          <Row>
            {/* â”€â”€ Colonna principale: messaggi + composer â”€â”€ */}
            <Col lg='8'>
              <Card>
                <CardHeader className='d-flex justify-content-between align-items-center'>
                  <div className='d-flex align-items-center gap-2'>
                    <MessageSquare size={16} className='text-primary' />
                    <span className='fw-semibold'>{thread.subject}</span>
                    {thread.topic && (
                      <span className='text-muted small'>— {thread.topic}</span>
                    )}
                  </div>
                  <div className='d-flex align-items-center gap-2'>
                    <span className={`badge badge-light-${THREAD_TYPE_COLOR[thread.thread_type] ?? 'secondary'}`}>
                      {THREAD_TYPE_LABEL[thread.thread_type] ?? thread.thread_type}
                    </span>
                    {thread.unread_count > 0 && (
                      <Button size='sm' color='outline-success' className='d-flex align-items-center gap-1'
                        onClick={handleMarkRead} disabled={markingRead}>
                        <CheckCircle size={12} />
                        {markingRead ? '…' : 'Segna come letto'}
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {/* Timeline messaggi */}
                <CardBody>
                  <div style={{ minHeight: 300, maxHeight: '55vh', overflowY: 'auto', padding: '8px 4px' }}>
                    {messages.length === 0 && (
                      <p className='text-muted text-center py-4'>
                        La conversazione è stata creata ma non contiene ancora messaggi visibili.
                      </p>
                    )}
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isOwn={
                          (msg.sender_user_id !== undefined && msg.sender_user_id === user?.id) ||
                          (msg.sender?.id !== undefined && msg.sender.id === user?.id) ||
                          (msg.created_by?.id !== undefined && msg.created_by.id === user?.id)
                        }
                        resolve={resolveSenderName}
                      />
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  {/* Composer */}
                  <div className='border-top pt-3 mt-2'>
                    <Alert color='warning' className='d-flex gap-2 align-items-start mb-2' style={{ fontSize: 12 }}>
                      <span>Evita di condividere informazioni non pertinenti. Tutte le operazioni sono tracciate.</span>
                    </Alert>
                    {sendError && <Alert color='danger' className='py-2'>{sendError}</Alert>}
                    <div className='mb-2'>
                      <RichTextEditor
                        value={body}
                        onChange={setBody}
                        placeholder='Scrivi un messaggio… (Ctrl+Invio per inviare)'
                        disabled={sending}
                        minHeight={80}
                        onCtrlEnter={handleSend}
                      />
                    </div>
                    <div className='d-flex justify-content-end'>
                      <Button color='primary' size='sm' className='d-flex align-items-center gap-1'
                        onClick={handleSend} disabled={sending || !richToPlain(body).trim()}>
                        <Send size={13} />
                        {sending ? 'Invio…' : 'Invia'}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* â”€â”€ Colonna laterale: meta + partecipanti â”€â”€ */}
            <Col lg='4'>
              <Card className='mb-3'>
                <CardHeader><h6 className='mb-0'>Dettagli</h6></CardHeader>
                <CardBody>
                  <div className='mb-2'>
                    <small className='text-muted d-block'>Struttura</small>
                    <span className='small'>{thread.facility?.name ?? '—'}</span>
                  </div>
                  {thread.minor && (
                    <div className='mb-2'>
                      <small className='text-muted d-block'>Minore collegato</small>
                      <span className='small'>
                        {thread.minor.first_name} {thread.minor.last_name}
                        <span className='text-muted ms-1'>({thread.minor.internal_code})</span>
                      </span>
                    </div>
                  )}
                  <div className='mb-2'>
                    <small className='text-muted d-block'>Tipo</small>
                    <span className={`badge badge-light-${THREAD_TYPE_COLOR[thread.thread_type] ?? 'secondary'}`}>
                      {THREAD_TYPE_LABEL[thread.thread_type] ?? thread.thread_type}
                    </span>
                  </div>
                  <div className='mb-2'>
                    <small className='text-muted d-block'>Messaggi</small>
                    <span className='small'>{messages.length}</span>
                  </div>
                  {thread.unread_count > 0 && (
                    <div>
                      <small className='text-muted d-block'>Non letti</small>
                      <Badge color='danger' pill>{thread.unread_count}</Badge>
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader className='d-flex align-items-center gap-2'>
                  <Users size={14} />
                  <h6 className='mb-0'>Partecipanti ({participants.length})</h6>
                </CardHeader>
                <CardBody className='p-0'>
                  {participants.length === 0 && (
                    <p className='text-muted small p-3 mb-0'>Nessun partecipante registrato.</p>
                  )}
                  <ul className='list-group list-group-flush'>
                    {participants.map((p) => (
                      <li key={p.id} className='list-group-item py-2 px-3'>
                        <div className='d-flex align-items-center gap-2'>
                          <div
                            className='rounded-circle bg-primary text-white d-flex align-items-center justify-content-center'
                            style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}
                          >
                            {p._name.charAt(0).toUpperCase()}
                          </div>
                          <span className='small'>
                            {p._name}
                            {p.user_id === user?.id && (
                              <span className='text-muted ms-1'>(tu)</span>
                            )}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </>
  )
}

