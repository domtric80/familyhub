import { useEffect, useState } from 'react'
import {
  Row, Col, FormGroup, Label, Input, Alert, Button,
} from 'reactstrap'
import { Edit2, Save, X, FileText, Info, Eye } from 'react-feather'
import { toast } from 'react-toastify'
import { minorApi, adminCountryApi, adminRegionApi, adminProvinceApi, adminCityApi, apiError } from '../../../services/api'
import type { MinorDocument, MinorCaseDetail, MinorCaseOptions, Country, Region, Province, City } from '../../../types'
import InfoDrawer from '../../../components/common/InfoDrawer'

function docLabel(doc: { id: number; label?: string | null; attachment?: { original_name?: string } | null }) {
  return doc.label ?? doc.attachment?.original_name ?? `Doc #${doc.id}`
}

function staffLabel(s: { first_name: string; last_name: string; display_name?: string | null }) {
  return s.display_name?.trim() || `${s.last_name} ${s.first_name}`
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='p-3 rounded mb-3' style={{ background: '#f4f5f7' }}>
      <strong style={{ color: '#333', display: 'block', marginBottom: 10 }}>{title}</strong>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className='mb-1 small'>
      <span className='text-muted'>{label}:</span>{' '}
      <span style={{ color: '#333' }}>{value ?? '—'}</span>
    </div>
  )
}

/** Apre il documento in una nuova tab per la visualizzazione */
async function openDoc(minorId: number, docId: number) {
  try {
    const blob = await minorApi.previewDocument(minorId, docId)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    // Revoca dopo 60s — il tab ha già caricato il file
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch {
    toast.error('Impossibile aprire il documento.')
  }
}

export default function CasoMinoreTab({
  minorId,
  initialCaseDetail,
}: {
  minorId: number
  facilityId: number   // mantenuto per compatibilità props
  initialCaseDetail?: MinorCaseDetail | null
}) {
  const [caseDetail, setCaseDetail] = useState<MinorCaseDetail | null>(initialCaseDetail ?? null)
  const [editing, setEditing]       = useState(false)
  const [form, setForm]             = useState<MinorCaseDetail>({})
  const [saving, setSaving]         = useState(false)
  const [formMsg, setFormMsg]       = useState<string | null>(null)
  const [infoOpen, setInfoOpen]     = useState(false)

  // Lookup data
  const [opts, setOpts]         = useState<MinorCaseOptions | null>(null)
  const [optsErr, setOptsErr]   = useState(false)
  const [minorDocs, setMinorDocs] = useState<MinorDocument[]>([])

  // Geography per cascade città di ingresso — caricamento a livelli
  const [geoCountries, setGeoCountries]   = useState<Country[]>([])
  const [geoRegions, setGeoRegions]       = useState<Region[]>([])
  const [geoProvinces, setGeoProvinces]   = useState<Province[]>([])
  const [geoCities, setGeoCities]         = useState<City[]>([])
  const [geoCountryId, setGeoCountryId]   = useState<number>(0)
  const [geoRegionId, setGeoRegionId]     = useState<number>(0)
  const [geoProvinceId, setGeoProvinceId] = useState<number>(0)
  const [geoLoading, setGeoLoading]       = useState(false)

  useEffect(() => {
    minorApi.getCaseOptions(minorId)
      .then(setOpts)
      .catch(() => setOptsErr(true))

    minorApi.listDocuments(minorId)
      .then(setMinorDocs)
      .catch(() => {})

    adminCountryApi.list()
      .then(setGeoCountries)
      .catch(() => {})
  }, [minorId])

  const openEdit = async () => {
    setGeoCountryId(0); setGeoRegionId(0); setGeoProvinceId(0)
    setGeoRegions([]); setGeoProvinces([]); setGeoCities([])

    if (caseDetail?.entry_city_id) {
      try {
        setGeoLoading(true)
        const city = await adminCityApi.get(caseDetail.entry_city_id)
        const province = city.province
        const region = province?.region
        const country = region?.country

        if (country?.id) {
          setGeoCountryId(country.id)
          const regions = await adminRegionApi.list(country.id)
          setGeoRegions(regions)

          if (region?.id) {
            setGeoRegionId(region.id)
            const provinces = await adminProvinceApi.list(region.id)
            setGeoProvinces(provinces)

            if (province?.id) {
              setGeoProvinceId(province.id)
              const cities = await adminCityApi.list(province.id)
              setGeoCities(cities)
            }
          }
        }
      } catch {
        setGeoCountryId(0); setGeoRegionId(0); setGeoProvinceId(0)
        setGeoRegions([]); setGeoProvinces([]); setGeoCities([])
      } finally {
        setGeoLoading(false)
      }
    }

    setForm({
      entry_city_id:                         caseDetail?.entry_city_id ?? null,
      origin_facility_id:                    caseDetail?.origin_facility_id ?? null,
      origin_structure_name:                 caseDetail?.origin_structure_name ?? null,
      placement_order_reference:             caseDetail?.placement_order_reference ?? null,
      placement_order_minor_document_id:     caseDetail?.placement_order_minor_document_id ?? null,
      judicial_authority_document_issuer_id: caseDetail?.judicial_authority_document_issuer_id ?? null,
      proceeding_number:                     caseDetail?.proceeding_number ?? null,
      next_hearing_at:                       caseDetail?.next_hearing_at?.slice(0, 10) ?? null,
      general_practitioner_staff_member_id:  caseDetail?.general_practitioner_staff_member_id ?? null,
      pediatrician_staff_member_id:          caseDetail?.pediatrician_staff_member_id ?? null,
      health_authority_document_issuer_id:   caseDetail?.health_authority_document_issuer_id ?? null,
      vaccination_minor_document_id:         caseDetail?.vaccination_minor_document_id ?? null,
    })
    setFormMsg(null)
    setEditing(true)
  }

  const setF = (k: keyof MinorCaseDetail, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const handleCountryChange = async (id: number) => {
    setGeoCountryId(id); setGeoRegionId(0); setGeoProvinceId(0)
    setGeoRegions([]); setGeoProvinces([]); setGeoCities([])
    setF('entry_city_id', null)

    if (!id) return

    setGeoLoading(true)
    try {
      setGeoRegions(await adminRegionApi.list(id))
    } catch {
      setGeoRegions([])
    } finally {
      setGeoLoading(false)
    }
  }
  const handleRegionChange = async (id: number) => {
    setGeoRegionId(id); setGeoProvinceId(0)
    setGeoProvinces([]); setGeoCities([])
    setF('entry_city_id', null)

    if (!id) return

    setGeoLoading(true)
    try {
      setGeoProvinces(await adminProvinceApi.list(id))
    } catch {
      setGeoProvinces([])
    } finally {
      setGeoLoading(false)
    }
  }
  const handleProvinceChange = async (id: number) => {
    setGeoProvinceId(id)
    setGeoCities([])
    setF('entry_city_id', null)

    if (!id) return

    setGeoLoading(true)
    try {
      setGeoCities(await adminCityApi.list(id))
    } catch {
      setGeoCities([])
    } finally {
      setGeoLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true); setFormMsg(null)
    try {
      const result = await minorApi.upsertCaseDetails(minorId, form)
      setCaseDetail(result)
      setEditing(false)
      toast.success('Scheda caso aggiornata.')
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setFormMsg('Non hai i permessi per modificare la scheda caso.')
      else setFormMsg(ae.message ?? 'Errore durante il salvataggio.')
    } finally { setSaving(false) }
  }

  // ── Vista lettura ───────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div>
        <div className='d-flex justify-content-between align-items-center mb-3'>
          <h6 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Scheda caso legale e sanitaria</h6>
          <div className='d-flex gap-2'>
            <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1'
              onClick={() => setInfoOpen(true)}>
              <Info size={13} /> Info
            </Button>
            <Button size='sm' color='primary' className='d-flex align-items-center gap-1'
              onClick={openEdit}>
              <Edit2 size={13} /> {caseDetail ? 'Modifica scheda caso' : 'Compila scheda caso'}
            </Button>
          </div>
        </div>

        {!caseDetail ? (
          <div className='text-center py-5'>
            <FileText size={40} className='text-muted mb-3' />
            <p className='text-muted'>Scheda caso non ancora compilata.</p>
            <Button color='primary' size='sm' onClick={openEdit}>Compila scheda caso</Button>
          </div>
        ) : (
          <>
            <InfoSection title='Ingresso e provenienza'>
              <InfoRow label='Città di ingresso' value={caseDetail.entry_city?.name} />
              <InfoRow label='Struttura di provenienza (censita)' value={caseDetail.origin_facility?.name} />
              <InfoRow label='Struttura di provenienza (libera)' value={caseDetail.origin_structure_name} />
            </InfoSection>

            <InfoSection title='Provvedimento di affidamento'>
              <InfoRow label='Riferimento decreto/ordinanza' value={caseDetail.placement_order_reference} />
              {caseDetail.placement_order_document && (
                <div className='mb-1 small d-flex align-items-center gap-2'>
                  <span className='text-muted'>Documento collegato:</span>
                  <button
                    className='btn btn-sm badge badge-light-primary d-inline-flex align-items-center gap-1 border-0'
                    style={{ cursor: 'pointer' }}
                    onClick={() => openDoc(minorId, caseDetail.placement_order_document!.id)}
                    title='Visualizza documento'
                  >
                    <FileText size={11} />
                    {docLabel(caseDetail.placement_order_document)}
                    <Eye size={11} className='ms-1' />
                  </button>
                </div>
              )}
            </InfoSection>

            <InfoSection title='Autorità giudiziaria'>
              <InfoRow label='Autorità giudiziaria' value={caseDetail.judicial_authority?.name} />
              <InfoRow label='Numero procedimento' value={caseDetail.proceeding_number} />
              <InfoRow label='Prossima udienza' value={caseDetail.next_hearing_at
                ? new Date(caseDetail.next_hearing_at).toLocaleDateString('it-IT') : null} />
            </InfoSection>

            <InfoSection title='Riferimenti sanitari'>
              <InfoRow label='Medico di base'
                value={caseDetail.general_practitioner
                  ? staffLabel(caseDetail.general_practitioner)
                  : null} />
              <InfoRow label='Pediatra'
                value={caseDetail.pediatrician
                  ? staffLabel(caseDetail.pediatrician)
                  : null} />
              <InfoRow label='ASL di riferimento' value={caseDetail.health_authority?.name} />
              {caseDetail.vaccination_document && (
                <div className='mb-1 small d-flex align-items-center gap-2'>
                  <span className='text-muted'>Cartella vaccinale:</span>
                  <button
                    className='btn btn-sm badge badge-light-success d-inline-flex align-items-center gap-1 border-0'
                    style={{ cursor: 'pointer' }}
                    onClick={() => openDoc(minorId, caseDetail.vaccination_document!.id)}
                    title='Visualizza documento'
                  >
                    <FileText size={11} />
                    {docLabel(caseDetail.vaccination_document)}
                    <Eye size={11} className='ms-1' />
                  </button>
                </div>
              )}
            </InfoSection>
          </>
        )}

        <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Scheda caso — Guida'>
          <p>La <strong>scheda caso</strong> raccoglie i dati legali e sanitari strutturati del minore, distinti dall'anagrafica base.</p>
          <p><strong>Ingresso e provenienza</strong> — registra come e da dove il minore è arrivato in struttura.</p>
          <p><strong>Provvedimento</strong> — il riferimento al decreto o ordinanza di affidamento, con possibilità di collegare il documento già caricato.</p>
          <p><strong>Autorità giudiziaria</strong> — l'ente giudiziario competente, il numero di procedimento e la prossima udienza.</p>
          <p><strong>Riferimenti sanitari</strong> — medico di base, pediatra e ASL devono essere operatori censiti nel sistema. La cartella vaccinale può essere collegata a un documento del minore già caricato.</p>
          <p className='text-muted small'>Ogni modifica alla scheda caso viene tracciata nel registro audit.</p>
        </InfoDrawer>
      </div>
    )
  }

  // ── Vista modifica ──────────────────────────────────────────────────────────
  return (
    <div>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h6 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Modifica scheda caso</h6>
        <div className='d-flex gap-2'>
          <Button size='sm' color='primary' className='d-flex align-items-center gap-1'
            onClick={handleSave} disabled={saving}>
            <Save size={13} /> {saving ? 'Salvataggio…' : 'Salva'}
          </Button>
          <Button size='sm' color='secondary' className='d-flex align-items-center gap-1'
            onClick={() => setEditing(false)}>
            <X size={13} /> Annulla
          </Button>
        </div>
      </div>

      {formMsg && <Alert color='warning'>{formMsg}</Alert>}
      {optsErr && (
        <Alert color='warning' className='small'>
          Impossibile caricare le opzioni di selezione dal backend. I menu a tendina potrebbero essere vuoti.
        </Alert>
      )}

      {/* Blocco 1: Ingresso e provenienza */}
      <h6 className='fw-bold text-muted border-bottom pb-1 mb-3'>Ingresso e provenienza</h6>
      <Row>
        <Col md='3'>
          <FormGroup>
            <Label>Nazione di ingresso</Label>
            <Input type='select' value={geoCountryId} disabled={geoLoading}
              onChange={(e) => handleCountryChange(Number(e.target.value))}>
              <option value='0'>
                {geoLoading ? 'Caricamento…' : geoCountries.length === 0 ? 'Nessuna nazione disponibile' : 'Seleziona nazione…'}
              </option>
              {geoCountries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Input>
          </FormGroup>
        </Col>
        <Col md='3'>
          <FormGroup>
            <Label>Regione</Label>
            <Input type='select' value={geoRegionId} disabled={!geoCountryId || geoLoading}
              onChange={(e) => handleRegionChange(Number(e.target.value))}>
              <option value='0'>{!geoCountryId ? '—' : geoLoading ? 'Caricamento…' : 'Seleziona regione…'}</option>
              {geoRegions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Input>
          </FormGroup>
        </Col>
        <Col md='3'>
          <FormGroup>
            <Label>Provincia</Label>
            <Input type='select' value={geoProvinceId} disabled={!geoRegionId || geoLoading}
              onChange={(e) => handleProvinceChange(Number(e.target.value))}>
              <option value='0'>{!geoRegionId ? '—' : geoLoading ? 'Caricamento…' : 'Seleziona provincia…'}</option>
              {geoProvinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Input>
          </FormGroup>
        </Col>
        <Col md='3'>
          <FormGroup>
            <Label>Città di ingresso</Label>
            <Input type='select' value={form.entry_city_id ?? ''} disabled={!geoProvinceId || geoLoading}
              onChange={(e) => setF('entry_city_id', Number(e.target.value) || null)}>
              <option value=''>{!geoProvinceId ? '—' : geoLoading ? 'Caricamento…' : 'Seleziona città…'}</option>
              {geoCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Input>
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col md='4'>
          <FormGroup>
            <Label>Struttura di provenienza censita</Label>
            <Input type='select' value={form.origin_facility_id ?? ''}
              onChange={(e) => setF('origin_facility_id', Number(e.target.value) || null)}>
              <option value=''>— Nessuna —</option>
              {(opts?.origin_facilities ?? []).map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Input>
            <small className='text-muted'>Oppure inserire il nome libero sotto</small>
          </FormGroup>
        </Col>
        <Col md='8'>
          <FormGroup>
            <Label>Nome struttura di provenienza (testo libero)</Label>
            <Input value={form.origin_structure_name ?? ''}
              onChange={(e) => setF('origin_structure_name', e.target.value || null)}
              placeholder='Es. Casa famiglia Il Girasole' />
          </FormGroup>
        </Col>
      </Row>

      {/* Blocco 2: Provvedimento */}
      <h6 className='fw-bold text-muted border-bottom pb-1 mb-3 mt-3'>Provvedimento di affidamento</h6>
      <Row>
        <Col md='6'>
          <FormGroup>
            <Label>Riferimento decreto/ordinanza</Label>
            <Input value={form.placement_order_reference ?? ''}
              onChange={(e) => setF('placement_order_reference', e.target.value || null)}
              placeholder='Es. Decreto TM 2026/1458' />
          </FormGroup>
        </Col>
        <Col md='6'>
          <FormGroup>
            <Label>Documento collegato</Label>
            <Input type='select' value={form.placement_order_minor_document_id ?? ''}
              onChange={(e) => setF('placement_order_minor_document_id', Number(e.target.value) || null)}>
              <option value=''>— Nessun documento —</option>
              {minorDocs.map((doc) => (
                <option key={doc.id} value={doc.id}>{docLabel(doc)}</option>
              ))}
            </Input>
          </FormGroup>
        </Col>
      </Row>

      {/* Blocco 3: Autorità giudiziaria */}
      <h6 className='fw-bold text-muted border-bottom pb-1 mb-3 mt-3'>Autorità giudiziaria</h6>
      <Row>
        <Col md='4'>
          <FormGroup>
            <Label>Autorità giudiziaria</Label>
            <Input type='select' value={form.judicial_authority_document_issuer_id ?? ''}
              onChange={(e) => setF('judicial_authority_document_issuer_id', Number(e.target.value) || null)}>
              <option value=''>— Seleziona —</option>
              {(opts?.judicial_authorities ?? []).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Input>
          </FormGroup>
        </Col>
        <Col md='4'>
          <FormGroup>
            <Label>Numero procedimento</Label>
            <Input value={form.proceeding_number ?? ''}
              onChange={(e) => setF('proceeding_number', e.target.value || null)}
              placeholder='Es. PROC-2026-778' />
          </FormGroup>
        </Col>
        <Col md='4'>
          <FormGroup>
            <Label>Prossima udienza</Label>
            <Input type='date' value={form.next_hearing_at ?? ''}
              onChange={(e) => setF('next_hearing_at', e.target.value || null)} />
          </FormGroup>
        </Col>
      </Row>

      {/* Blocco 4: Riferimenti sanitari */}
      <h6 className='fw-bold text-muted border-bottom pb-1 mb-3 mt-3'>Riferimenti sanitari</h6>
      <Row>
        <Col md='6'>
          <FormGroup>
            <Label>Medico di base</Label>
            <Input type='select' value={form.general_practitioner_staff_member_id ?? ''}
              onChange={(e) => setF('general_practitioner_staff_member_id', Number(e.target.value) || null)}>
              <option value=''>— Seleziona —</option>
              {(opts?.general_practitioners ?? []).map((s) => (
                <option key={s.id} value={s.id}>{staffLabel(s)}</option>
              ))}
            </Input>
          </FormGroup>
        </Col>
        <Col md='6'>
          <FormGroup>
            <Label>Pediatra</Label>
            <Input type='select' value={form.pediatrician_staff_member_id ?? ''}
              onChange={(e) => setF('pediatrician_staff_member_id', Number(e.target.value) || null)}>
              <option value=''>— Seleziona —</option>
              {(opts?.pediatricians ?? []).map((s) => (
                <option key={s.id} value={s.id}>{staffLabel(s)}</option>
              ))}
            </Input>
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col md='6'>
          <FormGroup>
            <Label>ASL di riferimento</Label>
            <Input type='select' value={form.health_authority_document_issuer_id ?? ''}
              onChange={(e) => setF('health_authority_document_issuer_id', Number(e.target.value) || null)}>
              <option value=''>— Seleziona —</option>
              {(opts?.health_authorities ?? []).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Input>
          </FormGroup>
        </Col>
        <Col md='6'>
          <FormGroup>
            <Label>Cartella vaccinale (documento collegato)</Label>
            <Input type='select' value={form.vaccination_minor_document_id ?? ''}
              onChange={(e) => setF('vaccination_minor_document_id', Number(e.target.value) || null)}>
              <option value=''>— Nessun documento —</option>
              {(opts?.vaccination_documents ?? []).map((doc) => (
                <option key={doc.id} value={doc.id}>{docLabel(doc)}</option>
              ))}
            </Input>
            <small className='text-muted'>Solo documenti sanitari del minore</small>
          </FormGroup>
        </Col>
      </Row>
    </div>
  )
}
