import { Users, Navigation, Calendar, Clock, AlertTriangle, FileText, BookOpen, TrendingUp } from 'react-feather'
import { useAuth } from '../../contexts/AuthContext'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
  trend?: string
}

function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  return (
    <div className='col-xl-3 col-sm-6 box-col-6'>
      <div className='card widget-1'>
        <div className='card-body'>
          <div className='widget-content'>
            <div className={`widget-round ${color}`}>
              <div className='bg-round'>
                {icon}
              </div>
            </div>
            <div>
              <h4>{value}</h4>
              <span className='f-light'>{title}</span>
            </div>
          </div>
          {(subtitle || trend) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              {trend && <TrendingUp size={14} color='#28a745' />}
              <p className='font-roboto mb-0' style={{ color: '#8d8d8d', fontSize: 12 }}>{subtitle ?? trend}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface AlertCardProps {
  type: 'warning' | 'danger' | 'info'
  title: string
  message: string
}

function AlertCard({ type, title, message }: AlertCardProps) {
  const colors: Record<string, string> = { warning: '#ff9f43', danger: '#e74c3c', info: '#7366ff' }
  const icons: Record<string, React.ReactNode> = {
    warning: <AlertTriangle size={18} />,
    danger: <AlertTriangle size={18} />,
    info: <FileText size={18} />
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
      borderLeft: `4px solid ${colors[type]}`, background: '#fff',
      borderRadius: '0 8px 8px 0', marginBottom: 10
    }}>
      <span style={{ color: colors[type], marginTop: 2 }}>{icons[type]}</span>
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{title}</p>
        <p style={{ margin: 0, color: '#8d8d8d', fontSize: 13 }}>{message}</p>
      </div>
    </div>
  )
}

// Dashboard per Educatore
function DashboardEducatore() {
  return (
    <>
      <div className='row widget-grid'>
        <StatCard title='Minori in turno' value={8} icon={<Users size={22} color='#fff' />} color='secondary' />
        <StatCard title='Uscite oggi' value={2} subtitle='1 in attesa di rientro' icon={<Navigation size={22} color='#fff' />} color='primary' />
        <StatCard title='Attività programmate' value={3} subtitle='Prossima alle 15:00' icon={<Calendar size={22} color='#fff' />} color='warning' />
        <StatCard title='Ore turno' value='6h 30m' subtitle='Turno in corso' icon={<Clock size={22} color='#fff' />} color='success' />
      </div>

      <div className='row'>
        <div className='col-xl-8'>
          <div className='card'>
            <div className='card-header'>
              <h5>Prossime attività</h5>
            </div>
            <div className='card-body'>
              <div className='table-responsive'>
                <table className='table table-bordernone'>
                  <thead>
                    <tr>
                      <th>Orario</th>
                      <th>Attività</th>
                      <th>Partecipanti</th>
                      <th>Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>15:00</td>
                      <td>Laboratorio creativo</td>
                      <td>4 ragazzi</td>
                      <td><span className='badge badge-light-primary'>Programmato</span></td>
                    </tr>
                    <tr>
                      <td>17:30</td>
                      <td>Compiti scolastici</td>
                      <td>6 ragazzi</td>
                      <td><span className='badge badge-light-warning'>Da confermare</span></td>
                    </tr>
                    <tr>
                      <td>20:00</td>
                      <td>Cena e tempo libero</td>
                      <td>8 ragazzi</td>
                      <td><span className='badge badge-light-success'>Confermato</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className='col-xl-4'>
          <div className='card'>
            <div className='card-header'>
              <h5>Avvisi urgenti</h5>
            </div>
            <div className='card-body'>
              <AlertCard type='warning' title='Rientro in ritardo' message='Marco R. previsto rientro 16:00 — nessun contatto' />
              <AlertCard type='info' title='Consegna turno' message='Passaggio consegne con Lucia D. alle 22:00' />
              <p style={{ color: '#8d8d8d', fontSize: 13, marginTop: 12 }}>Nessun altro avviso attivo</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Dashboard per Coordinatore
function DashboardCoordinatore() {
  return (
    <>
      <div className='row widget-grid'>
        <StatCard title='Minori accolti' value={12} subtitle='+1 questa settimana' icon={<Users size={22} color='#fff' />} color='secondary' trend='+1' />
        <StatCard title='Turni coperti' value='95%' subtitle='1 turno scoperto domani' icon={<Clock size={22} color='#fff' />} color='primary' />
        <StatCard title='Documenti in scadenza' value={3} subtitle='Entro 30 giorni' icon={<FileText size={22} color='#fff' />} color='warning' />
        <StatCard title='Segnalazioni aperte' value={1} subtitle='Livello giallo' icon={<AlertTriangle size={22} color='#fff' />} color='danger' />
      </div>

      <div className='row'>
        <div className='col-xl-8'>
          <div className='card'>
            <div className='card-header'>
              <h5>Riepilogo settimanale KPI</h5>
            </div>
            <div className='card-body'>
              <div className='row'>
                {[
                  { label: 'Uscite questa settimana', value: 14, max: 20 },
                  { label: 'Avvicinamenti familiari', value: 6, max: 10 },
                  { label: 'Attività educative svolte', value: 18, max: 20 },
                  { label: 'Diari compilati', value: 21, max: 21 },
                ].map((kpi) => (
                  <div className='col-md-6' key={kpi.label} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{kpi.label}</span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{kpi.value}/{kpi.max}</span>
                    </div>
                    <div style={{ background: '#f0eeff', borderRadius: 99, height: 8 }}>
                      <div style={{
                        background: '#7366ff',
                        width: `${(kpi.value / kpi.max) * 100}%`,
                        height: '100%', borderRadius: 99
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className='col-xl-4'>
          <div className='card'>
            <div className='card-header'>
              <h5>Scadenze imminenti</h5>
            </div>
            <div className='card-body'>
              <AlertCard type='warning' title='Udienza Tribunale' message='Andrea M. — 25/06/2026' />
              <AlertCard type='danger' title='Certificato penale' message='Educatore: scade il 30/06/2026' />
              <AlertCard type='info' title='Rinnovo PEI' message='Sofia L. — revisione prevista luglio' />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Dashboard per Direttore
function DashboardDirettore() {
  return (
    <>
      <div className='row widget-grid'>
        <StatCard title='Minori accolti' value={12} subtitle='Su 14 posti disponibili' icon={<Users size={22} color='#fff' />} color='secondary' />
        <StatCard title='Relazioni in scadenza' value={2} subtitle='Per il Tribunale' icon={<FileText size={22} color='#fff' />} color='danger' />
        <StatCard title='Avvicinamenti attivi' value={8} subtitle='Questa settimana' icon={<BookOpen size={22} color='#fff' />} color='primary' />
        <StatCard title='Ore straordinario' value={24} subtitle='Questo mese' icon={<Clock size={22} color='#fff' />} color='warning' />
      </div>

      <div className='row'>
        <div className='col-xl-12'>
          <div className='card'>
            <div className='card-header'>
              <h5>Panoramica struttura</h5>
            </div>
            <div className='card-body'>
              <div className='table-responsive'>
                <table className='table'>
                  <thead>
                    <tr>
                      <th>Struttura</th>
                      <th>Posti occupati</th>
                      <th>Educatori in turno</th>
                      <th>Uscite oggi</th>
                      <th>Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Casa Arcobaleno</td>
                      <td>8/10</td>
                      <td>3</td>
                      <td>2</td>
                      <td><span className='badge badge-light-success'>Operativa</span></td>
                    </tr>
                    <tr>
                      <td>Casa Serena</td>
                      <td>4/8</td>
                      <td>2</td>
                      <td>1</td>
                      <td><span className='badge badge-light-success'>Operativa</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Riquadro Profilo connesso
function ProfileBlock() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div className='card'>
      <div className='card-header'><h5>Profilo connesso</h5></div>
      <div className='card-body'>
        <table className='table table-borderless mb-0 table-sm'>
          <tbody>
            <tr><th style={{ width: 120 }}>Nome</th><td>{user.first_name} {user.last_name}</td></tr>
            <tr><th>Email</th><td>{user.email}</td></tr>
            <tr>
              <th>Ruoli</th>
              <td>
                {user.user_facility_roles && user.user_facility_roles.length > 0
                  ? user.user_facility_roles.filter((fr) => fr.is_active !== false).map((fr) => (
                      <span key={fr.id} className='badge badge-light-primary me-1'>
                        {fr.role?.name ?? fr.role?.code} {fr.facility ? `@ ${fr.facility.name}` : ''}
                      </span>
                    ))
                  : <span className='text-muted'>Nessuna assegnazione</span>
                }
              </td>
            </tr>
            <tr>
              <th>MFA</th>
              <td>
                <span className={`badge ${user.mfa_confirmed_at ? 'badge-light-success' : 'badge-light-warning'}`}>
                  {user.mfa_confirmed_at ? 'Attiva' : 'Non attiva'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <a href='/profilo' className='btn btn-outline-primary btn-sm mt-3'>Vedi profilo completo</a>
      </div>
    </div>
  )
}

function PermessiBlock() {
  const { user } = useAuth()
  const perms = user?.capabilities?.permissions ?? []
  return (
    <div className='card'>
      <div className='card-header'><h5>Permessi applicativi</h5></div>
      <div className='card-body'>
        {perms.length === 0
          ? <p className='text-muted mb-0'>Nessun permesso</p>
          : <div className='d-flex flex-wrap gap-1'>
              {perms.map((p) => <span key={p} className='badge badge-light-secondary mb-1'>{p}</span>)}
            </div>
        }
      </div>
    </div>
  )
}

function ClassificazioniBlock() {
  const { user } = useAuth()
  const dcs = user?.capabilities?.document_classifications ?? []
  return (
    <div className='card'>
      <div className='card-header'><h5>Classificazioni documentali consentite</h5></div>
      <div className='card-body'>
        {dcs.length === 0
          ? <p className='text-muted mb-0'>Nessuna classificazione</p>
          : <div className='d-flex flex-wrap gap-1'>
              {dcs.map((dc) => (
                <span key={dc.code} className='badge badge-light-info mb-1' title={dc.description ?? undefined}>{dc.name}</span>
              ))}
            </div>
        }
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth()
  const isDirector = hasRole(['direttore', 'super_admin'])
  const isCoordinator = hasRole(['coordinatore'])
  return (
    <div className='container-fluid'>
      <div className='page-title'>
        <div className='row'>
          <div className='col-6'><h3>Dashboard</h3></div>
          <div className='col-6'>
            <ol className='breadcrumb'>
              <li className='breadcrumb-item active'>Benvenuto, {user?.first_name}!</li>
            </ol>
          </div>
        </div>
      </div>
      {isDirector
        ? <DashboardDirettore />
        : isCoordinator
          ? <DashboardCoordinatore />
          : <DashboardEducatore />
      }
      <div className='row'>
        <div className='col-xl-4 col-md-6'><ProfileBlock /></div>
        <div className='col-xl-4 col-md-6'><PermessiBlock /></div>
        <div className='col-xl-4 col-md-12'><ClassificazioniBlock /></div>
      </div>
    </div>
  )
}
