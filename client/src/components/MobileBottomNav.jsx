import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Calendar, Plus, Users, Heart, BarChart2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isUniversityEmail } from '../utils/authUtils'

export default function MobileBottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  
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

  const isUniUser = user && isUniversityEmail(user.email)

  if (!isUniUser || location.pathname.startsWith('/admin')) return null

  const isActive = (path) => location.pathname === path

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-slate-card/95 backdrop-blur-xl border-t border-slate-border/50 z-50 px-2 pb-safe transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
      style={{
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
      }}
    >
      <div className="flex justify-around items-center h-16 relative">
        
        {/* Find Rooms */}
        <Link to="/finder" className="flex flex-col items-center justify-center w-16 gap-1 group">
          <Search size={22} className={isActive('/finder') ? 'text-violet-primary' : 'text-text-muted group-hover:text-text-secondary transition-colors'} />
          <span className={`text-[10px] font-medium ${isActive('/finder') ? 'text-violet-primary' : 'text-text-muted'}`}>
            Class Status
          </span>
        </Link>

        {/* Timetables */}
        <Link to="/classes" className="flex flex-col items-center justify-center w-16 gap-1 group mr-4">
          <Calendar size={22} className={isActive('/classes') ? 'text-violet-primary' : 'text-text-muted group-hover:text-text-secondary transition-colors'} />
          <span className={`text-[10px] font-medium ${isActive('/classes') ? 'text-violet-primary' : 'text-text-muted'}`}>
            Classes
          </span>
        </Link>

        {/* FAB: Post */}
        <div className="absolute left-1/2 -top-6 -translate-x-1/2">
          <Link 
            to="/sendiyou" 
            state={{ openModal: true }}
            className="flex items-center justify-center w-14 h-14 bg-violet-primary rounded-full shadow-[0_4px_16px_rgba(99,91,255,0.4)] border-4 border-slate-card transition-transform active:scale-95"
          >
            <Plus size={28} className="text-white" strokeWidth={2.5} />
          </Link>
          <span className="block text-center text-[10px] font-medium text-text-muted mt-1">
            Post
          </span>
        </div>

        {/* Attendance Planner */}
        <Link to="/attendance" className="flex flex-col items-center justify-center w-16 gap-1 group ml-4">
          <BarChart2 size={22} className={isActive('/attendance') ? 'text-violet-primary' : 'text-text-muted group-hover:text-text-secondary transition-colors'} />
          <span className={`text-[10px] font-medium ${isActive('/attendance') ? 'text-violet-primary' : 'text-text-muted'}`}>
            Attendance
          </span>
        </Link>

        {/* SendiYou */}
        <Link to="/sendiyou" className="flex flex-col items-center justify-center w-16 gap-1 group">
          <Heart size={22} className={isActive('/sendiyou') && !location.state?.openModal ? 'text-violet-primary' : 'text-text-muted group-hover:text-text-secondary transition-colors'} />
          <span className={`text-[10px] font-medium ${isActive('/sendiyou') && !location.state?.openModal ? 'text-violet-primary' : 'text-text-muted'}`}>
            SendiYou
          </span>
        </Link>

      </div>
    </div>
  )
}
