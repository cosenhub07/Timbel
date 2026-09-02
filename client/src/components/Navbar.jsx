import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Building2, Bell, MessageCircle, Zap } from 'lucide-react'
import cosenLogo from '../assets/cosen_brand_logo2.svg'
import { useNotifications } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { isUniversityEmail } from '../utils/authUtils'
import CampusLoginModal from './CampusLoginModal'

const baseNavLinks = []

const featureLinks = [
  { name: 'Find Rooms', path: '/finder' },
  { name: 'Class Timetables', path: '/classes' },
  { name: 'Teacher Status', path: '/teachers' },
  { name: 'Attendance 📊', path: '/attendance' },
  { name: 'SendiYou 💌', path: '/sendiyou' },
  { name: 'Messages 💬', path: '/messages' }
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { user } = useAuth()
  
  const isUniUser = user && isUniversityEmail(user.email)
  const navLinks = isUniUser ? [...baseNavLinks, ...featureLinks] : baseNavLinks

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-t-0 transition-transform duration-300 ease-in-out ${(isVisible || mobileOpen || showNotifications) ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {/* Logo & Brand */}
            <Link to={isUniUser ? "/sendiyou" : "/"} className="flex items-center gap-3 group">
              <img
                src={cosenLogo}
                alt="Cosen Logo"
                className="h-11 w-auto"
              />
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-heading text-text-primary tracking-tight">
                  Timetable Detector
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-primary/20 text-violet-primary border border-violet-primary/30">
                  by Cosen
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'text-violet-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-violet-primary rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>

            {!isUniUser && (
              <div className="hidden md:flex items-center gap-3 ml-2">
                <button 
                  onClick={() => window.dispatchEvent(new Event('trigger-pwa-install'))}
                  className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
                >
                  Download App
                </button>
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-violet-primary text-white text-sm font-semibold hover:bg-violet-hover transition-colors"
                >
                  Login
                </button>
              </div>
            )}

            {/* Messages Icon (Mobile) */}
            {isUniUser && (
              <Link 
                to="/messages"
                className="md:hidden p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                title="Messages"
              >
                <MessageCircle size={20} />
              </Link>
            )}

            {/* Notification Bell */}
            {isUniUser && (
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {/* Dropdown */}
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="fixed left-4 right-4 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 bg-slate-card border border-slate-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      style={{ background: '#0F172A', border: '1px solid rgba(139,92,246,0.25)' }}>
                      <div className="p-3 border-b border-slate-border/50 flex justify-between items-center bg-slate-darker/50">
                        <h3 className="font-bold text-sm text-text-primary">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-[11px] font-semibold text-violet-primary hover:text-violet-hover">
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-text-muted text-sm">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => {
                                markAsRead(notif.id);
                                setShowNotifications(false);
                                if (notif.link) navigate(notif.link);
                              }}
                              className={`p-3 border-b border-slate-border/30 hover:bg-white/5 cursor-pointer transition-colors ${!notif.is_read ? 'bg-violet-primary/5' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm ${!notif.is_read ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                                    {notif.content}
                                  </p>
                                  <p className="text-[10px] text-text-muted mt-1">
                                    {new Date(notif.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                  </p>
                                </div>
                                {!notif.is_read && (
                                  <div className="w-2 h-2 rounded-full bg-violet-primary shrink-0 mt-1.5" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            {!isUniUser && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && !isUniUser && (
        <div className="md:hidden border-t border-slate-border/50 bg-slate-deep/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            <div className="flex flex-col gap-2 pt-2 pb-1 border-t border-slate-border/30 mt-2">
              <button 
                onClick={() => {
                  setMobileOpen(false);
                  window.dispatchEvent(new Event('trigger-pwa-install'));
                }}
                className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                Download App
              </button>
              <button 
                onClick={() => {
                  setMobileOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium bg-violet-primary/10 text-violet-primary hover:bg-violet-primary/20 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
      <CampusLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </nav>
  )
}
