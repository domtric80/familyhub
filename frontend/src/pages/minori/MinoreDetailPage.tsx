import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Nav, NavItem, NavLink, TabContent, TabPane, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Row, Col, Button } from 'reactstrap'
import { Edit2, ArrowLeft, User, Phone, FileText, Clock, Shield, AlertTriangle, Upload, Download, X, Filter, Lock, Plus, Trash2, Save, Users, UserX, LogOut, Clipboard, Info, Eye, Briefcase } from 'react-feather'
import { Badge } from 'reactstrap'
import { minorApi, lookupsApi, minorAssignmentApi, apiError } from '../../services/api'
import { toast } from 'react-toastify'
import type { Minor, MinorProfile, MinorCaseDetail, MinorHistoryEntry, MinorDocument, MinorContact, MinorContactWrite, LookupItem, DocumentClassification, DocumentIssuer, AttachmentSecurityStatus, MinorAssignment, MinorPeiObjectiveTrend, MinorPeiTrendEvent, MinorDashboardDeadline, MinorDashboardHighPriorityNeed, MinorDashboardRelevantEvent } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import type { AxiosError } from 'axios'
import InfoDrawer from '../../components/common/InfoDrawer'
import DocPreviewModal from '../../components/common/DocPreviewModal'
import UsciteMinoreTab from './tabs/UsciteMinoreTab'
import AttivitaMinoreTab from './tabs/AttivitaMinoreTab'
import AvvicinamentiMinoreTab from './tabs/AvvicinamentiMinoreTab'
import DiarioMinoreTab from './tabs/DiarioMinoreTab'
import NoteMinoreTab from './tabs/NoteMinoreTab'
import CasoMinoreTab from './tabs/CasoMinoreTab'
import ProfiloEstesoMinoreTab from './tabs/ProfiloEstesoMinoreTab'

type Tab = 'anagrafica' | 'profilo' | 'caso' | 'contatti' | 'documenti' | 'storico' | 'operatori' | 'uscite' | 'attivita' | 'avvicinamenti' | 'diario' | 'note'

function fmtDateTime(value?: string | null) {
  if (!value) return '\u2014'
  try {
    return new Date(value).toLocaleString('it-IT')
  } catch {
    return value
  }
}

function fmtDate(value?: string | null) {
  if (!value) return '\u2014'
  try {
    return new Date(value).toLocaleDateString('it-IT')
  } catch {
    return value
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '10px 0' }}>
      <span style={{ width: 200, color: '#8d8d8d', fontSize: 13, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value ?? <span style={{ color: '#ccc' }}>\u2014</span>}</span>
    </div>
  )
}

function KpiCard({ label, value, subtitle }: { label: string; value: string | number; subtitle?: string }) {
  return (
    <div className='card h-100 mb-0'>
      <div className='card-body py-3'>
        <small className='text-muted d-block mb-1'>{label}</small>
        <h4 className='mb-1' style={{ color: '#7366ff' }}>{value}</h4>
        {subtitle && <small className='text-muted'>{subtitle}</small>}
      </div>
    </div>
  )
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return <span className='text-muted small'>Nessun dato</span>
  if (values.length === 1) return <span className='text-muted small'>{values[0]}%</span>

  const width = 180
  const height = 48
  const max = 100
  const min = 0
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * (width - 8) + 4
    const y = height - 4 - (((value - min) / (max - min || 1)) * (height - 8))
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', maxWidth: '100%' }}>
      <polyline
        fill='none'
        stroke='#7366ff'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
        points={points}
      />
      {values.map((value, index) => {
        const x = (index / (values.length - 1)) * (width - 8) + 4
        const y = height - 4 - (((value - min) / (max - min || 1)) * (height - 8))
        return <circle key={`${index}-${value}`} cx={x} cy={y} r='2.5' fill='#4f46e5' />
      })}
    </svg>
  )
}

function sourceLabel(sourceType?: string | null) {
  if (sourceType === 'minor_activity') return 'Attivit\u00E0'
  if (sourceType === 'minor_journal_entry') return 'Diario educativo'
  return 'Aggiornamento manuale'
}

function statusBadgeColor(status?: string | null) {
  if (status === 'completed' || status === 'achieved') return 'badge-light-success'
  if (status === 'in_progress' || status === 'active') return 'badge-light-primary'
  if (status === 'pending' || status === 'draft') return 'badge-light-warning'
  return 'badge-light-secondary'
}


const DEADLINE_TYPE_LABELS: Record<string, string> = {
  diagnosis_review:   'Revisione diagnosi',
  pei_review:         'Revisione PEI',
  pei_objective_due:  'Obiettivo PEI',
}

const DEADLINE_TYPE_BADGE: Record<string, string> = {
  diagnosis_review:   'badge-light-info',
  pei_review:         'badge-light-primary',
  pei_objective_due:  'badge-light-warning',
}

function MinorGlobalSummaryCard({ minor }: { minor: Minor }) {
  const pei = minor.pei_trends
  const peiSummary = pei?.summary
  const ds = minor.dashboard_summary

  return (
    <div className='card mb-3'>
      <div className='card-body py-3'>
        {/* ── Header info row ── */}
        <div className='d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3'>
          <div>
            <div className='d-flex align-items-center gap-2 flex-wrap mb-1'>
              <h6 className='mb-0'>Dashboard minore</h6>
              <span className='badge badge-light-info'>Riepilogo rapido</span>
            </div>
            <small className='text-muted'>
              Stato scheda, contesto operativo e avanzamento PEI sintetico visibile da tutte le tab.
            </small>
          </div>
          <div className='d-flex flex-wrap gap-2'>
            <span className='badge badge-light-secondary'>Struttura: {minor.facility?.name ?? '?'}</span>
            <span className='badge badge-light-secondary'>Stato: {minor.minor_status?.name ?? '?'}</span>
            <span className='badge badge-light-secondary'>Documenti: {minor.documents?.length ?? 0}</span>
            <span className='badge badge-light-secondary'>Contatti: {minor.contacts?.length ?? 0}</span>
          </div>
        </div>

        {/* ── KPI da dashboard_summary ── */}
        {ds && (
          <Row className='g-2 mb-3'>
            <Col md='2' sm='4'><KpiCard label='Diagnosi attive' value={ds.summary.active_diagnoses_count} subtitle={ds.summary.primary_diagnosis_label ?? undefined} /></Col>
            <Col md='2' sm='4'><KpiCard label='Bisogni aperti' value={ds.summary.open_needs_count} /></Col>
            <Col md='2' sm='4'><KpiCard label='Bisogni urgenti' value={ds.summary.high_priority_open_needs_count} /></Col>
            <Col md='2' sm='4'><KpiCard label='PEI attivi' value={ds.summary.active_peis_count} /></Col>
            <Col md='2' sm='4'>
              <KpiCard
                label='Scadenze prossime'
                value={ds.summary.upcoming_deadlines_count}
                subtitle={ds.summary.overdue_deadlines_count > 0 ? `⚠ ${ds.summary.overdue_deadlines_count} scadute` : undefined}
              />
            </Col>
          </Row>
        )}

        {/* ── KPI PEI trend (fallback se no dashboard_summary) ── */}
        {!ds && (
          <Row className='g-2 mb-3'>
            <Col md='2' sm='4'><KpiCard label='PEI attivi' value={peiSummary?.active_peis ?? 0} /></Col>
            <Col md='2' sm='4'><KpiCard label='Obiettivi' value={peiSummary?.total_objectives ?? 0} /></Col>
            <Col md='2' sm='4'><KpiCard label='Completati' value={peiSummary?.completed_objectives ?? 0} /></Col>
            <Col md='2' sm='4'><KpiCard label='Avanzamento medio' value={`${peiSummary?.average_progress_percent ?? 0}%`} /></Col>
          </Row>
        )}

        {/* ── Widget Scadenze + Bisogni urgenti + Eventi rilevanti ── */}
        {ds && (
          <Row className='g-3'>
            {/* Scadenze */}
            {ds.upcoming_deadlines.length > 0 && (
              <Col md='4'>
                <div className='border rounded p-3 h-100' style={{ background: '#fafafa' }}>
                  <div className='d-flex align-items-center gap-2 mb-2'>
                    <strong style={{ fontSize: 13 }}>Scadenze</strong>
                    <span className='badge badge-light-warning'>{ds.upcoming_deadlines.length}</span>
                  </div>
                  <div className='d-flex flex-column gap-2'>
                    {[...ds.upcoming_deadlines]
                      .sort((a: MinorDashboardDeadline, b: MinorDashboardDeadline) => a.date.localeCompare(b.date))
                      .map((d: MinorDashboardDeadline, i: number) => (
                        <div key={i} className='d-flex align-items-start gap-2'>
                          <span className={`badge ${DEADLINE_TYPE_BADGE[d.type] ?? 'badge-light-secondary'}`} style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                            {DEADLINE_TYPE_LABELS[d.type] ?? d.type}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.label}>{d.label}</div>
                            <div style={{ fontSize: 11, color: d.is_overdue ? '#e74c3c' : '#8d8d8d' }}>
                              {d.is_overdue ? '⚠ ' : ''}{fmtDate(d.date)}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </Col>
            )}

            {/* Bisogni urgenti */}
            {ds.high_priority_needs.length > 0 && (
              <Col md='4'>
                <div className='border rounded p-3 h-100' style={{ background: '#fafafa' }}>
                  <div className='d-flex align-items-center gap-2 mb-2'>
                    <strong style={{ fontSize: 13 }}>Bisogni urgenti</strong>
                    <span className='badge badge-light-danger'>{ds.high_priority_needs.length}</span>
                  </div>
                  <div className='d-flex flex-column gap-2'>
                    {ds.high_priority_needs.map((n: MinorDashboardHighPriorityNeed) => (
                      <div key={n.id} className='border-start border-3 ps-2' style={{ borderColor: '#e74c3c' }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{n.title}</div>
                        <div className='d-flex gap-1 mt-1'>
                          {n.category_code && <span className='badge badge-light-secondary' style={{ fontSize: 10 }}>{n.category_code}</span>}
                          <span className={`badge ${statusBadgeColor(n.status)}`} style={{ fontSize: 10 }}>{n.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            )}

            {/* Eventi rilevanti */}
            {ds.recent_relevant_events.length > 0 && (
              <Col md='4'>
                <div className='border rounded p-3 h-100' style={{ background: '#fafafa' }}>
                  <div className='d-flex align-items-center gap-2 mb-2'>
                    <strong style={{ fontSize: 13 }}>Eventi rilevanti</strong>
                  </div>
                  <div className='d-flex flex-column gap-2'>
                    {ds.recent_relevant_events.map((ev: MinorDashboardRelevantEvent) => (
                      <div key={ev.id} className='border-start border-3 ps-2' style={{ borderColor: '#7366ff' }}>
                        <div style={{ fontSize: 12 }}>{ev.description}</div>
                        <div style={{ fontSize: 11, color: '#8d8d8d' }}>{fmtDateTime(ev.created_at)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            )}
          </Row>
        )}
      </div>
    </div>
  )
}

function PeiTrendDashboardCard({ minor }: { minor: Minor }) {
  const dashboard = minor.pei_trends

  if (!dashboard || dashboard.summary.total_objectives === 0) {
    return (
      <div className='alert alert-light border mb-4'>
        Nessun trend PEI disponibile: crea un PEI con almeno un obiettivo per vedere l\u2019andamento educativo operativo.
      </div>
    )
  }

  return (
    <div className='card mb-4'>
      <div className='card-header pb-2'>
        <div className='d-flex flex-wrap align-items-center justify-content-between gap-2'>
          <div>
            <h5 className='mb-1'>Trend PEI</h5>
            <small className='text-muted'>Avanzamento per obiettivo, eventi da Attivit\u00E0 e Diario educativo.</small>
          </div>
          <span className='badge badge-light-info'>Dashboard educativa</span>
        </div>
      </div>
      <div className='card-body'>
        <Row className='g-3 mb-4'>
          <Col md='4' xl='2'><KpiCard label='PEI attivi' value={dashboard.summary.active_peis} subtitle={`Totali: ${dashboard.summary.total_peis}`} /></Col>
          <Col md='4' xl='2'><KpiCard label='Obiettivi' value={dashboard.summary.total_objectives} subtitle={`Completati: ${dashboard.summary.completed_objectives}`} /></Col>
          <Col md='4' xl='2'><KpiCard label='Avanzamento medio' value={`${dashboard.summary.average_progress_percent ?? 0}%`} /></Col>
          <Col md='6' xl='3'><KpiCard label='Eventi da Attivit\u00E0' value={dashboard.summary.linked_activity_events} subtitle='Progressi collegati a attivit\u00E0 operative' /></Col>
          <Col md='6' xl='3'><KpiCard label='Eventi da Diario' value={dashboard.summary.linked_journal_events} subtitle='Progressi collegati a osservazioni educative' /></Col>
        </Row>

        <Row className='g-3'>
          <Col xl='8'>
            <div className='border rounded p-3 h-100'>
              <div className='d-flex justify-content-between align-items-center mb-3'>
                <strong>Andamento obiettivi</strong>
                <small className='text-muted'>{dashboard.objective_trends.length} obiettivi</small>
              </div>
              <div className='d-flex flex-column gap-3'>
                {dashboard.objective_trends.map((objective: MinorPeiObjectiveTrend) => {
                  const series = objective.series ?? []
                  const values = series.map((point) => point.progress_percent)
                  return (
                    <div key={objective.objective_id} className='border rounded p-3' style={{ background: '#fafaff' }}>
                      <div className='d-flex flex-wrap justify-content-between gap-2 mb-2'>
                        <div>
                          <div className='d-flex align-items-center gap-2 flex-wrap'>
                            <strong>{objective.objective_title}</strong>
                            {objective.objective_code && <span className='badge badge-light-secondary'>{objective.objective_code}</span>}
                            <span className={`badge ${statusBadgeColor(objective.status)}`}>{objective.status ?? '—'}</span>
                          </div>
                          <small className='text-muted'>Ultimo aggiornamento: {fmtDateTime(objective.last_progress_at)}</small>
                        </div>
                        <div className='text-end'>
                          <div style={{ fontSize: 22, fontWeight: 700, color: '#7366ff' }}>{objective.current_progress_percent ?? 0}%</div>
                          <small className='text-muted'>{series.length} eventi</small>
                        </div>
                      </div>
                      <Sparkline values={values} />
                    </div>
                  )
                })}
              </div>
            </div>
          </Col>
          <Col xl='4'>
            <div className='border rounded p-3 h-100'>
              <div className='d-flex justify-content-between align-items-center mb-3'>
                <strong>Eventi recenti PEI</strong>
                <small className='text-muted'>Ultimi 12</small>
              </div>
              {dashboard.recent_events.length === 0 ? (
                <p className='text-muted small mb-0'>Nessun evento recente disponibile.</p>
              ) : (
                <div className='d-flex flex-column gap-3'>
                  {dashboard.recent_events.map((event: MinorPeiTrendEvent, index) => (
                    <div key={`${event.objective_id ?? 'obj'}-${event.logged_at ?? index}`} className='border-start border-3 ps-3' style={{ borderColor: '#7366ff' }}>
                      <div className='d-flex align-items-center gap-2 flex-wrap mb-1'>
                        <span className='badge badge-light-primary'>{sourceLabel(event.source_type)}</span>
                        <span className={`badge ${statusBadgeColor(event.status)}`}>{event.status ?? '—'}</span>
                        <strong style={{ color: '#7366ff' }}>{event.progress_percent}%</strong>
                      </div>
                      <div className='small text-dark'>{event.source_label ?? 'Evento PEI'}</div>
                      {event.notes && <div className='small text-muted'>{event.notes}</div>}
                      <div className='small text-muted mt-1'>
                        {fmtDateTime(event.logged_at)}
                        {event.actor?.display_name ? ` ? ${event.actor.display_name}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  )
}

function SectionError({ message }: { message: string }) {
  return (
    <div className='alert alert-danger' style={{ margin: 0 }}>
      <AlertTriangle size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
      {message}
    </div>
  )
}

function SectionLoader() {
  return (
    <div className='text-center' style={{ padding: 40 }}>
      <div className='loader'></div>
    </div>
  )
}

// ─── Tab Storico ──────────────────────────────────────────────────────────────

interface StoricoTabProps {
  minorId: number
}

function StoricoTab({ minorId }: StoricoTabProps) {
  const [history, setHistory] = useState<MinorHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    minorApi.history(minorId)
      .then(setHistory)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento cronologia'))
      .finally(() => setLoading(false))
  }, [minorId])

  if (loading) return <SectionLoader />
  if (error) return <SectionError message={error} />

  const EVENT_BADGE: Record<string, string> = {
    minor_viewed:              'badge-light-info',
    minor_history_viewed:      'badge-light-info',
    minor_document_downloaded: 'badge-light-warning',
    minor_document_viewed:     'badge-light-warning',
  }

  const EVENT_LABEL: Record<string, string> = {
    minor_viewed:              'Accesso in lettura',
    minor_history_viewed:      'Storico visualizzato',
    minor_document_downloaded: 'Documento scaricato',
    minor_document_viewed:     'Documento visualizzato',
    minor_created:             'Minore creato',
    minor_updated:             'Dati aggiornati',
    minor_document_uploaded:   'Documento caricato',
    minor_document_deleted:    'Documento eliminato',
    minor_contact_added:       'Contatto aggiunto',
    minor_contact_updated:     'Contatto aggiornato',
    minor_contact_deleted:     'Contatto eliminato',
  }

  const eventTypes = Array.from(new Set(history.map((h) => h.event_type))).sort()
  const filtered = filterType ? history.filter((h) => h.event_type === filterType) : history

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h6 style={{ color: '#7366ff', margin: 0 }}>Storico modifiche</h6>
        {eventTypes.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} color='#8d8d8d' />
            <select
              className='form-select form-select-sm'
              style={{ width: 'auto', minWidth: 180 }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value=''>Tutti gli eventi</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>{EVENT_LABEL[t] ?? t}</option>
              ))}
            </select>
            {filterType && (
              <button
                className='btn btn-sm btn-light'
                onClick={() => setFilterType('')}
                title='Rimuovi filtro'
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className='text-center' style={{ padding: 40, color: '#8d8d8d' }}>
          <Clock size={40} color='#ddd' />
          <p style={{ marginTop: 12 }}>
            {filterType ? 'Nessun evento di questo tipo' : 'Nessuna modifica registrata'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
          {/* Linea verticale della timeline */}
          <div style={{
            position: 'absolute', left: 4, top: 10, bottom: 10,
            width: 2, background: '#e8e6ff'
          }} />

          {filtered.map((h, idx) => {
            // actor: prefer display_name, never concatenate minor real name
            const actorLabel = h.actor
              ? (h.actor.display_name ?? `${h.actor.first_name} ${h.actor.last_name}`) + ` (${h.actor.email})`
              : h.actor_user_id
                ? `Utente #${h.actor_user_id}`
                : 'Sistema'

            const badgeClass = EVENT_BADGE[h.event_type] ?? 'badge-light-primary'
            const eventLabel = EVENT_LABEL[h.event_type] ?? h.event_type
            // description è il testo primario serializzato dal backend (già pseudonimizzato)
            // operation_summary usato solo come fallback se description assente
            const primaryText = h.description || (h.metadata?.operation_summary as string | undefined)
            const ipAddress = h.metadata?.ip_address as string | undefined
            const remainingMeta = h.metadata
              ? Object.fromEntries(
                  Object.entries(h.metadata).filter(([k]) => k !== 'operation_summary' && k !== 'ip_address')
                )
              : null
            const hasRemainingMeta = remainingMeta && Object.keys(remainingMeta).length > 0

            return (
              <div key={h.id} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', paddingBottom: idx < filtered.length - 1 ? 24 : 0 }}>
                {/* Dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#7366ff', border: '2px solid #fff',
                  boxShadow: '0 0 0 2px #7366ff',
                  marginTop: 4, flexShrink: 0, zIndex: 1
                }} />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: 12 }}>{eventLabel}</span>
                    <span style={{ color: '#8d8d8d', fontSize: 12 }}>
                      {new Date(h.created_at).toLocaleString('it-IT')}
                    </span>
                  </div>
                  {/* Testo principale evento (backend-serializzato, pseudonimizzato) */}
                  {primaryText && (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#444' }}>{primaryText}</p>
                  )}
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8d8d8d' }}>
                    Attore: <span style={{ fontWeight: 500 }}>{actorLabel}</span>
                  </p>
                  {ipAddress && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#aaa' }}>IP: {ipAddress}</p>
                  )}
                  {Boolean(h.metadata?.document_name) && (
                    <span style={{ fontSize: 12, color: '#8d8d8d' }}>
                      📄 {String(h.metadata?.document_name)}
                      {h.metadata?.classification ? ` [${String(h.metadata.classification)}]` : ''}
                    </span>
                  )}
                  {hasRemainingMeta && (
                    <details style={{ marginTop: 6 }}>
                      <summary style={{ fontSize: 12, color: '#8d8d8d', cursor: 'pointer' }}>Metadata</summary>
                      <pre style={{
                        fontSize: 11, background: '#f8f8fb', borderRadius: 6,
                        padding: '8px 12px', marginTop: 4, overflowX: 'auto'
                      }}>
                        {JSON.stringify(remainingMeta, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tab Documenti ────────────────────────────────────────────────────────────

interface DocumentiTabProps {
  minorId: number
  initialDocuments: MinorDocument[]
}

// Badge security_status attachment
function SecurityBadge({ status }: { status?: AttachmentSecurityStatus | null }) {
  if (!status || status === 'pending') return <span className='badge badge-light-warning' title='In verifica sicurezza'><Lock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />In verifica</span>
  if (status === 'clean') return <span className='badge badge-light-success'>✓ Verificato</span>
  if (status === 'infected') return <span className='badge badge-light-danger'>⚠ Bloccato</span>
  if (status === 'rejected') return <span className='badge badge-light-secondary'>⛔ Non rilasciabile</span>
  return null
}

// Badge classificazione documento
const CLASSIFICATION_BADGE: Record<string, string> = {
  internal: 'badge-light-warning',
  restricted: 'badge-light-danger',
  clinical: 'badge-light-primary',
  judicial: 'badge-light-info',
}

function DocumentiTab({ minorId, initialDocuments }: DocumentiTabProps) {
  const { user, hasPermission } = useAuth()
  const [documents, setDocuments] = useState<MinorDocument[]>(initialDocuments)
  const [documentTypes, setDocumentTypes] = useState<LookupItem[]>([])
  const [typesLoading, setTypesLoading] = useState(true)
  // Classificazioni da API (fallback capabilities utente)
  const [apiClassifications, setApiClassifications] = useState<DocumentClassification[]>([])

  // Classificazioni disponibili per questo utente
  const userClassifications: DocumentClassification[] =
    (user?.capabilities?.document_classifications && user.capabilities.document_classifications.length > 0)
      ? user.capabilities.document_classifications
      : apiClassifications

  // Upload form
  const [showUpload, setShowUpload] = useState(false)
  const [uploadDocTypeId, setUploadDocTypeId] = useState<string>('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadIssuedBy, setUploadIssuedBy] = useState('')
  const [uploadIssuerId, setUploadIssuerId] = useState<string>('')
  const [documentIssuers, setDocumentIssuers] = useState<DocumentIssuer[]>([])
  const [uploadIssueDate, setUploadIssueDate] = useState('')
  const [uploadExpiryDate, setUploadExpiryDate] = useState('')
  const [uploadClassification, setUploadClassification] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Download state per-document
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [downloadErrors, setDownloadErrors] = useState<Record<number, string>>({})
  const [previewDoc, setPreviewDoc]         = useState<MinorDocument | null>(null)

  useEffect(() => {
    Promise.all([
      lookupsApi.documentTypes(),
      lookupsApi.documentClassifications(),
      lookupsApi.documentIssuers(),
    ])
      .then(([types, classifications, issuers]) => {
        setDocumentTypes(types)
        setApiClassifications(classifications)
        setDocumentIssuers(issuers)
        // default primo valore disponibile
        if (classifications.length > 0) setUploadClassification(classifications[0].code)
      })
      .catch(() => {/* non bloccante */})
      .finally(() => setTypesLoading(false))
  }, [])

  const resetUploadForm = () => {
    setUploadDocTypeId('')
    setUploadFile(null)
    setUploadIssuedBy('')
    setUploadIssuerId('')
    setUploadIssueDate('')
    setUploadExpiryDate('')
    setUploadClassification('restricted')
    setUploadError(null)
    setUploadSuccess(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError(null)
    setUploadSuccess(false)

    if (!uploadDocTypeId) {
      setUploadError('Seleziona il tipo documento.')
      return
    }
    if (!uploadFile) {
      setUploadError('Seleziona un file da caricare.')
      return
    }

    const formData = new FormData()
    formData.append('document_type_id', uploadDocTypeId)
    formData.append('file', uploadFile)
    if (uploadIssuerId) formData.append('document_issuer_id', uploadIssuerId)
    else if (uploadIssuedBy) formData.append('issued_by', uploadIssuedBy)
    if (uploadIssueDate) formData.append('issue_date', uploadIssueDate)
    if (uploadExpiryDate) formData.append('expiry_date', uploadExpiryDate)
    formData.append('classification_code', uploadClassification)

    setUploading(true)
    try {
      const newDoc = await minorApi.uploadDocument(minorId, formData)
      setDocuments((prev) => [...prev, newDoc])
      setUploadSuccess(true)
      resetUploadForm()
      setTimeout(() => {
        setShowUpload(false)
        setUploadSuccess(false)
      }, 1500)
    } catch (err) {
      const e = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>
      const status = e.response?.status
      if (status === 403) {
        setUploadError('Non hai i permessi necessari per caricare questo documento.')
      } else if (status === 422) {
        const errors = e.response?.data?.errors
        if (errors) {
          const msgs = Object.values(errors).flat().join(' ')
          setUploadError(msgs || 'Dati non validi. Controlla tipo documento e file.')
        } else {
          setUploadError('Dati non validi. Controlla tipo documento, formato e dimensione del file.')
        }
      } else {
        setUploadError(e.response?.data?.message ?? 'Errore durante il caricamento.')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (doc: MinorDocument) => {
    setDownloadingId(doc.id)
    setDownloadErrors((prev) => ({ ...prev, [doc.id]: '' }))
    try {
      const resp = await minorApi.downloadDocument(minorId, doc.id)
      const url = URL.createObjectURL(resp.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.attachment?.original_name ?? `documento-${doc.id}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      const e = err as AxiosError
      const status = e.response?.status
      if (status === 423) {
        setDownloadErrors((prev) => ({ ...prev, [doc.id]: 'Documento in verifica sicurezza — download non disponibile fino al completamento della scansione.' }))
      } else if (status === 403) {
        // Download bloccato da RBAC o policy ABAC della classificazione
        const msg = 'Download non consentito per il tuo ruolo o per la classificazione del documento.'
        setDownloadErrors((prev) => ({ ...prev, [doc.id]: msg }))
        throw err  // permette a DocPreviewModal di mostrare il messaggio inline
      } else if (status === 404) {
        setDownloadErrors((prev) => ({ ...prev, [doc.id]: 'Documento non più disponibile.' }))
      } else {
        setDownloadErrors((prev) => ({ ...prev, [doc.id]: 'Errore durante il download.' }))
      }
    } finally {
      setDownloadingId(null)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h6 style={{ color: '#7366ff', margin: 0 }}>Documenti</h6>
        <button
          className='btn btn-sm btn-primary'
          onClick={() => { setShowUpload((v) => !v); resetUploadForm() }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Upload size={14} />
          {showUpload ? 'Annulla' : 'Carica documento'}
        </button>
      </div>

      <div className='alert alert-info py-2 px-3 mb-3 d-flex align-items-start gap-2' style={{ fontSize: 13 }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          La visibilità dei documenti segue regole <strong>ABAC</strong> basate su tag e classificazioni,
          indipendentemente dal ruolo. È possibile vedere il minore e non poter consultare tutti i suoi documenti.
        </span>
      </div>

      {/* Form upload */}
      {showUpload && (
        <div className='card' style={{ background: '#f8f8fb', marginBottom: 20 }}>
          <div className='card-body'>
            <h6 style={{ marginBottom: 16 }}>Carica nuovo documento</h6>
            <form onSubmit={handleUpload}>
              <div className='row'>
                <div className='col-md-6'>
                  <div className='form-group'>
                    <label>Tipo documento <span style={{ color: '#e74c3c' }}>*</span></label>
                    <select
                      className='form-select'
                      value={uploadDocTypeId}
                      onChange={(e) => setUploadDocTypeId(e.target.value)}
                      disabled={typesLoading}
                      required
                    >
                      <option value=''>— Seleziona —</option>
                      {documentTypes.map((t) => (
                        <option key={t.id} value={String(t.id)}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className='col-md-6'>
                  <div className='form-group'>
                    <label>File <span style={{ color: '#e74c3c' }}>*</span></label>
                    <input
                      ref={fileInputRef}
                      type='file'
                      className='form-control'
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      required
                    />
                  </div>
                </div>
                <div className='col-md-6'>
                  <div className='form-group'>
                    <label>Ente rilascio</label>
                    {documentIssuers.length > 0 ? (
                      <select
                        className='form-select'
                        value={uploadIssuerId}
                        onChange={(e) => setUploadIssuerId(e.target.value)}
                      >
                        <option value=''>— Seleziona —</option>
                        {documentIssuers.map((iss) => (
                          <option key={iss.id} value={String(iss.id)}>{iss.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type='text'
                        className='form-control'
                        value={uploadIssuedBy}
                        onChange={(e) => setUploadIssuedBy(e.target.value)}
                        placeholder='Ente emittente'
                      />
                    )}
                  </div>
                </div>
                <div className='col-md-3'>
                  <div className='form-group'>
                    <label>Data emissione</label>
                    <input
                      type='date'
                      className='form-control'
                      value={uploadIssueDate}
                      onChange={(e) => setUploadIssueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className='col-md-3'>
                  <div className='form-group'>
                    <label>Data scadenza</label>
                    <input
                      type='date'
                      className='form-control'
                      value={uploadExpiryDate}
                      onChange={(e) => setUploadExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className='col-md-6'>
                  <div className='form-group'>
                    <label>Classificazione</label>
                    <select
                      className='form-select'
                      value={uploadClassification}
                      onChange={(e) => setUploadClassification(e.target.value)}
                    >
                      {userClassifications.length > 0
                        ? userClassifications.map((c) => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                          ))
                        : (
                          <>
                            <option value='internal'>Interno</option>
                            <option value='restricted'>Riservato</option>
                            <option value='clinical'>Clinico</option>
                            <option value='judicial'>Giudiziario</option>
                          </>
                        )
                      }
                    </select>
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className='alert alert-danger' style={{ marginBottom: 12 }}>
                  <AlertTriangle size={14} style={{ marginRight: 8 }} />
                  {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className='alert alert-success' style={{ marginBottom: 12 }}>
                  Documento caricato con successo.
                </div>
              )}

              <button type='submit' className='btn btn-primary btn-sm' disabled={uploading}>
                {uploading ? 'Caricamento…' : 'Carica'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tabella documenti */}
      {documents.length === 0 ? (
        <div className='text-center' style={{ padding: 40, color: '#8d8d8d' }}>
          <FileText size={40} color='#ddd' />
          <p style={{ marginTop: 12 }}>Nessun documento caricato</p>
        </div>
      ) : (
        <div className='table-responsive'>
          <table className='table table-hover'>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Classificazione</th>
                <th>Sicurezza</th>
                <th>Emesso da</th>
                <th>Data emissione</th>
                <th>Scadenza</th>
                <th>Dimensione</th>
                <th>SHA256</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const classCode = doc.classification_code ?? doc.classification ?? ''
                const badgeCls = CLASSIFICATION_BADGE[classCode] ?? 'badge-light-secondary'
                const isClean = !doc.attachment?.security_status || doc.attachment.security_status === 'clean'
                const dlError = downloadErrors[doc.id]
                return (
                  <tr key={doc.id}>
                    <td>{doc.document_type?.name ?? `#${doc.document_type_id}`}</td>
                    <td>
                      <span className={`badge ${badgeCls}`} style={{ fontSize: 11 }}>
                        {doc.classification_label ?? doc.document_classification?.name ?? doc.classification ?? '—'}
                      </span>
                    </td>
                    <td>
                      <SecurityBadge status={doc.attachment?.security_status} />
                    </td>
                    <td>{doc.issuer_label ?? doc.document_issuer?.name ?? doc.issued_by ?? '—'}</td>
                    <td>{fmtDate(doc.issue_date)}</td>
                    <td>{fmtDate(doc.expiry_date)}</td>
                    <td>{doc.attachment ? formatBytes(doc.attachment.size_bytes) : '\u2014'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {doc.attachment?.sha256?.slice(0, 8) ?? '\u2014'}\u2026
                    </td>
                    <td>
                      <div className='d-flex gap-1'>
                        <button
                          className='btn btn-sm btn-outline-secondary'
                          onClick={() => setPreviewDoc(doc)}
                          disabled={!isClean}
                          title={isClean ? 'Anteprima' : 'Anteprima non disponibile — documento in verifica'}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Eye size={13} /> Anteprima
                        </button>
                        <button
                          className='btn btn-sm btn-outline-primary'
                          onClick={() => handleDownload(doc)}
                          disabled={!isClean || downloadingId === doc.id}
                          title={isClean ? 'Scarica' : 'Download non disponibile — documento in verifica'}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Download size={13} />
                          {downloadingId === doc.id ? '\u2026' : 'Scarica'}
                        </button>
                      </div>
                      {dlError && (
                        <p style={{ color: '#e74c3c', fontSize: 11, margin: '4px 0 0' }}>{dlError}</p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {previewDoc && (
        <DocPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          fileName={previewDoc.attachment?.original_name ?? `documento-${previewDoc.id}`}
          mimeType={previewDoc.attachment?.mime_type ?? ''}
          fetchBlob={async () => minorApi.previewDocument(minorId, previewDoc.id)}
          fetchSpreadsheetPreview={async () => minorApi.previewDocumentStructured(minorId, previewDoc.id)}
          onDownload={() => handleDownload(previewDoc)}
          canDownload={hasPermission('attachments.download')}
        />
      )}
    </div>
  )
}

// ─── Tab Profilo ─────────────────────────────────────────────────────────────

interface ProfiloTabProps { minorId: number; initialProfile?: MinorProfile | null }

// Banner per campi sensibili
function SensitiveBadge() {
  return (
    <span
      className='badge badge-light-warning ms-2'
      style={{ fontSize: 11, verticalAlign: 'middle' }}
      title='Contenuto sensibile — visibile solo nella scheda minore ai ruoli autorizzati'
    >
      🔒 Contenuto sensibile
    </span>
  )
}

function ProfiloTab({ minorId, initialProfile }: ProfiloTabProps) {
  const [form, setForm] = useState<MinorProfile>({
    family_background:        initialProfile?.family_background ?? '',
    life_history:             initialProfile?.life_history ?? '',
    learning_styles:          initialProfile?.learning_styles ?? '',
    interests:                initialProfile?.interests ?? '',
    hobbies:                  initialProfile?.hobbies ?? '',
    strengths:                initialProfile?.strengths ?? '',
    risk_factors:             initialProfile?.risk_factors ?? '',
    crisis_indicators:        initialProfile?.crisis_indicators ?? '',
    clinical_notes_encrypted: initialProfile?.clinical_notes_encrypted ?? '',
  })
  const [loading, setLoading] = useState(!initialProfile)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (initialProfile !== undefined) return
    setLoading(true)
    minorApi.getProfile(minorId)
      .then((p) => setForm({
        family_background:        p.family_background ?? '',
        life_history:             p.life_history ?? '',
        learning_styles:          p.learning_styles ?? '',
        interests:                p.interests ?? '',
        hobbies:                  p.hobbies ?? '',
        strengths:                p.strengths ?? '',
        risk_factors:             p.risk_factors ?? '',
        crisis_indicators:        p.crisis_indicators ?? '',
        clinical_notes_encrypted: p.clinical_notes_encrypted ?? '',
      }))
      .catch((e) => setError(apiError(e).message ?? 'Errore'))
      .finally(() => setLoading(false))
  }, [minorId, initialProfile])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await minorApi.upsertProfile(minorId, form)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(apiError(err).message ?? 'Errore')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SectionLoader />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h6 style={{ color: '#7366ff', margin: 0 }}>Profilo psico-educativo</h6>
      </div>
      {error && <div className='alert alert-danger'><AlertTriangle size={14} style={{ marginRight: 6 }} />{error}</div>}
      {success && <div className='alert alert-success'><Save size={14} style={{ marginRight: 6 }} />Profilo salvato con successo.</div>}
      <form onSubmit={handleSave} className='form theme-form'>

        {/* ── 1. Contesto familiare ─────────────────────────────────────── */}
        <div className='card mb-3' style={{ border: '1px solid #ffe0a0', background: '#fffdf5' }}>
          <div className='card-header py-2 px-3' style={{ background: '#fff9eb', borderBottom: '1px solid #ffe0a0' }}>
            <span className='f-w-600' style={{ fontSize: 14 }}>Contesto familiare</span>
            <SensitiveBadge />
          </div>
          <div className='card-body px-3 py-3'>
            <div className='form-group mb-0'>
              <label className='col-form-label f-w-600'>Background familiare</label>
              <textarea
                className='form-control'
                rows={5}
                value={form.family_background ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, family_background: e.target.value }))}
                placeholder='Descrizione del contesto familiare…'
              />
            </div>
          </div>
        </div>

        {/* ── 2. Storia di vita ─────────────────────────────────────────── */}
        <div className='card mb-3' style={{ border: '1px solid #ffe0a0', background: '#fffdf5' }}>
          <div className='card-header py-2 px-3' style={{ background: '#fff9eb', borderBottom: '1px solid #ffe0a0' }}>
            <span className='f-w-600' style={{ fontSize: 14 }}>Storia di vita</span>
            <SensitiveBadge />
          </div>
          <div className='card-body px-3 py-3'>
            <div className='form-group mb-0'>
              <label className='col-form-label f-w-600'>Storia personale</label>
              <textarea
                className='form-control'
                rows={5}
                value={form.life_history ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, life_history: e.target.value }))}
                placeholder='Storia personale e eventi significativi…'
              />
            </div>
          </div>
        </div>

        {/* ── 3. Profilo educativo ──────────────────────────────────────── */}
        <div className='card mb-3' style={{ border: '1px solid #e8e6ff' }}>
          <div className='card-header py-2 px-3' style={{ background: '#f8f7ff', borderBottom: '1px solid #e8e6ff' }}>
            <span className='f-w-600' style={{ fontSize: 14 }}>Profilo educativo</span>
          </div>
          <div className='card-body px-3 py-3'>
            <div className='row'>
              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='col-form-label f-w-600'>Stili di apprendimento</label>
                  <textarea
                    className='form-control'
                    rows={4}
                    value={form.learning_styles ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, learning_styles: e.target.value }))}
                    placeholder='Come apprende meglio…'
                  />
                </div>
              </div>
              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='col-form-label f-w-600'>Interessi</label>
                  <textarea
                    className='form-control'
                    rows={4}
                    value={form.interests ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
                    placeholder='Aree di interesse…'
                  />
                </div>
              </div>
              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='col-form-label f-w-600'>Hobbies e attività preferite</label>
                  <textarea
                    className='form-control'
                    rows={4}
                    value={form.hobbies ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, hobbies: e.target.value }))}
                    placeholder='Passatempi e attività…'
                  />
                </div>
              </div>
              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='col-form-label f-w-600'>Punti di forza</label>
                  <textarea
                    className='form-control'
                    rows={4}
                    value={form.strengths ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))}
                    placeholder='Competenze e risorse personali…'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Rischi e crisi ─────────────────────────────────────────── */}
        <div className='card mb-3' style={{ border: '1px solid #fad4d4' }}>
          <div className='card-header py-2 px-3' style={{ background: '#fff5f5', borderBottom: '1px solid #fad4d4' }}>
            <span className='f-w-600' style={{ fontSize: 14 }}>Rischi e crisi</span>
          </div>
          <div className='card-body px-3 py-3'>
            <div className='row'>
              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='col-form-label f-w-600'>Fattori di rischio</label>
                  <textarea
                    className='form-control'
                    rows={5}
                    value={form.risk_factors ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, risk_factors: e.target.value }))}
                    placeholder='Fattori di rischio identificati…'
                  />
                </div>
              </div>
              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='col-form-label f-w-600'>Indicatori di crisi</label>
                  <textarea
                    className='form-control'
                    rows={5}
                    value={form.crisis_indicators ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, crisis_indicators: e.target.value }))}
                    placeholder='Segnali precoci e comportamenti di crisi…'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. Note cliniche riservate ────────────────────────────────── */}
        <div className='card mb-3' style={{ border: '1px solid #ffe0a0', background: '#fffdf5' }}>
          <div className='card-header py-2 px-3' style={{ background: '#fff9eb', borderBottom: '1px solid #ffe0a0' }}>
            <span className='f-w-600' style={{ fontSize: 14 }}>Note cliniche riservate</span>
            <SensitiveBadge />
          </div>
          <div className='card-body px-3 py-3'>
            <div className='form-group mb-0'>
              <label className='col-form-label f-w-600'>Note cliniche</label>
              <textarea
                className='form-control'
                rows={5}
                value={form.clinical_notes_encrypted ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, clinical_notes_encrypted: e.target.value }))}
                placeholder='Note cliniche riservate — visibili solo ai ruoli autorizzati…'
              />
              <small className='text-muted'>Questo contenuto è cifrato a riposo e non viene incluso nei log di audit.</small>
            </div>
          </div>
        </div>

        <button type='submit' className='btn btn-primary' disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Save size={14} />
          {saving ? 'Salvataggio…' : 'Salva profilo'}
        </button>
      </form>
    </div>
  )
}

// ─── Tab Contatti ─────────────────────────────────────────────────────────────

interface ContattiTabProps { minorId: number }

const EMPTY_CONTACT: MinorContactWrite = {
  contact_type_id: 0,
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  notes: '',
}

function ContattiTab({ minorId }: ContattiTabProps) {
  const [contacts, setContacts] = useState<MinorContact[]>([])
  const [contactTypes, setContactTypes] = useState<LookupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MinorContact | null>(null)
  const [form, setForm] = useState<MinorContactWrite>(EMPTY_CONTACT)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      minorApi.listContacts(minorId),
      lookupsApi.contactTypes(),
    ])
      .then(([c, ct]) => { setContacts(c); setContactTypes(ct) })
      .catch((e) => setError(apiError(e).message ?? 'Errore'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [minorId])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_CONTACT)
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (c: MinorContact) => {
    setEditing(c)
    setForm({
      contact_type_id: c.contact_type_id ?? 0,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone ?? '',
      email: c.email ?? '',
      notes: c.notes ?? '',
    })
    setFormError(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.contact_type_id) { setFormError('Seleziona il tipo contatto.'); return }
    if (!form.first_name) { setFormError('Nome obbligatorio.'); return }
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        const updated = await minorApi.updateContact(minorId, editing.id, form)
        setContacts((prev) => prev.map((c) => c.id === editing.id ? updated : c))
      } else {
        const created = await minorApi.createContact(minorId, form)
        setContacts((prev) => [...prev, created])
      }
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      setFormError(apiError(err).message ?? 'Errore')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (contactId: number) => {
    if (!confirm('Eliminare questo contatto?')) return
    setDeletingId(contactId)
    try {
      await minorApi.deleteContact(minorId, contactId)
      setContacts((prev) => prev.filter((c) => c.id !== contactId))
    } catch (err) {
      setError(apiError(err).message ?? 'Errore')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <SectionLoader />
  if (error) return <SectionError message={error} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h6 style={{ color: '#7366ff', margin: 0 }}>Contatti</h6>
        <button className='btn btn-sm btn-primary' onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} />
          Nuovo contatto
        </button>
      </div>

      {showForm && (
        <div className='card' style={{ background: '#f8f8fb', marginBottom: 20 }}>
          <div className='card-body'>
            <h6 style={{ marginBottom: 16 }}>{editing ? 'Modifica contatto' : 'Nuovo contatto'}</h6>
            {formError && <div className='alert alert-danger'><AlertTriangle size={14} style={{ marginRight: 6 }} />{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className='row'>
                <div className='col-md-4'>
                  <div className='form-group'>
                    <label className='col-form-label'>Tipo contatto <span className='text-danger'>*</span></label>
                    <select
                      className='form-select'
                      value={form.contact_type_id || ''}
                      onChange={(e) => setForm((f) => ({ ...f, contact_type_id: Number(e.target.value) }))}
                    >
                      <option value=''>— Seleziona —</option>
                      {contactTypes.map((ct) => (
                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className='col-md-4'>
                  <div className='form-group'>
                    <label className='col-form-label'>Nome <span className='text-danger'>*</span></label>
                    <input className='form-control' type='text' value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
                  </div>
                </div>
                <div className='col-md-4'>
                  <div className='form-group'>
                    <label className='col-form-label'>Cognome</label>
                    <input className='form-control' type='text' value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
                  </div>
                </div>
                <div className='col-md-4'>
                  <div className='form-group'>
                    <label className='col-form-label'>Telefono</label>
                    <input className='form-control' type='tel' value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
                <div className='col-md-4'>
                  <div className='form-group'>
                    <label className='col-form-label'>Email</label>
                    <input className='form-control' type='email' value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className='col-md-4'>
                  <div className='form-group'>
                    <label className='col-form-label'>Note</label>
                    <input className='form-control' type='text' value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
              </div>
              <button type='submit' className='btn btn-primary btn-sm' disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</button>
              <button type='button' className='btn btn-link btn-sm ms-2' onClick={() => setShowForm(false)}>Annulla</button>
            </form>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className='text-center' style={{ padding: 40, color: '#8d8d8d' }}>
          <Phone size={40} color='#ddd' />
          <p style={{ marginTop: 12 }}>Nessun contatto registrato</p>
        </div>
      ) : (
        <div className='table-responsive'>
          <table className='table table-hover'>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nome</th>
                <th>Cognome</th>
                <th>Telefono</th>
                <th>Email</th>
                <th>Note</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td><span className='badge badge-light-primary'>{c.contact_type?.name ?? `#${c.contact_type_id}`}</span></td>
                  <td>{c.first_name}</td>
                  <td>{c.last_name}</td>
                  <td>{c.phone ?? '—'}</td>
                  <td>{c.email ?? '—'}</td>
                  <td className='text-muted f-12'>{c.notes ?? '—'}</td>
                  <td>
                    <button className='btn btn-sm btn-outline-primary me-1' onClick={() => openEdit(c)} title='Modifica'>
                      <Edit2 size={13} />
                    </button>
                    <button className='btn btn-sm btn-outline-danger' onClick={() => handleDelete(c.id)} disabled={deletingId === c.id} title='Elimina'>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab Operatori assegnati ──────────────────────────────────────────────────

function OperatoriTab({ minorId }: { minorId: number }) {
  const [items,        setItems]        = useState<MinorAssignment[]>([])
  const [allUsers,     setAllUsers]     = useState<import('../../types').AdminUser[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [selectedIds,  setSelectedIds]  = useState<number[]>([])
  const [validFrom,    setValidFrom]    = useState(new Date().toISOString().slice(0, 10))
  const [validTo,      setValidTo]      = useState<string>('')
  const [notes,        setNotes]        = useState<string>('')
  const [saving,       setSaving]       = useState(false)

  const loadData = () => {
    setLoading(true)
    setError(null)
    minorAssignmentApi.assignedUsers(minorId)
      .then((res) => {
        const arr: MinorAssignment[] = Array.isArray(res) ? res : []
        setItems(arr)
      })
      .catch((e) => {
        const status = (e as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          setError('Endpoint non ancora disponibile (404). Le assegnazioni utente non sono ancora attive sul backend.')
        } else {
          setError(apiError(e).message ?? 'Errore caricamento')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [minorId]) // eslint-disable-line react-hooks/exhaustive-deps

  const openModal = () => {
    import('../../services/api').then(({ adminUserApi }) => {
      adminUserApi.list().then(setAllUsers)
    })
    setSelectedIds(items.filter((i) => i.is_active).map((i) => i.user_id))
    setValidFrom(new Date().toISOString().slice(0, 10))
    setValidTo('')
    setNotes('')
    setModalOpen(true)
  }

  const toggleUser = (uid: number) =>
    setSelectedIds((prev) => prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid])

  const handleBulkSave = async () => {
    setSaving(true)
    try {
      await minorAssignmentApi.bulkSyncFromMinor(minorId, {
        user_ids: selectedIds,
        valid_from: validFrom,
        valid_to: validTo || null,
        is_active: true,
        notes: notes || null,
      })
      toast.success('Accessi al minore aggiornati con successo.')
      setModalOpen(false)
      loadData()
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (id: number) => {
    try {
      await minorAssignmentApi.revoke(id)
      toast.success('Assegnazione rimossa con successo.')
      loadData()
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore revoca')
    }
  }

  if (loading) return <div className='text-center py-4'><div className='loader' /></div>
  if (error)   return <div className='alert alert-danger'>{error}</div>

  return (
    <div>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h6 style={{ color: '#7366ff', margin: 0 }}>Accesso al minore</h6>
        <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openModal}>
          <Plus size={14} /> Aggiungi utenti
        </Button>
      </div>

      {items.length === 0 ? (
        <div className='alert alert-light border text-muted'>
          Nessun utente ha accesso a questo minore.
        </div>
      ) : (
        <div className='table-responsive'>
          <table className='table table-hover'>
            <thead className='table-light'>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Ruolo struttura</th>
                <th>Valido dal</th>
                <th>Valido al</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>
                    {item.user ? `${item.user.last_name} ${item.user.first_name}` : `#${item.user_id}`}
                  </td>
                  <td><small className='text-muted'>{item.user?.email ?? '—'}</small></td>
                  <td>{item.user?.user_facility_roles?.find((fr) => fr.is_active !== false)?.role?.name ?? '—'}</td>
                  <td>{fmtDate(item.valid_from)}</td>
                  <td>{item.valid_to ? fmtDate(item.valid_to) : <span className='text-muted'>—</span>}</td>
                  <td>
                    {item.is_active
                      ? <span className='badge bg-success'>Attiva</span>
                      : <span className='badge bg-secondary'>Revocata</span>}
                  </td>
                  <td>
                    {item.is_active && (
                      <button className='btn btn-sm btn-outline-danger' title='Rimuovi accesso'
                        onClick={() => handleRevoke(item.id)}>
                        <UserX size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal aggiungi utenti */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='lg'>
        <ModalHeader toggle={() => setModalOpen(false)}>Aggiungi utenti — accesso al minore</ModalHeader>
        <ModalBody>
          <Row className='mb-3'>
            <Col md='4'>
              <Label className='form-label'>Valido dal <span className='text-danger'>*</span></Label>
              <Input type='date' value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </Col>
            <Col md='4'>
              <Label className='form-label'>Valido al <small className='text-muted'>(opzionale)</small></Label>
              <Input type='date' value={validTo} onChange={(e) => setValidTo(e.target.value)} />
            </Col>
            <Col md='4'>
              <Label className='form-label'>Note</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='Note opzionali' />
            </Col>
          </Row>
          <div className='table-responsive' style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table className='table table-hover table-sm'>
              <thead className='table-light sticky-top'>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Cognome Nome</th>
                  <th>Email</th>
                  <th>Ruolo struttura</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.length === 0 && (
                  <tr><td colSpan={4} className='text-center text-muted py-3'>Caricamento utenti…</td></tr>
                )}
                {allUsers.map((u) => (
                  <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => toggleUser(u.id)}>
                    <td>
                      <Input type='checkbox' checked={selectedIds.includes(u.id)}
                        onChange={() => toggleUser(u.id)} onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td>{u.last_name} {u.first_name}</td>
                    <td><small className='text-muted'>{u.email}</small></td>
                    <td>{u.user_facility_roles?.find((fr) => fr.is_active !== false)?.role?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <small className='text-muted'>{selectedIds.length} utent{selectedIds.length === 1 ? 'e' : 'i'} selezionat{selectedIds.length === 1 ? 'o' : 'i'}</small>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleBulkSave} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva assegnazioni'}
          </Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// --- Pagina principale ---


export default function MinoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const minorId = Number(id)
  const { hasRole } = useAuth()
  const canEdit = hasRole(['super_admin', 'direttore', 'coordinatore'])

  const [minor, setMinor] = useState<Minor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('anagrafica')
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    minorApi.get(minorId)
      .then(setMinor)
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 403) {
          setError('Non puoi aprire la scheda completa di questo minore: verifica assegnazione attiva e permesso sensibile `minor_profiles.read`.')
        } else {
          setError(ae.message ?? 'Errore')
        }
      })
      .finally(() => setLoading(false))
  }, [minorId])

  if (loading) {
    return (
      <div className='container-fluid'>
        <SectionLoader />
      </div>
    )
  }

  if (error || !minor) {
    return (
      <div className='container-fluid'>
        <SectionError message={error ?? 'Minore non trovato'} />
      </div>
    )
  }

  const fullName = `${minor.first_name} ${minor.last_name}`

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'anagrafica',     label: 'Anagrafica',    icon: <User size={14} /> },
    { key: 'profilo',        label: 'Profilo',       icon: <Shield size={14} /> },
    { key: 'contatti',       label: 'Contatti',      icon: <Phone size={14} /> },
    { key: 'diario',         label: 'Diario',        icon: <FileText size={14} /> },
    { key: 'uscite',         label: 'Uscite',        icon: <LogOut size={14} /> },
    { key: 'avvicinamenti',  label: 'Avvicinamenti', icon: <Info size={14} /> },
    { key: 'attivita',       label: 'Attivit\u00E0',      icon: <Clipboard size={14} /> },
    { key: 'caso',           label: 'Caso',          icon: <Briefcase size={14} /> },
    { key: 'documenti',      label: 'Documenti',     icon: <FileText size={14} /> },
    { key: 'note',           label: 'Note',          icon: <Lock size={14} /> },
    { key: 'operatori',      label: 'Accessi',       icon: <Users size={14} /> },
    { key: 'storico',        label: 'Storico',       icon: <Clock size={14} /> },
  ]

  return (
    <div className='container-fluid'>
      <div className='page-title'>
        <div className='row'>
          <div className='col-sm-6'><h3>{fullName}</h3></div>
          <div className='col-sm-6'>
            <ol className='breadcrumb'>
              <li className='breadcrumb-item'><Link to='/dashboard'>Home</Link></li>
              <li className='breadcrumb-item'><Link to='/minori'>Minori</Link></li>
              <li className='breadcrumb-item active'>{fullName}</li>
            </ol>
          </div>
        </div>
      </div>

      <div className='row'>
        <div className='col-sm-12'>
          <MinorGlobalSummaryCard minor={minor} />
          <div className='card'>
            <div className='card-header'>
              <div className='d-flex align-items-center justify-content-between mb-3'>
                <div className='d-flex align-items-center gap-2'>
                  <button className='btn btn-light btn-sm' onClick={() => navigate('/minori')}>
                    <ArrowLeft size={14} />
                  </button>
                  <div>
                    <h5 className='card-title mb-0'>{fullName}</h5>
                    <small className='text-muted'>
                      Codice: {minor.internal_code}
                      {minor.tax_code ? ` · CF: ${minor.tax_code}` : ''}
                    </small>
                  </div>
                </div>
                <div className='d-flex align-items-center gap-2'>
                  <button
                    className='btn btn-light btn-sm d-flex align-items-center gap-1'
                    onClick={() => setInfoOpen(true)}
                    title='Informazioni accesso'
                  >
                    <Info size={13} /> Informazioni
                  </button>
                  {canEdit && (
                    <button
                      className='btn btn-primary btn-sm d-flex align-items-center gap-1'
                      onClick={() => navigate(`/minori/${minorId}/modifica`)}
                    >
                      <Edit2 size={14} />
                      Modifica
                    </button>
                  )}
                </div>
              </div>
              <Nav tabs className='border-tab nav-primary mb-0'>
                {tabs.map((t) => (
                  <NavItem key={t.key}>
                    <NavLink
                      href='#'
                      className={activeTab === t.key ? 'active' : ''}
                      onClick={(e) => { e.preventDefault(); setActiveTab(t.key) }}
                    >
                      <span className='d-flex align-items-center gap-1'>{t.icon}{t.label}</span>
                    </NavLink>
                    <div className='material-border'></div>
                  </NavItem>
                ))}
              </Nav>
            </div>

            <div className='card-body'>
              <TabContent activeTab={activeTab}>
                <TabPane tabId='anagrafica'>
                  <div>
                    <PeiTrendDashboardCard minor={minor} />
                    <InfoRow label='Nome' value={minor.first_name} />
                    <InfoRow label='Cognome' value={minor.last_name} />
                    <InfoRow label='Codice interno' value={minor.internal_code} />
                    <InfoRow label='Codice fiscale' value={minor.tax_code} />
                    <InfoRow label='Data di nascita' value={fmtDate(minor.birth_date)} />
                    <InfoRow label='Città di nascita' value={minor.birth_city?.name} />
                    <InfoRow label='Sesso biologico' value={minor.biological_sex?.name} />
                    <InfoRow label='Genere' value={minor.gender_identity?.name} />
                    <InfoRow label='Struttura' value={minor.facility?.name} />
                    <InfoRow label='Stato' value={minor.minor_status?.name} />
                    <InfoRow label='Data ingresso' value={fmtDate(minor.entry_date)} />
                  </div>
                </TabPane>
                <TabPane tabId='profilo'>
                  <ProfiloEstesoMinoreTab
                    minorId={minorId}
                    facilityId={minor.facility_id}
                    initialProfile={minor.profile}
                    initialDiagnoses={minor.diagnoses}
                    initialPeis={minor.peis}
                    initialNeeds={minor.needs}
                  />
                </TabPane>
                <TabPane tabId='caso'>
                  <CasoMinoreTab
                    minorId={minorId}
                    facilityId={minor.facility_id}
                    initialCaseDetail={minor.case_detail}
                  />
                </TabPane>
                <TabPane tabId='contatti'>
                  <ContattiTab minorId={minorId} />
                </TabPane>
                <TabPane tabId='documenti'>
                  <DocumentiTab minorId={minorId} initialDocuments={minor.documents ?? []} />
                </TabPane>
                <TabPane tabId='operatori'>
                  <div className='alert alert-info py-2 px-3 mb-3 d-flex align-items-start gap-2' style={{ fontSize: 13 }}>
                    <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                      Questa tab mostra le <strong>assegnazioni manuali</strong> al minore. Alcuni ruoli privilegiati
                      di sistema (SUPER_ADMIN, DIRETTORE, COORDINATORE) possono accedere senza comparire in questo elenco.
                    </span>
                  </div>
                  <OperatoriTab minorId={minorId} />
                </TabPane>
                <TabPane tabId='uscite'>
                  <UsciteMinoreTab minorId={minorId} facilityId={minor.facility_id} />
                </TabPane>
                <TabPane tabId='attivita'>
                  <AttivitaMinoreTab minorId={minorId} />
                </TabPane>
                <TabPane tabId='avvicinamenti'>
                  <AvvicinamentiMinoreTab minorId={minorId} />
                </TabPane>
                <TabPane tabId='diario'>
                  <DiarioMinoreTab minorId={minorId} />
                </TabPane>
                <TabPane tabId='note'>
                  <NoteMinoreTab minorId={minorId} />
                </TabPane>
                <TabPane tabId='storico'>
                  <StoricoTab minorId={minorId} />
                </TabPane>
              </TabContent>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer guida accesso minori */}
      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title={`Guida accesso \u2014 ${fullName}`}>
        <MinoriGuideContent />
      </InfoDrawer>
    </div>

  )
}

function MinoriGuideContent() {
  return (
    <>
      <section className='mb-4'>
        <h6 className='fw-bold mb-2'>A cosa serve questa scheda</h6>
        <p style={{ fontSize: 14, color: '#444' }}>
          La scheda minore espone dati anagrafici, operativi e documentali ad alta sensibilit\u00E0.
          Ogni sezione richiede una combinazione specifica di permessi e assegnazioni attive.
        </p>
      </section>

      <section className='mb-4'>
        <h6 className='fw-bold mb-2'>Come funziona l&apos;accesso</h6>
        <div className='alert alert-info py-2 px-3 mb-2' style={{ fontSize: 13 }}>
          Per le aree sensibili servono sia il permesso RBAC corretto sia un&apos;assegnazione attiva al minore.
        </div>
        <div className='alert alert-warning py-2 px-3' style={{ fontSize: 13 }}>
          <strong>Ruoli privilegiati</strong> (SUPER_ADMIN, DIRETTORE, COORDINATORE) possono accedere
          senza assegnazione puntuale. Questa eccezione non si applica ai ruoli personalizzati.
        </div>
      </section>

      <section className='mb-4'>
        <h6 className='fw-bold mb-2'>Significato delle tab</h6>
        <table className='table table-sm table-bordered' style={{ fontSize: 13 }}>
          <thead className='table-light'>
            <tr><th>Tab</th><th>Contenuto</th><th>Note accesso</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Anagrafica</strong></td><td>Dati identificativi e amministrativi, KPI PEI e trend obiettivi</td><td>\u2014</td></tr>
            <tr><td><strong>Profilo</strong></td><td>Informazioni di contesto del caso</td><td>Area sensibile</td></tr>
            <tr><td><strong>Contatti</strong></td><td>Riferimenti relazionali</td><td>Modifica richiede permessi specifici</td></tr>
            <tr><td><strong>Documenti</strong></td><td>Documenti del minore</td><td>Soggetti anche a regole ABAC su tag</td></tr>
            <tr><td><strong>Accesso al minore</strong></td><td>Assegnazioni manuali operatori</td><td>I ruoli privilegiati non compaiono qui</td></tr>
            <tr><td><strong>Uscite / Attivit\u00E0</strong></td><td>Record collegati al minore</td><td>Solo lettura</td></tr>
            <tr><td><strong>Note riservate</strong></td><td>Note cifrate con classificazione documentale</td><td>ABAC: classificazione + assegnazione attiva</td></tr>
            <tr><td><strong>Storico</strong></td><td>Cronologia eventi</td><td>\u2014</td></tr>
          </tbody>
        </table>
      </section>

      <section className='mb-4'>
        <h6 className='fw-bold mb-2'>Trend PEI in dashboard</h6>
        <p style={{ fontSize: 14, color: '#444' }}>
          In alto nella tab <strong>Anagrafica</strong> \u00E8 disponibile un riepilogo operativo del PEI:
          numero di PEI attivi, obiettivi completati, avanzamento medio, andamento per obiettivo
          ed eventi recenti provenienti da Attivit\u00E0 e Diario educativo.
        </p>
      </section>

      <section className='mb-4'>
        <h6 className='fw-bold mb-2'>Documenti e accesso ABAC</h6>
        <p style={{ fontSize: 14, color: '#444' }}>
          La visibilit\u00E0 dei documenti pu\u00F2 essere pi\u00F9 restrittiva rispetto alla scheda minore, anche per utenti
          con il ruolo corretto. I documenti seguono policy ABAC basate su tre fattori:
        </p>
        <ul style={{ fontSize: 13, color: '#444', paddingLeft: 20 }}>
          <li><strong>Classificazione del documento</strong> \u2014 internal, restricted, clinical, judicial</li>
          <li><strong>Ruolo effettivo nella struttura</strong> \u2014 ogni ruolo ha una matrice documentale definita dalla policy di sistema</li>
          <li><strong>Assegnazione attiva al minore</strong> \u2014 per i ruoli operativi, senza assegnazione non \u00E8 possibile accedere ai documenti, nemmeno se il ruolo RBAC \u00E8 corretto</li>
        </ul>
        <div className='alert alert-warning py-2 px-3 mt-2' style={{ fontSize: 12 }}>
          <strong>Esempio:</strong> un Educatore assegnato al minore pu\u00F2 leggere documenti <code>internal</code>
          ma non scaricare documenti <code>restricted</code> e non accedere a documenti <code>clinical</code> o <code>judicial</code>.
          Questo non dipende dai permessi RBAC ma dalle regole ABAC di sistema.
        </div>
      </section>

      <section className='mb-3'>
        <h6 className='fw-bold mb-2'>Errori frequenti</h6>
        <ul style={{ fontSize: 14, color: '#444', paddingLeft: 20 }}>
          <li><strong>403 su un documento</strong>: regola ABAC \u2014 dipende dalla classificazione del file e dal ruolo, non dal permesso modulo</li>
          <li><strong>Pulsante Scarica assente</strong>: download non consentito da policy ABAC per questa classificazione e ruolo</li>
          <li><strong>Operatore non compare nella tab "Accesso al minore"</strong>: ha ruolo privilegiato (accesso implicito, non compare in lista)</li>
          <li><strong>Tab vuota</strong>: dati non ancora inseriti, non necessariamente un errore</li>
        </ul>
      </section>
    </>
  )
}
