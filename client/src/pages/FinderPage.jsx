import { useState, useEffect } from 'react'
import { Search, MapPin, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LottieLib from 'lottie-react'
import loaderAnimation from '../assets/loder.json'

const Lottie = LottieLib.default || LottieLib;
import BuildingSelector from '../components/BuildingSelector'
import DaySelector from '../components/DaySelector'
import TimeSelector from '../components/TimeSelector'
import RoomCard from '../components/RoomCard'

export default function FinderPage() {
  const { selectedCampus } = useAuth()
  const [buildings, setBuildings] = useState([])
  const [buildingsLoading, setBuildingsLoading] = useState(true)
  const [selectedBuilding, setSelectedBuilding] = useState('')
  
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  
  const [roomsData, setRoomsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (selectedBuilding) {
      sessionStorage.setItem('finderBuilding', selectedBuilding)
    }
  }, [selectedBuilding])

  // Initialization: Fetch buildings and set current day/time
  useEffect(() => {
    fetchBuildings()
    syncCurrentTime()
  }, [selectedCampus])

  // Refetch rooms when inputs change
  useEffect(() => {
    if (selectedBuilding && selectedDay && selectedTime) {
      fetchRooms()
    }
  }, [selectedBuilding, selectedDay, selectedTime, selectedCampus])

  const fetchBuildings = async () => {
    setBuildingsLoading(true)
    try {
      const campusParam = selectedCampus?.id ? `?campus_id=${selectedCampus.id}` : '';
      const res = await fetch(`/api/timetable/buildings${campusParam}`)
      if (!res.ok) throw new Error('Failed to fetch buildings')
      const data = await res.json()
      setBuildings(data.buildings || [])
      
      // Restore from session or auto-select first building
      if (data.buildings && data.buildings.length > 0) {
        const savedBuilding = sessionStorage.getItem('finderBuilding')
        if (savedBuilding && data.buildings.includes(savedBuilding)) {
          setSelectedBuilding(savedBuilding)
        } else {
          setSelectedBuilding(data.buildings[0])
        }
      }
    } catch (err) {
      console.error(err)
      setError('Could not load campus buildings. Please try again later.')
    } finally {
      setBuildingsLoading(false)
    }
  }

  const syncCurrentTime = () => {
    const now = new Date()
    // Set Day (MON-SAT, fallback to MON if Sunday)
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    let currentDay = days[now.getDay()]
    setSelectedDay(currentDay)

    // Set Time (HH:MM)
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    setSelectedTime(`${hours}:${minutes}`)
  }

  const fetchRooms = async () => {
    setLoading(true)
    setError(null)
    try {
      let url = `/api/timetable/rooms?building=${selectedBuilding}&day=${selectedDay}&time=${selectedTime}`;
      if (selectedCampus?.id) url += `&campus_id=${selectedCampus.id}`;
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch room status')
      const data = await res.json()
      setRoomsData(data)
    } catch (err) {
      console.error(err)
      setError('Could not load room statuses. Make sure the backend is running.')
      setRoomsData(null)
    } finally {
      setLoading(false)
    }
  }

  // Convert "HH:MM" to minutes for the RoomCards
  const queryTimeInMinutes = () => {
    if (!selectedTime) return 0
    const [h, m] = selectedTime.split(':')
    return parseInt(h, 10) * 60 + parseInt(m, 10)
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-16">
      <div className="max-w-7xl mx-auto">
        
        {!buildingsLoading && buildings.length === 0 ? (
          <div className="max-w-md mx-auto glass-card p-8 shadow-2xl relative z-50 border border-amber-soon/30 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12">
            <div className="w-16 h-16 rounded-full bg-amber-soon/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h2 className="text-xl font-bold font-heading text-text-primary mb-2">Campus Not Active Yet</h2>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              We haven't received the room data for <strong className="text-text-primary">{selectedCampus?.name || 'your campus'}</strong> yet. Ask your college Admin or CR to upload the schedule!
            </p>
            <div className="inline-block bg-slate-800 text-xs font-semibold text-text-secondary px-4 py-2 rounded-full">
              While you wait, check out SendiYou!
            </div>
          </div>
        ) : (
          <>
            {/* Header & Controls Card */}
            <div className="glass-card p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                
                <div className="flex-1 space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold font-heading text-text-primary mb-2 flex items-center gap-3">
                      <MapPin className="text-violet-primary" />
                      Room Finder
                    </h1>
                    <p className="text-text-muted">Find an empty spot to study, hang out, or take a call.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <BuildingSelector 
                      buildings={buildings} 
                      selectedBuilding={selectedBuilding} 
                      onSelect={setSelectedBuilding} 
                    />
                    <TimeSelector 
                      selectedTime={selectedTime}
                      onSelect={setSelectedTime}
                      onSyncNow={syncCurrentTime}
                    />
                  </div>
                </div>

                <div className="md:border-l border-slate-border/50 md:pl-8">
                  <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Select Day</h3>
                  <DaySelector 
                    selectedDay={selectedDay}
                    onSelect={setSelectedDay}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-busy/50 flex items-start gap-3">
                <AlertCircle className="text-red-busy shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-busy">{error}</p>
              </div>
            )}

            {/* Content Area */}
            {!error && (
              <>
                {/* Summary Bar */}
                {roomsData && !loading && selectedDay !== 'SUN' && (
                  <div className="flex flex-wrap items-center gap-4 mb-8">
                    <h2 className="text-xl font-bold font-heading text-text-primary mr-auto">
                      Building {selectedBuilding} Rooms
                    </h2>
                    
                    <div className="flex items-center gap-4 text-sm font-medium bg-slate-darker border border-slate-border px-4 py-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-free" />
                        <span className="text-text-primary">{roomsData.summary.free} Free</span>
                      </div>
                      <div className="w-px h-4 bg-slate-border" />
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-soon" />
                        <span className="text-text-primary">{roomsData.summary.busySoon} Busy Soon</span>
                      </div>
                      <div className="w-px h-4 bg-slate-border" />
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-busy" />
                        <span className="text-text-primary">{roomsData.summary.inUse} In Use</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Lottie animationData={loaderAnimation} className="w-16 h-16 mb-4" />
                    <p className="text-text-muted">Scanning timetable...</p>
                  </div>
                )}

                {/* Results Grid */}
                {!loading && !error && roomsData && (
                  selectedDay === 'SUN' ? (
                    <div className="text-center py-20 glass-card animate-in fade-in slide-in-from-bottom-4 duration-500 border border-violet-primary/20 bg-violet-primary/5">
                      <div className="text-6xl mx-auto mb-4">🏖️</div>
                      <h3 className="text-2xl font-bold font-heading text-text-primary mb-2">Today is a Holiday!</h3>
                      <p className="text-text-muted text-lg mb-6">Take a break, relax, and enjoy your Sunday. No classes today.</p>
                      
                      <div className="bg-slate-darker/80 border border-violet-primary/30 p-6 rounded-2xl max-w-sm mx-auto shadow-lg">
                        <h4 className="text-text-primary font-semibold mb-2">Got some free time?</h4>
                        <p className="text-sm text-text-muted mb-4">Check out <span className="font-bold text-violet-primary">SendiYou</span> to connect with campus folks anonymously!</p>
                        <a href="/sendiyou" className="inline-block px-6 py-2.5 bg-violet-primary hover:bg-violet-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-violet-primary/20 hover:-translate-y-0.5">
                          Explore SendiYou ✨
                        </a>
                      </div>
                    </div>
                  ) : roomsData.rooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {roomsData.rooms.map((room) => (
                        <RoomCard 
                          key={room.name} 
                          room={room} 
                          queryTimeInMinutes={queryTimeInMinutes()} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <Search className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold text-text-primary mb-2">No Rooms Found</h3>
                      <p className="text-text-muted">There are no schedule entries for Building {selectedBuilding} on {selectedDay}.</p>
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
