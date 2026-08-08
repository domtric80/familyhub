import { Grid } from 'react-feather'
import ComingSoon from '../../components/ui/ComingSoon'

export default function TurniPage() {
  return (
    <ComingSoon
      icon={<Grid size={64} />}
      title='Pianificazione turni'
      description='Calendario turni mensile per ogni educatore, con drag-and-drop, verifica automatica dei limiti e gestione sostituzioni.'
      features={[
        'Turni mattina / pomeriggio / notte / h24 / reperibilità',
        'Drag-and-drop per assegnazione e spostamento',
        'Verifica automatica minimo riposo e tetto ore',
        'Gestione sostituzioni con proposta automatica',
        'Notifiche push/email per turno assegnato o modificato',
      ]}
      breadcrumb={['Turni e Timesheet', 'Pianificazione']}
    />
  )
}
