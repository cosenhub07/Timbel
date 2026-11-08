import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen, User, Users, AlertTriangle } from 'lucide-react'
import IssueReportModal from './IssueReportModal'

export default function ScheduleAccordion({ schedule, queryTimeInMinutes, roomName, isToday = true }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSlotForIssue, setSelectedSlotForIssue] = useState(null)

  if (!schedule || schedule.length === 0) {
    return null
  }

  // Helper to convert time string to minutes
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0
    const [hours, minutes] = timeStr.split(':')
    return parseInt(hours, 10) * 60 + parseInt(minutes, 10)
  }

  return (
    <div className="mt-4 border-t border-slate-border/50 pt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <span className="font-medium">Full Day Schedule ({schedule.length} slots)</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {schedule.map((slot, index) => {
            const startMin = timeToMinutes(slot.start_time)
            const endMin = timeToMinutes(slot.end_time)
            
            // Highlight active/past slots only when viewing today
            const isActive = isToday && queryTimeInMinutes !== null && queryTimeInMinutes >= startMin && queryTimeInMinutes < endMin
            const isPast = isToday && queryTimeInMinutes !== null && queryTimeInMinutes >= endMin

            return (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  isActive 
                    ? 'bg-violet-primary/10 border-violet-primary/30' 
                    : isPast 
                      ? 'bg-slate-darker/50 border-slate-border/30 opacity-70' 
                      : 'bg-slate-darker border-slate-border/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isActive ? 'bg-violet-primary text-white' : 'bg-slate-border text-text-primary'
                  }`}>
                    {slot.start_time} - {slot.end_time}
                  </span>
                  {isActive && <span className="text-[10px] uppercase font-bold text-violet-primary tracking-wider animate-pulse">Now</span>}
                </div>
                
                <h4 className={`text-sm font-semibold mb-2 ${isActive ? 'text-violet-primary' : 'text-text-primary'}`}>
                  {slot.subject || 'Unknown Subject'}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="shrink-0" />
                    <span className="truncate" title={slot.teacher}>{slot.teacher || 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={12} className="shrink-0" />
                    {(slot.session_type || '').toLowerCase() === 'lab' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 leading-none">
                        🧪 Lab
                      </span>
                    ) : (
                      <span className="truncate">{slot.session_type || 'Lecture'}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <Users size={12} className="shrink-0" />
                    <span className="truncate">
                      {slot.program} {slot.year} {slot.class_code} {slot.section ? `(${slot.section})` : ''}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-border/50 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Merge roomName into slot data so the modal knows which room it is
                      setSelectedSlotForIssue({ ...slot, room_name: roomName || slot.room_name || slot.room });
                    }}
                    className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-text-muted hover:text-amber-soon transition-colors"
                  >
                    <AlertTriangle size={12} />
                    Raise Issue
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Issue Modal */}
      <IssueReportModal 
        isOpen={!!selectedSlotForIssue}
        onClose={() => setSelectedSlotForIssue(null)}
        slot={selectedSlotForIssue}
      />
    </div>
  )
}
