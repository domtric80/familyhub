import { FileText } from 'react-feather'
import ComingSoon from '../../components/ui/ComingSoon'

export default function TimesheetPage() {
  return (
    <ComingSoon
      icon={<FileText size={64} />}
      title='Timesheet'
      description='Timbratura digitale, registrazione automatica ore lavorate e gestione straordinari con approvazione del coordinatore.'
      features={[
        'Timbratura digitale con geolocalizzazione opzionale',
        'Confronto ore pianificate vs. lavorate',
        'Richiesta straordinari con workflow di approvazione',
        'Export mensile presenze PDF/CSV per paghe',
        'Dashboard ore per educatore e per struttura',
        'Integrazione tracciato sistemi paghe (Zucchetti, ecc.)',
      ]}
      breadcrumb={['Turni e Timesheet', 'Timesheet']}
    />
  )
}
