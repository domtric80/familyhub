import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Search, Eye, Trash2, AlertTriangle, Info } from 'react-feather'
import { minorApi, apiError } from '../../services/api'
import type { Minor } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import InfoDrawer from '../../components/common/InfoDrawer'

function statusBadge(statusId: number) {
  const map: Record<number, { label: string; cls: string }> = {
    1: { label: 'Accolto', cls: 'badge-light-success' },
    2: { label: 'In uscita', cls: 'badge-light-warning' },
    3: { label: 'Dimesso', cls: 'badge-light-secondary' },
  }
  const s = map[statusId] ?? { label: 'Sconosciuto', cls: 'badge-light-secondary' }
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}

function age(birthDate: string): number {
  const today = new Date()
  const dob = new Date(birthDate)
  let a = today.getFullYear() - dob.getFullYear()
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) a--
  return a
}

export default function MinoriListPage() {
  const { hasRole } = useAuth()
  const navigate = useNavigate()
  const canCreate = hasRole(['super_admin', 'direttore', 'coordinatore'])
  const isPrivileged = hasRole(['super_admin', 'admin', 'direttore', 'coordinatore'])

  const [minori, setMinori] = useState<Minor[]>([])
  const [filtered, setFiltered] = useState<Minor[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    minorApi.list()
      .then((data) => { setMinori(data); setFiltered(data) })
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      minori.filter((m) =>
        `${m.first_name} ${m.last_name} ${m.internal_code}`.toLowerCase().includes(q)
      )
    )
  }, [search, minori])

  const handleDelete = async (id: number) => {
    if (!confirm('Confermi l\'eliminazione del minore? Questa azione è irreversibile.')) return
    try {
      await minorApi.delete(id)
      setMinori((prev) => prev.filter((m) => m.id !== id))
      setDeleteId(null)
    } catch (e) {
      alert(apiError(e).message ?? 'Errore eliminazione')
    }
  }

  void deleteId

  return (
    <div className='container-fluid'>
      <div className='page-title'>
        <div className='row'>
          <div className='col-6'>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0 }}>Minori</h3>
                <button
                  className='btn btn-light btn-sm d-flex align-items-center gap-1'
                  onClick={() => setInfoOpen(true)}
                  title='Informazioni sulla sezione'
                >
                  <Info size={13} /> Informazioni
                </button>
              </div>
            </div>
          <div className='col-6'>
            <ol className='breadcrumb'>
              <li className='breadcrumb-item'><a href='/dashboard'>Home</a></li>
              <li className='breadcrumb-item active'>Elenco minori</li>
            </ol>
          </div>
        </div>
      </div>

      <div className='row'>
        <div className='col-sm-12'>
          <div className='card'>
            <div className='card-header' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h5>Schede minori</h5>
              {canCreate && (
                <button
                  className='btn btn-primary'
                  onClick={() => navigate('/minori/nuovo')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <UserPlus size={16} /> Aggiungi minore
                </button>
              )}
            </div>
            <div className='card-body'>

              {/* Barra ricerca */}
              <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8d8d8d' }} />
                <input
                  className='form-control'
                  placeholder='Cerca per nome o codice…'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
              </div>

              {error && <div className='alert alert-danger'>{error}</div>}

              {loading ? (
                <div className='text-center' style={{ padding: 40 }}>
                  <div className='loader'></div>
                </div>
              ) : filtered.length === 0 ? (
                <div className='text-center' style={{ padding: 40, color: '#8d8d8d' }}>
                  <AlertTriangle size={48} color='#ddd' />
                  <p style={{ marginTop: 12 }}>
                    {search
                      ? 'Nessun risultato per la ricerca'
                      : !isPrivileged
                        ? 'Non risultano minori assegnati al tuo profilo.'
                        : 'Nessun minore registrato'}
                  </p>
                </div>
              ) : (
                <div className='table-responsive'>
                  <table className='table table-hover'>
                    <thead className='table-light'>
                      <tr>
                        <th>Codice</th>
                        <th>Nome</th>
                        <th>Età</th>
                        <th>Data ingresso</th>
                        <th>Struttura</th>
                        <th>Stato</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <code style={{ background: '#f0eeff', color: '#7366ff', padding: '2px 8px', borderRadius: 4 }}>
                              {m.internal_code}
                            </code>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{m.first_name} {m.last_name}</div>
                            {m.preferred_name && <small style={{ color: '#8d8d8d' }}>({m.preferred_name})</small>}
                          </td>
                          <td>{age(m.birth_date)} anni</td>
                          <td>{new Date(m.entry_date).toLocaleDateString('it-IT')}</td>
                          <td>{m.facility?.name ?? `#${m.facility_id}`}</td>
                          <td>{statusBadge(m.minor_status_id)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className='btn btn-sm btn-outline-primary'
                                onClick={() => navigate(`/minori/${m.id}`)}
                                title='Visualizza scheda'
                              >
                                <Eye size={14} />
                              </button>
                              {hasRole(['super_admin', 'direttore', 'coordinatore']) && (
                                <button
                                  className='btn btn-sm btn-outline-danger'
                                  onClick={() => handleDelete(m.id)}
                                  title='Elimina'
                                >
                                  <Trash2 size={14} />
                                </button>
                                     )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ color: '#8d8d8d', fontSize: 13, marginTop: 8 }}>
                {filtered.length} minori visualizzati
                {search && minori.length !== filtered.length && ` su ${minori.length} totali`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer guida sezione Minori */}
      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — Sezione Minori'>
        <MinoriGuideContent />
      </InfoDrawer>
    </div>
  )
}

function MinoriGuideContent() {
  return (
    <>
      <section className='mb-4'>
        <h6 className='fw-bold mb-2'>A cosa serve</h6>
        <p style={{ fontSize: 14, color: '#444' }}>
          La sezione Minori consente di consultare e gestire le informazioni anagrafiche, operative e
          documentali dei minori presi in carico dalla struttura.
        </p>
      </section>

      <section className='mb-4'>
        <h6 className='fw-bold mb-2'>Elenco vs scheda completa</h6>
        <p style={{ fontSize: 14, color: '#444' }}>
          L&apos;elenco mostra i minori disponibili alla consultazione in base al tuo ruolo e alle
          assegnazioni attive. La scheda completa espone dati più sensibili e richiede controlli
          di accesso aggiuntivi.
        </p>
      </section>

      <section className='mb-4'>
        <h6 className='fw-bold mb-2'>Come funziona l&apos;accesso</h6>
        <div className='alert alert-info py-2 px-3' style={{ fontSize: 13 }}>
          Per aprire o modificare le aree sensibili non basta il ruolo: in molti casi servono sia
          il permesso assegnato al ruolo <strong>(RBAC)</strong> sia un&apos;assegnazione attiva al
          minore.
        </div>
        <div className='alert alert-warning py-2 px-3 mt-2' style={{ fontSize: 13 }}>
          <strong>Eccezione — ruoli privilegiati</strong>: SUPER_ADMIN, DIRETTORE e COORDINATORE
          possono operare sui minori della struttura senza assegnazione puntuale. Questa eccezione
          non si applica ai ruoli personalizzati.
        </div>
      </section>

      <section className='mb-4'>
        <h6 className='fw-bold mb-2'>Documenti e dati sensibili</h6>
        <p style={{ fontSize: 14, color: '#444' }}>
          La visibilità dei documenti può essere più restrittiva della visibilità della scheda minore,
          perché i documenti seguono anche regole basate su tag e classificazioni <strong>(ABAC)</strong>.
        </p>
      </section>

      <section className='mb-4'>
        <h6 className='fw-bold mb-2'>Le tab della scheda minore</h6>
        <table className='table table-sm table-bordered' style={{ fontSize: 13 }}>
          <thead className='table-light'>
            <tr><th>Tab</th><th>Contenuto</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Anagrafica</strong></td><td>Dati identificativi e amministrativi</td></tr>
            <tr><td><strong>Profilo</strong></td><td>Informazioni di contesto del caso (area sensibile)</td></tr>
            <tr><td><strong>Contatti</strong></td><td>Riferimenti relazionali del minore</td></tr>
            <tr><td><strong>Documenti</strong></td><td>Documentazione soggetta anche a regole ABAC</td></tr>
            <tr><td><strong>Accesso al minore</strong></td><td>Assegnazioni puntuali degli operatori</td></tr>
            <tr><td><strong>Uscite / Attività</strong></td><td>Record collegati al minore (lettura)</td></tr>
            <tr><td><strong>Storico</strong></td><td>Cronologia eventi e operazioni</td></tr>
          </tbody>
        </table>
      </section>

      <section className='mb-3'>
        <h6 className='fw-bold mb-2'>Errori frequenti</h6>
        <ul style={{ fontSize: 13, paddingLeft: 18, color: '#444' }}>
          <li className='mb-1'>
            <strong>403 su scheda completa</strong>: verifica assegnazione attiva e permesso
            <code> minor_profiles.read</code>
          </li>
          <li className='mb-1'>
            <strong>403 su Uscite / Attività</strong>: verifica permessi di ruolo e assegnazione
            attiva al minore
          </li>
          <li>
            <strong>Elenco vuoto</strong>: se il tuo ruolo non è privilegiato, l&apos;elenco mostra
            solo i minori a te assegnati
          </li>
        </ul>
      </section>
    </>
  )
}
