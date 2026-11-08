import { useState, useEffect } from 'react'
import { Users, Search, Clock, MapPin, BookOpen, AlertCircle, Calendar, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LottieLib from 'lottie-react'
import loaderAnimation from '../assets/loder.json'

const Lottie = LottieLib.default || LottieLib;
import DaySelector from '../components/DaySelector'
import TimeSelector from '../components/TimeSelector'
import ParticleBackground from '../components/ParticleBackground'

export default function TeacherStatusPage() {
  const { selectedCampus } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [teachersLoading, setTeachersLoading] = useState(true)
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  
  const [teacherData, setTeacherData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [showVideo, setShowVideo] = useState(true)

  useEffect(() => {
    let timer;
    if (!showVideo) {
      timer = setTimeout(() => {
        setShowVideo(true)
      }, 4000)
    }
    return () => clearTimeout(timer)
  }, [showVideo])

  // Fetch teacher list on mount
  useEffect(() => {
    fetchTeachers()
    syncCurrentTime()
  }, [selectedCampus])

  // Fetch status when selection changes
  useEffect(() => {
    if (selectedTeacher && selectedDay && selectedTime) {
      fetchTeacherStatus()
    }
  }, [selectedTeacher, selectedDay, selectedTime, selectedCampus])

  const fetchTeachers = async () => {
    setTeachersLoading(true)
    try {
      const campusParam = selectedCampus?.id ? `?campus_id=${selectedCampus.id}` : '';
      const res = await fetch(`/api/timetable/teachers${campusParam}`)
      if (!res.ok) throw new Error('Failed to fetch teachers')
      const data = await res.json()
      setTeachers(data.teachers || [])
    } catch (err) {
      console.error(err)
      setError('Could not load teachers list. Please check backend connection.')
    } finally {
      setTeachersLoading(false)
    }
  }

  const syncCurrentTime = () => {
    const now = new Date()
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    let currentDay = days[now.getDay()]
    if (currentDay === 'SUN') {
      currentDay = 'MON'
    }
    setSelectedDay(currentDay)

    const hoursNum = now.getHours()
    if (hoursNum < 8 || hoursNum >= 17) {
      setSelectedTime('10:00')
    } else {
      const hours = String(hoursNum).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setSelectedTime(`${hours}:${minutes}`)
    }
  }

  const fetchTeacherStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      let url = `/api/timetable/teachers/${encodeURIComponent(selectedTeacher)}/status?day=${selectedDay}&time=${selectedTime}`;
      if (selectedCampus?.id) url += `&campus_id=${selectedCampus.id}`;
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch teacher status')
      const data = await res.json()
      setTeacherData(data)
    } catch (err) {
      console.error(err)
      setError('Could not load status for this teacher.')
      setTeacherData(null)
    } finally {
      setLoading(false)
    }
  }

  const filteredTeachers = teachers.filter(t => 
    t.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher)
    setSearchTerm(teacher)
    setIsDropdownOpen(false)
  }

  const DAY_FULL_NAMES = {
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THU: 'Thursday',
    FRI: 'Friday',
    SAT: 'Saturday',
    SUN: 'Sunday'
  }

  const todayDay = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()]
  const isToday = selectedDay === todayDay
  const dayFullName = DAY_FULL_NAMES[selectedDay] || selectedDay

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-darker pb-20">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 opacity-40">
        <ParticleBackground />
      </div>

      <div className="relative z-10 pt-24 px-4 max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12 glass-card rounded-3xl border border-violet-primary/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full relative overflow-hidden transition-all duration-500 aspect-video flex items-center justify-center">
          
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
                <source src="https://res.cloudinary.com/dga14nmzn/video/upload/v1782495939/3D_Mobile_App_Character_Showcase_z2zt4f.mp4" type="video/mp4" />
              </video>
            )}
          </div>

          {/* Text Layer */}
          <div className={`px-6 py-6 md:px-8 md:py-8 relative w-full h-full flex flex-col justify-center items-center transition-opacity duration-700 ${!showVideo ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none absolute inset-0'}`}>
            <p className="text-violet-primary text-xs md:text-sm font-bold tracking-[0.2em] uppercase mb-2 md:mb-4 drop-shadow-md">
              Faculty Directory
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-text-primary mb-3 md:mb-6 drop-shadow-lg">
              Teacher <span className="gradient-text">Status</span>
            </h1>
            <p className="text-text-muted max-w-xl mx-auto text-sm md:text-lg leading-relaxed drop-shadow">
              Search for any faculty member to see their real-time availability, current location, and full daily schedule.
            </p>
          </div>
        </div>
        {!teachersLoading && teachers.length === 0 ? (
          <div className="max-w-md mx-auto glass-card p-8 shadow-2xl relative z-50 border border-amber-soon/30 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12 mb-20">
            <div className="w-16 h-16 rounded-full bg-amber-soon/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h2 className="text-xl font-bold font-heading text-text-primary mb-2">Campus Not Active Yet</h2>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              We haven't received the teacher data for <strong className="text-text-primary">{selectedCampus?.name || 'your campus'}</strong> yet. Ask your college Admin or CR to upload the schedule!
            </p>
            <div className="inline-block bg-slate-800 text-xs font-semibold text-text-secondary px-4 py-2 rounded-full">
              While you wait, check out SendiYou!
            </div>
          </div>
        ) : (
          <>
            {/* Controls Card */}
            <div className="glass-card p-6 md:p-8 mb-8 relative z-30">
              <div className="flex flex-col md:flex-row gap-8">
            
            {/* Search Input */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-text-secondary mb-3">
                Search Teacher
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  type="text"
                  className="w-full bg-slate-deep border border-slate-border text-text-primary rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary transition-all duration-200"
                  placeholder="Type a name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  // Delay blur to allow clicking the dropdown
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                />
                
                {/* Autocomplete Dropdown */}
                {isDropdownOpen && filteredTeachers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-deep border border-slate-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                    {filteredTeachers.map((teacher, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-3 hover:bg-slate-card cursor-pointer text-text-primary border-b border-slate-border/50 last:border-0 transition-colors"
                        onClick={() => handleSelectTeacher(teacher)}
                      >
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-violet-primary" />
                          <span>{teacher}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {isDropdownOpen && searchTerm && filteredTeachers.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-deep border border-slate-border rounded-xl shadow-2xl p-4 text-center z-50 text-text-muted">
                    No teachers found matching "{searchTerm}"
                  </div>
                )}
              </div>
            </div>

            {/* Time Controls */}
            <div className="md:w-auto flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h3 className="block text-sm font-semibold text-text-secondary mb-3">Day</h3>
                <DaySelector selectedDay={selectedDay} onSelect={setSelectedDay} />
              </div>
              <div className="flex-1">
                <h3 className="block text-sm font-semibold text-text-secondary mb-3">Time</h3>
                <TimeSelector selectedTime={selectedTime} onSelect={setSelectedTime} onSyncNow={syncCurrentTime} />
              </div>
            </div>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 mb-8 bg-red-busy/10 border border-red-busy/20 rounded-xl flex items-start gap-3 glass-card">
            <AlertCircle className="text-red-busy shrink-0 mt-0.5" />
            <p className="text-red-busy/90">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 glass-card">
            <Lottie animationData={loaderAnimation} className="w-20 h-20 mb-4" />
            <p className="text-text-muted font-medium">Tracking location...</p>
          </div>
        )}

        {/* Status Result Area */}
        {!loading && teacherData && selectedTeacher && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Big Status Banner (Hide on Sunday) */}
            {selectedDay !== 'SUN' && (
              !isToday ? (
                /* Non-current Day: Show clean schedule banner without live claims */
                <div className="p-6 md:p-8 rounded-2xl border backdrop-blur-md bg-violet-primary/10 border-violet-primary/30">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center bg-violet-primary/20 border border-violet-primary/40 text-violet-primary">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-violet-primary">
                          {dayFullName} Timetable
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold font-heading text-text-primary mb-1">
                        {teacherData.teacher}
                      </h2>
                      <p className="text-text-muted text-sm">
                        {teacherData.todaySchedule?.length > 0 
                          ? `${teacherData.todaySchedule.length} ${teacherData.todaySchedule.length === 1 ? 'lecture' : 'lectures'} scheduled on ${dayFullName}`
                          : `No lectures scheduled on ${dayFullName}`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : teacherData.status === 'concluded' ? (
                /* Today after 6:00 PM: College hours concluded */
                <div className="p-8 rounded-2xl border backdrop-blur-md bg-indigo-500/10 border-indigo-500/30">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 shrink-0 rounded-full flex items-center justify-center border-4 bg-indigo-500/20 border-indigo-500 text-indigo-300">
                      <Moon className="w-8 h-8" />
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <h2 className="text-2xl md:text-3xl font-bold font-heading text-text-primary mb-2">
                        {teacherData.teacher}
                      </h2>
                      <div className="text-indigo-300 font-medium text-lg">
                        College Hours Concluded. Lectures ended at 6:00 PM.
                      </div>
                      <p className="text-xs text-text-muted mt-1">
                        Check tomorrow's schedule below or explore SendiYou!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Today during college hours: Live Status */
                <div className={`p-8 rounded-2xl border backdrop-blur-md relative overflow-hidden transition-all ${
                  teacherData.status === 'free' ? 'bg-emerald-free/10 border-emerald-free/30' :
                  teacherData.status === 'in-lecture' ? 'bg-red-busy/10 border-red-busy/30' :
                  'bg-amber-soon/10 border-amber-soon/30'
                }`}>
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className={`w-20 h-20 shrink-0 rounded-full flex items-center justify-center border-4 ${
                      teacherData.status === 'free' ? 'bg-emerald-free/20 border-emerald-free text-emerald-free' :
                      teacherData.status === 'in-lecture' ? 'bg-red-busy/20 border-red-busy text-red-busy' :
                      'bg-amber-soon/20 border-amber-soon text-amber-soon'
                    }`}>
                      {teacherData.status === 'free' && <Users className="w-8 h-8" />}
                      {teacherData.status === 'in-lecture' && <BookOpen className="w-8 h-8" />}
                      {teacherData.status === 'busy-soon' && <Clock className="w-8 h-8" />}
                    </div>

                    <div className="text-center md:text-left flex-1">
                      <h2 className="text-2xl md:text-3xl font-bold font-heading text-text-primary mb-2">
                        {teacherData.teacher}
                      </h2>
                      
                      {teacherData.status === 'free' && (
                        <div className="text-emerald-free font-medium text-lg">
                          Currently Free. No ongoing classes right now.
                        </div>
                      )}

                      {teacherData.status === 'busy-soon' && (
                        <div className="text-amber-soon font-medium text-lg">
                          Free right now, but heading to a lecture soon.
                        </div>
                      )}

                      {teacherData.status === 'in-lecture' && teacherData.currentClass && (
                        <div>
                          <div className="text-red-busy font-bold text-xl mb-3 flex items-center justify-center md:justify-start gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-busy animate-pulse-soft" />
                            Currently In Lecture
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-text-primary bg-slate-darker/50 p-4 rounded-xl border border-slate-border/50">
                            <div>
                              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Subject</p>
                              <p className="font-semibold">{teacherData.currentClass.subject}</p>
                            </div>
                            <div>
                              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Class</p>
                              <p className="font-semibold">{teacherData.currentClass.class_code} {teacherData.currentClass.section}</p>
                            </div>
                            <div>
                              <p className="text-xs text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                                <MapPin size={14} /> Room
                              </p>
                              <p className="font-semibold text-violet-primary">Bldg {teacherData.currentClass.building}, {teacherData.currentClass.room}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
            {/* Today's Schedule Timeline / Holiday State */}
            {selectedDay === 'SUN' ? (
              <div className="text-center py-16 bg-violet-primary/5 rounded-2xl border border-violet-primary/20 glass-card">
                <div className="text-6xl mx-auto mb-4">🏖️</div>
                <h3 className="text-2xl font-bold font-heading text-text-primary mb-2">Today is a Holiday!</h3>
                <p className="text-text-muted text-lg mb-8">Take a break, relax, and enjoy your Sunday. Teachers have no classes today.</p>
                
                <div className="bg-slate-darker/80 border border-violet-primary/30 p-6 rounded-2xl max-w-sm mx-auto shadow-lg">
                  <h4 className="text-text-primary font-semibold mb-2">Got some free time?</h4>
                  <p className="text-sm text-text-muted mb-4">Check out <span className="font-bold text-violet-primary">SendiYou</span> to connect with campus folks anonymously!</p>
                  <a href="/sendiyou" className="inline-block px-6 py-2.5 bg-violet-primary hover:bg-violet-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-violet-primary/20 hover:-translate-y-0.5">
                    Explore SendiYou ✨
                  </a>
                </div>
              </div>
            ) : (
              <div className="glass-card p-6 md:p-8">
                <h3 className="text-xl font-bold font-heading text-text-primary mb-6 flex items-center gap-2">
                  <Clock className="text-violet-primary w-5 h-5" />
                  Schedule for {teacherData.day}
                </h3>

                {teacherData.todaySchedule && teacherData.todaySchedule.length > 0 ? (
                  <div className="space-y-4">
                    {teacherData.todaySchedule.map((slot, idx) => {
                      const isCurrent = isToday && teacherData.currentClass && 
                        teacherData.currentClass.start_time === slot.start_time &&
                        teacherData.currentClass.room === slot.room;
                      
                      return (
                        <div 
                          key={idx} 
                          className={`p-4 rounded-xl border transition-all ${
                            isCurrent 
                              ? 'bg-violet-primary/10 border-violet-primary shadow-[0_0_20px_rgba(99,91,255,0.15)] relative overflow-hidden' 
                              : 'bg-slate-card/50 border-slate-border/50 hover:bg-slate-card'
                          }`}
                        >
                          {isCurrent && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-violet-primary" />
                          )}
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-4">
                              <div className="bg-slate-darker px-3 py-1.5 rounded-lg border border-slate-border text-sm font-semibold text-violet-primary shrink-0">
                                {slot.start_time} - {slot.end_time}
                              </div>
                              <div>
                                <h4 className="font-bold text-text-primary">{slot.subject}</h4>
                                <p className="text-sm text-text-muted mt-1">
                                  {slot.class_code} {slot.section} • {slot.session_type}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm font-medium bg-slate-darker px-3 py-1.5 rounded-lg border border-slate-border shrink-0 self-start sm:self-auto">
                              <MapPin size={16} className="text-text-secondary" />
                              <span className="text-text-primary">{slot.room}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-darker/50 rounded-xl border border-slate-border/50">
                    <BookOpen className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" />
                    <p className="text-text-muted font-medium">No classes scheduled for {teacherData.day}.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
        </>
      )}
      </div>
    </div>
  )
}
