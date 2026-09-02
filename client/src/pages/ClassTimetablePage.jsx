import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, User, MapPin, Search, GraduationCap, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import QuantumBackground from '../components/QuantumBackground'
import LottieLib from 'lottie-react'
import loaderAnimation from '../assets/loder.json'

const Lottie = LottieLib.default || LottieLib;

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export default function ClassTimetablePage() {
  const { selectedCampus } = useAuth()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [scheduleData, setScheduleData] = useState(null)
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [error, setError] = useState('')

  const [selectedDay, setSelectedDay] = useState('ALL')
  const [showVideo, setShowVideo] = useState(true)

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    let timer;
    if (!showVideo) {
      timer = setTimeout(() => {
        setShowVideo(true)
      }, 4000)
    }
    return () => clearTimeout(timer)
  }, [showVideo])

  useEffect(() => {
    const campusParam = selectedCampus?.id ? `?campus_id=${selectedCampus.id}` : '';
    fetch(`/api/timetable/classes${campusParam}`)
      .then(res => res.json())
      .then(data => {
        if (data.classes) setClasses(data.classes)
        setLoadingClasses(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load classes')
        setLoadingClasses(false)
      })
  }, [selectedCampus])

  useEffect(() => {
    if (!selectedClass) {
      setScheduleData(null)
      return
    }

    setLoadingSchedule(true)
    let url = `/api/timetable/classes/${encodeURIComponent(selectedClass)}`;
    if (selectedCampus?.id) url += `?campus_id=${selectedCampus.id}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.schedule) {
          // Group by day
          const grouped = {}
          DAYS_OF_WEEK.forEach(day => grouped[day] = [])
          
          data.schedule.forEach(slot => {
            const dayKey = slot.day.toUpperCase().substring(0, 3) // Ensure MON, TUE etc.
            if (grouped[dayKey]) {
              grouped[dayKey].push(slot)
            }
          })
          setScheduleData(grouped)
        }
        setLoadingSchedule(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load schedule')
        setLoadingSchedule(false)
      })
  }, [selectedClass, selectedCampus])

  return (
    <div className="min-h-screen pb-20 relative overflow-x-hidden bg-transparent">
      <QuantumBackground />
      {/* Dark overlay to ensure text readability over bright bloom */}
      <div className="fixed inset-0 bg-slate-darker/50 z-0 pointer-events-none" />
      
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-primary/20 rounded-full blur-[120px] pointer-events-none z-0" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 relative z-10 flex flex-col items-center">
        <div className="text-center mb-12 glass-card rounded-3xl border-violet-primary/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] max-w-2xl w-full relative overflow-hidden transition-all duration-500 aspect-video flex items-center justify-center">
          {/* Video Layer */}
          <div className={`absolute inset-0 transition-opacity duration-700 bg-slate-darker ${showVideo ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            {showVideo && (
              <video 
                autoPlay 
                muted 
                playsInline
                onEnded={() => setShowVideo(false)}
                className="w-full h-full object-cover opacity-80"
              >
                <source src="https://res.cloudinary.com/dga14nmzn/video/upload/v1782496099/SaaS_Launch_Video_Browser_Window_Showcase_qporwb.mp4" type="video/mp4" />
              </video>
            )}
          </div>

          {/* Text Layer */}
          <div className={`px-6 py-6 md:px-10 md:py-8 relative w-full h-full flex flex-col justify-center items-center transition-opacity duration-700 ${!showVideo ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none absolute inset-0'}`}>
            <p className="text-violet-primary text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-2 md:mb-4 drop-shadow-md">
              Weekly Schedule
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-text-primary mb-3 md:mb-6 drop-shadow-lg">
              Class <span className="gradient-text">Timetables</span>
            </h1>
            <p className="text-text-muted text-sm md:text-lg leading-relaxed drop-shadow max-w-lg">
              Select your class code below to instantly view your entire weekly schedule, including subjects, rooms, and teachers.
            </p>
          </div>
        </div>

        {/* Link to Teacher Status Section */}
        <div className="w-full max-w-md flex justify-center -mt-6 mb-8 relative z-20">
          <Link
            to="/teachers"
            className="group flex items-center justify-between gap-4 px-5 py-3 rounded-2xl glass-card border border-violet-primary/30 bg-gradient-to-r from-violet-primary/10 via-slate-card/80 to-transparent hover:border-violet-primary/60 hover:bg-violet-primary/15 transition-all duration-300 shadow-[0_4px_20px_rgba(99,91,255,0.15)] hover:shadow-[0_4px_25px_rgba(99,91,255,0.25)] hover:scale-[1.02] w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-primary/20 border border-violet-primary/30 flex items-center justify-center text-violet-primary group-hover:scale-110 transition-transform">
                <GraduationCap size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-text-primary group-hover:text-violet-primary transition-colors flex items-center gap-1.5">
                  Looking for a Teacher?
                </p>
                <p className="text-xs text-text-muted">
                  Check live teacher availability & lecture schedule
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-violet-primary bg-violet-primary/10 px-3 py-1.5 rounded-xl border border-violet-primary/20 group-hover:bg-violet-primary group-hover:text-white transition-all flex-shrink-0">
              <span>View</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Dropdown Section */}
        {!loadingClasses && classes.length === 0 ? (
          <div className="max-w-md mx-auto glass-card p-8 mb-12 shadow-2xl relative z-50 border border-amber-soon/30 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-full bg-amber-soon/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h2 className="text-xl font-bold font-heading text-text-primary mb-2">Campus Not Active Yet</h2>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              We haven't received the timetable data for <strong className="text-text-primary">{selectedCampus?.name || 'your campus'}</strong> yet. Ask your college Admin or CR to upload the schedule!
            </p>
            <div className="inline-block bg-slate-800 text-xs font-semibold text-text-secondary px-4 py-2 rounded-full">
              While you wait, check out SendiYou!
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto glass-card p-6 mb-12 shadow-2xl relative z-50 border border-violet-primary/20">
            <label className="block text-sm font-semibold text-text-secondary mb-3">
              Select Your Class
            </label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <input
                type="text"
                placeholder={isDropdownOpen && selectedClass ? selectedClass : "Search or select a class..."}
                value={isDropdownOpen ? searchQuery : selectedClass || ''}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (!isDropdownOpen) setIsDropdownOpen(true)
                }}
                onClick={() => setIsDropdownOpen(true)}
                disabled={loadingClasses}
                className="w-full bg-slate-deep border border-slate-border text-text-primary rounded-xl pl-11 pr-12 py-4 focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary transition-all duration-200 cursor-text"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                <Search size={18} />
              </div>
              <div 
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text-primary transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-deep border border-slate-border rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar z-50">
                {classes
                  .filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(c => (
                    <div
                      key={c}
                      onClick={() => {
                        setSelectedClass(c)
                        setSearchQuery('')
                        setIsDropdownOpen(false)
                      }}
                      className={`px-4 py-3 hover:bg-violet-primary/20 cursor-pointer text-text-primary transition-colors border-b border-slate-border/50 last:border-0 ${selectedClass === c ? 'bg-violet-primary/10 text-violet-primary font-semibold' : ''}`}
                    >
                      {c}
                    </div>
                  ))}
                {classes.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="px-4 py-4 text-text-muted text-center text-sm">
                    No classes found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
          {error && <p className="text-red-busy mt-3 text-sm">{error}</p>}
        </div>
        )}

        {/* Loading State */}
        {loadingSchedule && (
          <div className="flex flex-col items-center justify-center py-20">
            <Lottie animationData={loaderAnimation} className="w-20 h-20 mb-4" />
            <p className="text-text-muted animate-pulse">Loading schedule...</p>
          </div>
        )}

        {/* Schedule Display */}
        {!loadingSchedule && scheduleData && (
          <div className="animation-fade-up">
            
            {/* Day Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              <button
                onClick={() => setSelectedDay('ALL')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  selectedDay === 'ALL' 
                    ? 'bg-violet-primary text-white shadow-[0_0_15px_rgba(99,91,255,0.4)]' 
                    : 'bg-slate-800 text-text-muted hover:bg-slate-700 hover:text-text-primary'
                }`}
              >
                All Week
              </button>
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    selectedDay === day 
                      ? 'bg-emerald-free text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                      : 'bg-slate-800 text-text-muted hover:bg-slate-700 hover:text-text-primary'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="space-y-12">
              {DAYS_OF_WEEK.filter(d => selectedDay === 'ALL' || d === selectedDay).map(day => {
                const slots = scheduleData[day]
                if (!slots || slots.length === 0) return null

              return (
                <div key={day} className="relative">
                  <div className="sticky top-20 z-30 bg-slate-darker/90 backdrop-blur-md py-4 mb-6 border-b border-slate-border/50">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                      <Calendar className="text-emerald-free" size={24} />
                      {day === 'MON' ? 'Monday' : 
                       day === 'TUE' ? 'Tuesday' : 
                       day === 'WED' ? 'Wednesday' : 
                       day === 'THU' ? 'Thursday' : 
                       day === 'FRI' ? 'Friday' : 'Saturday'}
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {slots.map((slot, idx) => (
                      <div key={idx} className="glass-card p-5 hover-lift border border-slate-border/50 hover:border-violet-primary/30 group">
                        <div className="flex justify-between items-start mb-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-primary/10 text-violet-primary text-xs font-bold font-heading">
                            <Clock size={12} /> {slot.start_time} - {slot.end_time}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                            {slot.session_type}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-text-primary mb-3 leading-tight group-hover:text-emerald-free transition-colors">
                          {slot.subject}
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-text-muted">
                            <MapPin size={14} className="text-violet-primary/70" />
                            <span className="font-medium">{slot.room}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-muted">
                            <User size={14} className="text-emerald-free/70" />
                            <span>{slot.teacher}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        )}

        {/* Empty State when a class is selected but has no slots at all (rare) */}
        {!loadingSchedule && scheduleData && Object.values(scheduleData).every(arr => arr.length === 0) && (
          <div className="text-center py-20 glass-card">
            <p className="text-xl text-text-muted">No schedule found for this class.</p>
          </div>
        )}

      </div>
    </div>
  )
}
