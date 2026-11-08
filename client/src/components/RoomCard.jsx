import { Clock, User, BookOpen, Calendar, Moon } from 'lucide-react'
import StatusBadge from './StatusBadge'
import ScheduleAccordion from './ScheduleAccordion'

const DAY_NAMES = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday'
}

export default function RoomCard({ room, queryTimeInMinutes, isToday = true, selectedDay = '' }) {
  const { name, status, currentClass, nextClass, fullSchedule = [], isLab } = room
  const dayLabel = DAY_NAMES[selectedDay] || selectedDay || 'Day'
  const scheduleCount = fullSchedule.length
  const firstClass = scheduleCount > 0 ? fullSchedule[0] : null
  const lastClass = scheduleCount > 0 ? fullSchedule[scheduleCount - 1] : null
  const previewClasses = fullSchedule.slice(0, 2)

  return (
    <div className="glass-card p-5 hover-lift relative overflow-hidden group">
      {/* Decorative gradient blob for 'Free' status on active days */}
      {isToday && status === 'free' && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-free/5 rounded-full blur-2xl group-hover:bg-emerald-free/10 transition-colors duration-500 pointer-events-none" />
      )}
      {isToday && status === 'in-use' && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-busy/5 rounded-full blur-2xl transition-colors duration-500 pointer-events-none" />
      )}

      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <h3 className="text-2xl font-bold font-heading text-text-primary tracking-tight">
            {name}
          </h3>
          {isLab && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 leading-none">
              🧪 Lab
            </span>
          )}
        </div>

        {/* Status Badge: Live status on Today, Lecture count on other days */}
        {isToday ? (
          <StatusBadge status={status} />
        ) : (
          scheduleCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-primary/10 text-violet-300 border border-violet-primary/30">
              <Calendar size={12} className="text-violet-primary" />
              {scheduleCount} {scheduleCount === 1 ? 'Lecture' : 'Lectures'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-text-muted border border-slate-border/80">
              No Classes
            </span>
          )
        )}
      </div>

      <div className="space-y-4">
        {/* ══ CASE A: TODAY (Live Status) ══ */}
        {isToday && (
          <>
            {/* After college hours */}
            {status === 'concluded' && (
              <div className="bg-slate-darker/60 rounded-xl p-4 border border-slate-border/50 text-center flex flex-col items-center justify-center min-h-[92px]">
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Moon size={13} /> Classes Concluded
                </p>
                <p className="text-xs text-text-muted">
                  College hours ended at 6:00 PM. Check tomorrow's schedule below!
                </p>
              </div>
            )}

            {/* In Use: Current Class */}
            {status === 'in-use' && currentClass && (
              <div className="bg-slate-darker/80 rounded-lg p-3 border border-slate-border/50">
                <p className="text-xs text-red-busy font-bold uppercase tracking-wider mb-2">Current Class</p>
                <h4 className="text-sm font-semibold text-text-primary mb-2 line-clamp-1" title={currentClass.subject}>
                  {currentClass.subject}
                </h4>
                <div className="flex flex-col gap-1.5 text-xs text-text-muted">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-violet-primary" />
                    <span>{currentClass.start_time} - {currentClass.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-violet-primary" />
                    <span className="truncate">{currentClass.teacher || 'TBA'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Busy Soon or Free with Next Up */}
            {(status === 'free' || status === 'busy-soon') && nextClass && (
              <div className="bg-slate-darker/80 rounded-lg p-3 border border-slate-border/50">
                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${status === 'busy-soon' ? 'text-amber-soon' : 'text-text-muted'}`}>
                  Next Up
                </p>
                <h4 className="text-sm font-semibold text-text-primary mb-2 line-clamp-1" title={nextClass.subject}>
                  {nextClass.subject}
                </h4>
                <div className="flex flex-col gap-1.5 text-xs text-text-muted">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className={status === 'busy-soon' ? 'text-amber-soon' : 'text-violet-primary'} />
                    <span>{nextClass.start_time} - {nextClass.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={12} className={status === 'busy-soon' ? 'text-amber-soon' : 'text-violet-primary'} />
                    <span className="truncate">{nextClass.teacher || 'TBA'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Free for the rest of the day */}
            {status === 'free' && !nextClass && (
              <div className="bg-emerald-free/5 rounded-lg p-3 border border-emerald-free/10 flex items-center justify-center h-[92px]">
                <p className="text-sm font-medium text-emerald-free/80 text-center">
                  Free for the rest of the day 🎉
                </p>
              </div>
            )}
          </>
        )}

        {/* ══ CASE B: OTHER DAYS (Schedule Overview, No Live Claims) ══ */}
        {!isToday && (
          scheduleCount === 0 ? (
            <div className="bg-slate-darker/50 rounded-xl p-4 border border-slate-border/40 flex items-center justify-center min-h-[92px]">
              <p className="text-xs font-medium text-text-muted text-center leading-relaxed">
                No classes scheduled on <strong className="text-text-primary">{dayLabel}</strong> 🎉<br />
                <span className="text-[11px] opacity-75">Classroom vacant all day</span>
              </p>
            </div>
          ) : (
            <div className="bg-slate-darker/80 rounded-xl p-3.5 border border-slate-border/50 space-y-2.5 min-h-[92px]">
              <div className="flex items-center justify-between text-xs border-b border-slate-border/40 pb-2">
                <span className="text-text-muted font-semibold flex items-center gap-1">
                  <Calendar size={12} className="text-violet-primary" />
                  {dayLabel} Schedule
                </span>
                <span className="text-violet-primary font-bold text-[11px]">
                  {firstClass?.start_time} – {lastClass?.end_time}
                </span>
              </div>
              <div className="space-y-1.5">
                {previewClasses.map((cls, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-deep/70 px-2.5 py-1.5 rounded-lg border border-slate-border/40">
                    <span className="font-semibold text-text-primary truncate max-w-[150px]" title={cls.subject}>
                      {cls.subject}
                    </span>
                    <span className="text-[11px] text-text-muted font-mono font-medium shrink-0 ml-2">
                      {cls.start_time} - {cls.end_time}
                    </span>
                  </div>
                ))}
                {scheduleCount > 2 && (
                  <p className="text-[10px] text-text-muted/70 text-right pr-1">
                    +{scheduleCount - 2} more lectures below
                  </p>
                )}
              </div>
            </div>
          )
        )}
      </div>

      <ScheduleAccordion
        schedule={fullSchedule}
        queryTimeInMinutes={queryTimeInMinutes}
        roomName={name}
        isToday={isToday}
      />
    </div>
  )
}
