import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Grid, ChevronDown, ChevronUp } from 'react-feather'
import { useAuth } from '../../contexts/AuthContext'
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext'
import { MENUITEMS } from './menuItems'
import type { MenuItem, MenuSection } from './menuItems'
import SvgIcon from '../../components/common/SvgIcon'

interface SidebarProps {
  toggleIcon: boolean
  onToggle: () => void
}

export default function Sidebar({ toggleIcon, onToggle }: SidebarProps) {
  const location = useLocation()
  const { hasRole, hasPermission } = useAuth()
  const { totalUnread } = useUnreadMessages()
  const [menu, setMenu] = useState<MenuSection[]>(
    MENUITEMS.map(s => ({ ...s, Items: s.Items.map(i => ({ ...i, active: false })) }))
  )
  // sections collapsed by index (default: all expanded)
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set())

  const toggleSection = (si: number) =>
    setCollapsedSections(prev => {
      const next = new Set(prev)
      next.has(si) ? next.delete(si) : next.add(si)
      return next
    })

  useEffect(() => {
    setMenu(prev =>
      prev.map(section => ({
        ...section,
        Items: section.Items.map(item => ({
          ...item,
          active: item.children?.some(c => c.path === location.pathname) ?? false,
        })),
      }))
    )
  }, [location.pathname])

  const canSee = (item: MenuItem) =>
    (!item.roles || item.roles.some(r => hasRole([r]))) &&
    (!item.permission || hasPermission(item.permission))

  const toggleSub = (si: number, ii: number) => {
    setMenu(prev =>
      prev.map((section, s) => ({
        ...section,
        Items: section.Items.map((item, i) =>
          s === si && i === ii ? { ...item, active: !item.active } : item
        ),
      }))
    )
  }

  const isActive = (path?: string) => path === location.pathname

  return (
    <>
      <div className="bg-overlay1" />
      <div className={`sidebar-wrapper${toggleIcon ? ' close_icon' : ''}`} sidebar-layout="stroke-svg">

        {/* Icona collassata */}
        <div className="logo-icon-wrapper">
          <Link to="/dashboard">
            <img className="img-fluid" src="/images/logo/logo-icon.png" alt="FamilyHub" />
          </Link>
        </div>

        {/* Logo esteso + pulsante toggle */}
        <div className="logo-wrapper">
          <Link to="/dashboard">
            <img className="img-fluid for-light" src="/images/logo/logo.png" alt="FamilyHub" />
            <img className="img-fluid for-dark" src="/images/logo/logo_dark.png" alt="FamilyHub" />
          </Link>
          <div className="back-btn" onClick={onToggle}>
            <i className="fa fa-angle-left" />
          </div>
          <div className="toggle-sidebar" onClick={onToggle}>
            <Grid className="status_toggle middle sidebar-toggle" />
          </div>
        </div>

        {/* Navigazione */}
        <nav className="sidebar-main" id="sidebar-main">
          <div className="left-arrow d-none" />
          <div id="sidebar-menu">
            <ul className="sidebar-links custom-scrollbar">
              <li className="back-btn">
                <div className="mobile-back text-end">
                  <span>Indietro</span>
                  <i className="fa fa-angle-right ps-2" />
                </div>
              </li>

              {menu.map((section, si) =>
                section.Items.some(canSee) ? (
                  <React.Fragment key={si}>
                    <li
                      className="sidebar-main-title"
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => toggleSection(si)}
                    >
                      <div className="d-flex align-items-center justify-content-between pe-2">
                        <h6 className="lan-1 mb-0">{section.menutitle}</h6>
                        {collapsedSections.has(si)
                          ? <ChevronDown size={12} style={{ opacity: 0.5 }} />
                          : <ChevronUp size={12} style={{ opacity: 0.5 }} />}
                      </div>
                    </li>

                    {!collapsedSections.has(si) && section.Items.map((item, ii) => {
                      if (!canSee(item)) return null

                      if (item.type === 'link') {
                        const isMessaggi = item.path === '/messaggi'
                        return (
                          <li className="sidebar-list" key={ii}>
                            <Link
                              to={item.path!}
                              className={`sidebar-link sidebar-title link-nav${isActive(item.path) ? ' active' : ''}`}
                            >
                              <SvgIcon className="stroke-icon" iconId={`stroke-${item.icon}`} />
                              <SvgIcon className="fill-icon" iconId={`fill-${item.icon}`} />
                              <span>{item.title}</span>
                              {isMessaggi && totalUnread > 0 && (
                                <span
                                  className='badge rounded-pill bg-danger ms-auto'
                                  style={{ fontSize: 10, minWidth: 18, lineHeight: '18px', padding: '0 5px' }}
                                >
                                  {totalUnread > 99 ? '99+' : totalUnread}
                                </span>
                              )}
                            </Link>
                          </li>
                        )
                      }

                      const subOpen = item.active || item.children?.some(c => isActive(c.path))
                      return (
                        <li className="sidebar-list" key={ii}>
                          <a
                            href="#!"
                            className={`sidebar-link sidebar-title${subOpen ? ' active' : ''}`}
                            onClick={e => { e.preventDefault(); toggleSub(si, ii) }}
                          >
                            <SvgIcon className="stroke-icon" iconId={`stroke-${item.icon}`} />
                            <SvgIcon className="fill-icon" iconId={`fill-${item.icon}`} />
                            <span>{item.title}</span>
                            <div className="according-menu">
                              <i className={`fa fa-angle-${subOpen ? 'down' : 'right'}`} />
                            </div>
                          </a>
                          {item.children && (
                            <ul
                              className="sidebar-submenu"
                              style={{ display: subOpen ? 'block' : 'none' }}
                            >
                              {item.children.filter(canSee).map((child, ci) => (
                                <li key={ci}>
                                  <Link
                                    to={child.path!}
                                    className={isActive(child.path) ? 'active' : ''}
                                  >
                                    {child.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      )
                          })}
                  </React.Fragment>
                ) : null
              )}
            </ul>
          </div>
        </nav>
      </div>
    </>
  )
}
