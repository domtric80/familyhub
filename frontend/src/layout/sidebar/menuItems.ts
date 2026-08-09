export interface MenuItem {
  title: string
  icon: string
  type: 'link' | 'sub'
  path?: string
  roles?: string[]
  permission?: string
  badge?: string
  badgetxt?: string
  active?: boolean
  children?: MenuItem[]
}

export interface MenuSection {
  menutitle: string
  Items: MenuItem[]
}

export const MENUITEMS: MenuSection[] = [
  {
    menutitle: 'Principale',
    Items: [
      { title: 'Dashboard', icon: 'home', type: 'link', path: '/dashboard' },
    ],
  },
  {
    menutitle: 'Minori',
    Items: [
      {
        title: 'Minori',
        icon: 'user',
        type: 'sub',
        active: false,
        children: [
          { title: 'Lista minori', icon: 'user', type: 'link', path: '/minori' },
          { title: 'Nuovo minore', icon: 'user', type: 'link', path: '/minori/nuovo' },
        ],
      },
      { title: 'Uscite',           icon: 'to-do',    type: 'link', path: '/uscite' },
      { title: 'Attivita',         icon: 'calendar', type: 'link', path: '/attivita' },
      { title: 'Avvicinamenti',    icon: 'contact',  type: 'link', path: '/avvicinamenti' },
      { title: 'Diario educativo', icon: 'blog',     type: 'link', path: '/diario' },
    ],
  },
  {
    menutitle: 'Organizzazione',
    Items: [
      { title: 'Educatori', icon: 'user', type: 'link', path: '/educatori' },
      { title: 'Messaggistica', icon: 'chat', type: 'link', path: '/messaggi' },
      {
        title: 'Turni',
        icon: 'calendar',
        type: 'sub',
        active: false,
        children: [
          { title: 'Pianificazione settimanale', icon: 'calendar', type: 'link', path: '/turni' },
          { title: 'Dashboard timesheet',        icon: 'charts',   type: 'link', path: '/turni/timesheet' },
          { title: 'Modelli turno',              icon: 'table',    type: 'link', path: '/turni/modelli' },
          { title: 'La mia settimana',           icon: 'board',    type: 'link', path: '/turni/mia-settimana' },
          { title: 'Le mie presenze',            icon: 'form',     type: 'link', path: '/turni/presenze' },
          { title: 'Verifica timesheet',         icon: 'charts',   type: 'link', path: '/turni/verifica' },
          { title: 'Lock mensili',               icon: 'lock',     type: 'link', path: '/turni/lock' },
          { title: 'Export presenze',            icon: 'file',     type: 'link', path: '/turni/export' },
        ],
      },
    ],
  },
  {
    menutitle: 'Amministrazione',
    Items: [
      {
        title: 'Amministrazione',
        icon: 'widget',
        type: 'sub',
        active: false,
        children: [
          { title: 'Organizzazioni',         icon: 'widget',   type: 'link', path: '/admin/organizzazioni', roles: ['super_admin', 'admin'] },
          { title: 'Strutture',              icon: 'builders', type: 'link', path: '/admin/strutture' },
          { title: 'Utenti',                 icon: 'user',     type: 'link', path: '/admin/utenti' },
          { title: 'Assegnazioni struttura', icon: 'contact',  type: 'link', path: '/admin/assegnazioni' },
          { title: 'Assegnazioni minori',    icon: 'contact',  type: 'link', path: '/admin/assegnazioni-minori' },
          { title: 'Audit log',              icon: 'others',   type: 'link', path: '/admin/audit' },
          { title: 'KPI Sicurezza',          icon: 'charts',   type: 'link', path: '/admin/audit-kpi' },
          { title: 'Backup',                 icon: 'project',  type: 'link', path: '/admin/backup' },
          { title: 'Storage documentale',    icon: 'widget',   type: 'link', path: '/admin/sistema/storage' },
          { title: 'Health servizi',         icon: 'charts',   type: 'link', path: '/admin/sistema/health' },
        ],
      },
    ],
  },
  {
    menutitle: 'Impostazioni',
    Items: [
      {
        title: 'Localizzazione',
        icon: 'maps',
        type: 'sub',
        active: false,
        children: [
          { title: 'Geografia', icon: 'maps',   type: 'link', path: '/anagrafiche/geografia' },
          { title: 'Sync',      icon: 'maps',   type: 'link', path: '/anagrafiche/geografia-sync',     permission: 'geography_sync.read' },
          { title: 'Provider',  icon: 'widget', type: 'link', path: '/anagrafiche/provider-geografia', permission: 'geography_providers.read' },
        ],
      },
      {
        title: 'Documenti',
        icon: 'file',
        type: 'sub',
        active: false,
        children: [
          { title: 'Tipo',            icon: 'file',     type: 'link', path: '/anagrafiche/tipi-documento' },
          { title: 'Classificazione', icon: 'bookmark', type: 'link', path: '/anagrafiche/classificazioni' },
          { title: 'Scope',           icon: 'file',     type: 'link', path: '/anagrafiche/scope-documento' },
        ],
      },
      {
        title: 'Minore',
        icon: 'user',
        type: 'sub',
        active: false,
        children: [
          { title: 'Stati',  icon: 'bookmark', type: 'link', path: '/anagrafiche/stati-minore' },
          { title: 'Generi', icon: 'bookmark', type: 'link', path: '/anagrafiche/generi' },
          { title: 'Sesso',  icon: 'bookmark', type: 'link', path: '/anagrafiche/sesso' },
        ],
      },
      { title: 'Ruoli',             icon: 'others',    type: 'link', path: '/anagrafiche/ruoli' },
      { title: 'Tipi contatto',     icon: 'contact',   type: 'link', path: '/anagrafiche/tipi-contatto' },
      { title: 'Tipi uscita',       icon: 'to-do',     type: 'link', path: '/anagrafiche/tipi-uscita' },
      { title: 'Tipi attività',     icon: 'calendar',  type: 'link', path: '/anagrafiche/tipi-attivita' },
      { title: 'Qualifiche',        icon: 'job-search', type: 'link', path: '/anagrafiche/qualifiche-operatori' },
      { title: 'Stati operatori',   icon: 'task',      type: 'link', path: '/anagrafiche/stati-operatori' },
      { title: 'Stati struttura',   icon: 'builders',  type: 'link', path: '/anagrafiche/stati-struttura' },
      { title: 'Stati doc. staff',  icon: 'file',      type: 'link', path: '/anagrafiche/stati-documenti-staff' },
      { title: 'Enti rilascio',     icon: 'contact',   type: 'link', path: '/anagrafiche/enti-rilascio' },
      { title: 'Tipi avvicinamento', icon: 'email',    type: 'link', path: '/anagrafiche/tipi-avvicinamento' },
      { title: 'Tipi voce diario',  icon: 'blog',      type: 'link', path: '/anagrafiche/tipi-diario' },
    ],
  },
  {
    menutitle: 'Sicurezza',
    Items: [
      {
        title: 'Sicurezza',
        icon: 'others',
        type: 'sub',
        active: false,
        children: [
          { title: 'Profilo utente',     icon: 'user', type: 'link', path: '/profilo' },
          { title: 'Configurazione MFA', icon: 'form', type: 'link', path: '/mfa/config' },
        ],
      },
    ],
  },
]
