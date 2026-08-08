import type { ReactNode } from 'react'
import { X } from 'react-feather'

interface InfoDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Drawer laterale generico per guide contestuali e informazioni di sezione.
 * Usato da: RuoliPage, MinoriListPage, MinoreDetailPage, …
 */
export default function InfoDrawer({ isOpen, onClose, title, children }: InfoDrawerProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 1040,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 520,
          maxWidth: '95vw',
          background: '#fff',
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e9ecef',
            background: '#f8f9fa',
          }}
        >
          <h5 style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{title}</h5>
          <button
            className='btn btn-sm btn-light'
            onClick={onClose}
            style={{ lineHeight: 1, padding: '4px 6px' }}
            aria-label='Chiudi'
          >
            <X size={16} />
          </button>
        </div>

        {/* Body scrollabile */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {children}
        </div>
      </div>
    </>
  )
}
