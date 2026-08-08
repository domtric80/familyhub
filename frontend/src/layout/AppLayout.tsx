import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { useAuth } from '../contexts/AuthContext'
import { UnreadMessagesProvider } from '../contexts/UnreadMessagesContext'
import Header from './header/Header'
import Sidebar from './sidebar/Sidebar'
import Footer from './footer/Footer'

export default function AppLayout() {
  const { isAuthenticated, loading, user } = useAuth()
  const [toggleIcon, setToggleIcon] = useState(false)

  if (loading) {
    return (
      <div className="loader-wrapper">
        <div className="loader-index">
          <span></span>
          <svg>
            <filter id="goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </svg>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const needsMfa = user?.mfa?.setup_required ?? false

  if (needsMfa) return <Navigate to="/mfa/setup" replace />

  const handleToggle = () => setToggleIcon(v => !v)

  return (
    <UnreadMessagesProvider>
      <div className="page-wrapper compact-wrapper" id="pageWrapper">
        <Header toggleIcon={toggleIcon} onToggle={handleToggle} />
        <div className="page-body-wrapper">
          <Sidebar toggleIcon={toggleIcon} onToggle={handleToggle} />
          <div className="page-body">
            <Outlet />
          </div>
          <Footer />
        </div>
        <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
      </div>
    </UnreadMessagesProvider>
  )
}
