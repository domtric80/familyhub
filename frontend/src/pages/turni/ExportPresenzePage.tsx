import { useState, useEffect } from 'react'
import {
  Card, CardBody, Button, Row, Col, FormGroup, Label, Input, Alert,
} from 'reactstrap'
import { Download, FileText, Info } from 'react-feather'
import { toast } from 'react-toastify'
import { timesheetApi, facilityApi, apiError } from '../../services/api'
import type { Facility } from '../../types'
import InfoDrawer from '../../components/common/InfoDrawer'

const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

export default function ExportPresenzePage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilityId, setFacilityId] = useState(0)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [format, setFormat] = useState<'csv'>('csv')
  const [exporting, setExporting] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [lastExport, setLastExport] = useState<{ label: string; at: string }[]>([])

  useEffect(() => {
    facilityApi.list().then((list) => {
      setFacilities(list)
      if (list.length > 0) setFacilityId(list[0].id)
    }).catch(() => {})
  }, [])

  const handleExport = async () => {
    if (!facilityId) {
      toast.warning('Seleziona una struttura.')
      return
    }

    setExporting(true)
    try {
      const response = await timesheetApi.exportMonthly({ facility_id: facilityId, year, month, format })
      const blob = response.data as Blob
      const url = URL.createObjectURL(blob)
      const filename = `presenze_${year}_${month.toString().padStart(2, '0')}_struttura${facilityId}.${format}`
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      const label = `${MONTHS[month - 1]} ${year} — ${format.toUpperCase()}`
      setLastExport((prev) => [{ label, at: new Date().toLocaleString('it-IT') }, ...prev.slice(0, 4)])
      toast.success(`Export ${format.toUpperCase()} scaricato.`)
    } catch (e) {
      const error = apiError(e)
      if (error.status === 404) toast.error('Nessuna entry approvata per il periodo selezionato.')
      else toast.error(error.message ?? 'Errore durante l\'export.')
    } finally {
      setExporting(false)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className='container-fluid py-3'>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h5 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Export presenze</h5>
        <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
          <Info size={13} /> Info
        </Button>
      </div>

      <Row>
        <Col md='6'>
          <Card>
            <CardBody>
              <h6 className='fw-semibold mb-3'>Parametri export</h6>

              <Alert color='info' className='small py-2'>
                <strong>Solo entry approvate</strong> — l&apos;export include unicamente le entry nello stato <em>Approvato</em> o <em>Bloccato</em>.
              </Alert>

              <FormGroup>
                <Label>Struttura</Label>
                <Input type='select' value={facilityId} onChange={(e) => setFacilityId(Number(e.target.value))}>
                  <option value='0'>Seleziona struttura…</option>
                  {facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}
                </Input>
              </FormGroup>

              <Row>
                <Col xs='6'>
                  <FormGroup>
                    <Label>Anno</Label>
                    <Input type='select' value={year} onChange={(e) => setYear(Number(e.target.value))}>
                      {years.map((currentYear) => <option key={currentYear} value={currentYear}>{currentYear}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col xs='6'>
                  <FormGroup>
                    <Label>Mese</Label>
                    <Input type='select' value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                      {MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              <FormGroup>
                <Label>Formato</Label>
                <div className='d-flex gap-3'>
                  <label className='d-flex align-items-center gap-2' style={{ cursor: 'pointer' }}>
                    <input type='radio' name='fmt' checked={format === 'csv'} onChange={() => setFormat('csv')} />
                    <span className='small fw-semibold'>CSV paghe</span>
                    <span className='text-muted small'>— disponibile nel backend attuale</span>
                  </label>
                </div>
                <div className='small text-muted mt-2'>Il PDF presenze verrà riattivato quando sarà disponibile il generatore backend dedicato.</div>
              </FormGroup>

              <Button color='primary' className='d-flex align-items-center gap-2' disabled={!facilityId || exporting} onClick={handleExport}>
                {exporting
                  ? <><div className='loader' style={{ width: 16, height: 16, borderWidth: 2 }} /> Generazione…</>
                  : <><Download size={15} /> Scarica export</>}
              </Button>
            </CardBody>
          </Card>
        </Col>

        <Col md='6'>
          <Card>
            <CardBody>
              <h6 className='fw-semibold mb-3 d-flex align-items-center gap-2'>
                <FileText size={15} style={{ color: '#7366ff' }} /> Storico sessione
              </h6>
              {lastExport.length === 0 ? (
                <div className='text-muted small'>Nessun export generato in questa sessione.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lastExport.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8f9ff', borderRadius: 6, fontSize: 13 }}>
                      <span className='fw-semibold'>{item.label}</span>
                      <span className='text-muted'>{item.at}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className='mt-3 small text-muted'>Gli export vengono scaricati direttamente.</div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Export presenze — Guida'>
        <p>Genera il <strong>report mensile presenze</strong> per la struttura selezionata.</p>
        <p>Nel backend attuale l&apos;export operativo disponibile è il <strong>CSV paghe</strong>.</p>
        <p>L&apos;export include solo le entry in stato <em>Approvato</em> o <em>Bloccato</em>.</p>
      </InfoDrawer>
    </div>
  )
}
