import { AlignCenter, LogIn, User, Bell } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface HeaderProps {
  toggleIcon: boolean
  onToggle: () => void
}

export default function Header({ toggleIcon, onToggle }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const displayName = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email
    : ''

  return (
    <div className={`page-header${toggleIcon ? ' close_icon' : ''}`}>
      <div className="header-wrapper row m-0">

        {/* Logo (mobile) + toggle sidebar */}
        <div className="header-logo-wrapper col-auto p-0" id="out_side_click">
          <div className="logo-wrapper">
            <Link to="/dashboard">
              <img className="img-fluid for-light" src="/images/logo/logo.png" alt="FamilyHub" />
              <img className="img-fluid for-dark" src="/images/logo/logo_dark.png" alt="FamilyHub" />
            </Link>
          </div>
          <div className="toggle-sidebar" onClick={onToggle}>
            <AlignCenter className="status_toggle middle sidebar-toggle" id="sidebar-toggle" />
          </div>
        </div>

        {/* left-header — placeholder notifiche (vuoto) */}
        <div className="left-header col-xxl-5 col-xl-6 col-lg-5 col-md-4 col-sm-3 p-0" />

        {/* Destra: notifiche + profilo */}
        <div className="nav-right pull-right right-header col-xxl-7 col-xl-6 col-md-7 col-8 p-0 ms-auto">
          <ul className="simple-list nav-menus flex-row">

            {/* Notifiche placeholder */}
            <li className="onhover-dropdown">
              <div className="notification-box">
                <Bell />
                <span className="badge rounded-pill badge-secondary">0</span>
              </div>
            </li>

            {/* Profilo utente */}
            <li className="profile-nav onhover-dropdown pe-0 py-0">
              <div className="media profile-media">
                <img
                  className="b-r-10 m-0"
                  src="/images/dashboard/profile.png"
                  alt={displayName}
                  style={{ width: 37, height: 37, objectFit: 'cover' }}
                />
                <div className="media-body">
                  <span>{displayName}</span>
                  <p className="mb-0 font-roboto">
                    {user?.user_facility_roles?.[0]?.role?.name ?? 'Utente'}{' '}
                    <i className="middle fa fa-angle-down" />
                  </p>
                </div>
              </div>
              <ul className="simple-list profile-dropdown onhover-show-div">
                <li>
                  <Link to="/profilo">
                    <User />
                    <span>Profilo</span>
                  </Link>
                </li>
                <li onClick={handleLogout} style={{ cursor: 'pointer' }}>
                  <LogIn />
                  <span>Esci</span>
                </li>
              </ul>
            </li>

          </ul>
        </div>

      </div>
    </div>
  )
}
