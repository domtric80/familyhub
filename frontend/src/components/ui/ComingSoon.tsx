import type { ReactNode } from 'react'

interface ComingSoonProps {
  icon: ReactNode
  title: string
  description: string
  features: string[]
  breadcrumb: string[]
}

export default function ComingSoon({ icon, title, description, features, breadcrumb }: ComingSoonProps) {
  return (
    <div className='container-fluid'>
      <div className='page-title'>
        <div className='row'>
          <div className='col-sm-6'><h3>{title}</h3></div>
          <div className='col-sm-6'>
            <ol className='breadcrumb'>
              <li className='breadcrumb-item'><a href='/dashboard'>Home</a></li>
              {breadcrumb.map((b, i) => (
                <li key={i} className={`breadcrumb-item${i === breadcrumb.length - 1 ? ' active' : ''}`}>{b}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className='card'>
        <div className='card-body text-center' style={{ padding: '60px 40px' }}>
          <div style={{ color: '#7366ff', marginBottom: 24 }}>{icon}</div>
          <h4 style={{ color: '#2b2b2b', marginBottom: 12 }}>{title}</h4>
          <p style={{ color: '#8d8d8d', maxWidth: 480, margin: '0 auto 32px' }}>{description}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
            {features.map((f) => (
              <span key={f} style={{
                background: '#f0eeff', color: '#7366ff',
                padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 500
              }}>✓ {f}</span>
            ))}
          </div>

          <div style={{
            background: '#f8f8fb', borderRadius: 12, padding: '20px 32px',
            display: 'inline-block', border: '2px dashed #d6d3f4'
          }}>
            <p style={{ margin: 0, color: '#7366ff', fontWeight: 600 }}>🚀 In sviluppo — Fase 2</p>
            <p style={{ margin: '4px 0 0', color: '#8d8d8d', fontSize: 13 }}>Questo modulo sarà disponibile nella prossima release</p>
          </div>
        </div>
      </div>
    </div>
  )
}
