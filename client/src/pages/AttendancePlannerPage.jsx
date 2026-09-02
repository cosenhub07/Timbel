import { useState, useEffect, useRef } from 'react'
import {
  BookOpen, Plus, CheckCircle, XCircle, Clock, AlertTriangle,
  ChevronDown, ChevronUp, BarChart2, ShieldCheck, TrendingUp,
  Trash2, RefreshCw, Info, Save, ArrowRight, CalendarDays, MapPin,
  Ban, PlusCircle, Zap, Sparkles, Target
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import QuantumBackground from '../components/QuantumBackground'
import LottieLib from 'lottie-react'
import loaderAnimation from '../assets/loder.json'
import assistantAnimation from '../assets/assistent.json'
import { supabase } from '../supabaseClient'

const Lottie = LottieLib.default || LottieLib

async function fetchWithAuth(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const headers = { ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(url, { ...options, headers })
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calcStats(record, overrideTarget = null) {
  const present = record.present || 0
  const absent = record.absent || 0
  const pending = record.pending || 0
  const totalCounted = present + absent
  const currentPct = totalCounted > 0 ? (present / totalCounted) * 100 : 0
  const totalWithPending = totalCounted + pending
  const bestCase = totalWithPending > 0 ? ((present + pending) / totalWithPending) * 100 : currentPct
  const worstCase = totalWithPending > 0 ? (present / totalWithPending) * 100 : currentPct
  const target = overrideTarget !== null && overrideTarget !== undefined ? Number(overrideTarget) : (record.required_percentage || 75)
  const reqPct = target / 100
  const num = reqPct * totalCounted - present
  const den = 1 - reqPct
  const requiredToAttend = num > 0 ? Math.ceil(num / den) : 0
  const maxAbs = Math.floor(present / reqPct - totalCounted)
  const safeBunks = maxAbs > 0 ? maxAbs : 0
  let status = 'SAFE'
  if (requiredToAttend > 0) status = 'DANGER'
  else if (safeBunks <= 2) status = 'WARNING'
  return { currentPct, bestCase, worstCase, requiredToAttend, safeBunks, status, pending, target }
}

function StatusBadge({ status }) {
  if (status === 'DANGER') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-busy/15 text-red-busy border border-red-busy/30 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
      <AlertTriangle size={11} /> Detention Risk
    </span>
  )
  if (status === 'WARNING') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-soon/15 text-amber-soon border border-amber-soon/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
      <AlertTriangle size={11} /> Low Margin
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-free/15 text-emerald-free border border-emerald-free/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
      <ShieldCheck size={11} /> Compliant
    </span>
  )
}

function getSessionTypeBadge(type = '', subject = '') {
  const t = (type || '').trim().toUpperCase()
  const s = (subject || '').trim().toUpperCase()

  if (
    t === 'LAB' || t === 'PRACTICAL' || t === 'PRAC' || t === 'P' ||
    s.includes('(LAB)') || s.includes('- LAB') || s.endsWith(' LAB') || s.includes('PRACTICAL')
  ) {
    return {
      label: 'Lab',
      icon: '🔬',
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
    }
  }

  if (
    t === 'TUT' || t === 'TUTORIAL' || t === 'T' ||
    s.includes('(TUT)') || s.includes('- TUT') || s.includes('TUTORIAL')
  ) {
    return {
      label: 'Tutorial',
      icon: '📝',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
    }
  }

  if (t === 'EVENT' || t === 'WORKSHOP' || t === 'SEMINAR') {
    return {
      label: t === 'EVENT' ? 'Event' : 'Workshop',
      icon: '⚡',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    }
  }

  return {
    label: 'Lecture',
    icon: '📖',
    badgeClass: 'bg-violet-primary/15 text-violet-300 border-violet-primary/30'
  }
}

function SessionTypeBadge({ type, subject }) {
  const info = getSessionTypeBadge(type, subject)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${info.badgeClass}`}>
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  )
}

function CircleProgress({ pct, status }) {
  const radius = 36
  const circ = 2 * Math.PI * radius
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  const color = status === 'DANGER' ? '#EF4444' : status === 'WARNING' ? '#F59E0B' : '#10B981'
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" className="flex-shrink-0">
      <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle
        cx="45" cy="45" r={radius} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <text x="45" y="49" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
        {pct.toFixed(0)}%
      </text>
    </svg>
  )
}

// ─── Criteria Selector Component ──────────────────────────────────────────────

function CriteriaSelector({ value, onChange, onSaveAsDefault, isSaving, showSaveBtn = true }) {
  const presets = [65, 70, 75, 80, 85]
  const [customVal, setCustomVal] = useState(presets.includes(Number(value)) ? '' : value)

  useEffect(() => {
    if (!presets.includes(Number(value))) {
      setCustomVal(value)
    } else {
      setCustomVal('')
    }
  }, [value])

  return (
    <div className="glass-card p-4 sm:p-5 border border-violet-primary/30 bg-gradient-to-r from-violet-primary/15 via-slate-card/60 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-primary/20 border border-violet-primary/30 flex items-center justify-center text-violet-primary shrink-0 shadow-[0_0_15px_rgba(99,91,255,0.25)]">
          <Target size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
            Target Attendance Criteria
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-violet-primary/25 text-violet-primary border border-violet-primary/40">
              {value}%
            </span>
          </h4>
          <p className="text-xs text-text-muted mt-0.5">
            Set university baseline or your personal target (simulates live across all subjects)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {presets.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setCustomVal('')
              onChange(p)
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border select-none active:scale-95 ${
              Number(value) === p
                ? 'bg-violet-primary text-white border-violet-primary shadow-[0_0_12px_rgba(99,91,255,0.4)] scale-105'
                : 'bg-slate-deep text-text-secondary border-slate-border hover:border-violet-primary/50 hover:text-text-primary'
            }`}
          >
            {p}%
          </button>
        ))}

        {/* Custom Input */}
        <div className="flex items-center rounded-xl overflow-hidden border border-slate-border bg-slate-deep focus-within:border-violet-primary transition-all">
          <input
            type="number"
            min="1"
            max="100"
            placeholder="Custom"
            value={customVal}
            onChange={e => {
              const v = e.target.value
              setCustomVal(v)
              const n = parseInt(v)
              if (!isNaN(n) && n > 0 && n <= 100) {
                onChange(n)
              }
            }}
            className="w-16 px-2 py-1.5 text-xs font-bold text-text-primary bg-transparent text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="pr-2 text-xs font-bold text-text-muted select-none">%</span>
        </div>

        {showSaveBtn && onSaveAsDefault && (
          <button
            type="button"
            onClick={onSaveAsDefault}
            disabled={isSaving}
            className="ml-auto md:ml-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-free/15 hover:bg-emerald-free/25 text-emerald-free border border-emerald-free/30 transition-all flex items-center gap-1.5 disabled:opacity-50 select-none active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
            title="Save this percentage as your permanent default in database"
          >
            <CheckCircle size={13} />
            {isSaving ? 'Saving...' : 'Set as Default'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Attendance Input Form (with Quick Steppers) ───────────────────────────

function StepperField({ label, icon: Icon, value, colorClass, borderClass, onChange }) {
  const val = parseInt(value) || 0
  return (
    <div>
      <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1 ${colorClass}`}>
        <Icon size={11} /> {label}
      </label>
      <div className={`flex items-stretch rounded-xl overflow-hidden border bg-slate-deep ${borderClass} focus-within:ring-1 focus-within:ring-violet-primary/50 transition-all`}>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, val - 1))}
          className="px-3 py-2 bg-slate-border/20 hover:bg-slate-border/50 text-text-muted hover:text-text-primary text-sm font-bold transition-colors select-none active:scale-90"
        >
          −
        </button>
        <input
          type="number"
          min="0"
          value={value ?? ''}
          placeholder="0"
          onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full text-center bg-transparent text-text-primary text-sm font-bold focus:outline-none py-1.5 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(val + 1)}
          className={`px-3 py-2 bg-slate-border/20 hover:bg-slate-border/50 text-sm font-bold transition-colors select-none active:scale-90 ${colorClass}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

function SubjectInputCard({ subject, data, onChange, onRemove }) {
  return (
    <div className="glass-card p-5 border border-slate-border/50 hover:border-violet-primary/30 transition-all duration-300 group flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-text-primary font-bold text-base leading-snug break-words" title={subject.subject}>
            {subject.subject}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <SessionTypeBadge type={subject.session_type} subject={subject.subject} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(subject)}
          className="text-text-muted hover:text-red-busy transition-colors opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-busy/10 flex-shrink-0"
          title="Remove subject"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StepperField
          label="Present"
          icon={CheckCircle}
          value={data.present}
          colorClass="text-emerald-free"
          borderClass="border-emerald-free/30"
          onChange={val => onChange(subject, 'present', val)}
        />
        <StepperField
          label="Absent"
          icon={XCircle}
          value={data.absent}
          colorClass="text-red-busy"
          borderClass="border-red-busy/30"
          onChange={val => onChange(subject, 'absent', val)}
        />
        <StepperField
          label="Pending"
          icon={Clock}
          value={data.pending}
          colorClass="text-amber-soon"
          borderClass="border-amber-soon/30"
          onChange={val => onChange(subject, 'pending', val)}
        />
        <StepperField
          label="No Attend"
          icon={Info}
          value={data.no_attendance}
          colorClass="text-text-muted"
          borderClass="border-slate-border"
          onChange={val => onChange(subject, 'no_attendance', val)}
        />
      </div>
    </div>
  )
}

// ─── Dashboard Subject Card ─────────────────────────────────────────────────────

// ─── Dashboard Subject Card (with Leave Impact Simulator) ───────────────────

function SubjectDashCard({ record, targetCriteria }) {
  const stats = calcStats(record, targetCriteria)
  const status = stats.status
  const requiredToAttend = stats.requiredToAttend
  const safeBunks = stats.safeBunks
  const proj = record.projection || {}

  const [expanded, setExpanded] = useState(false)
  const [simMiss, setSimMiss] = useState(0) // 0 = off, 1, 2, 3

  // Live Leave Impact Simulator math
  const simTotalCounted = (record.present || 0) + (record.absent || 0) + simMiss
  const simPct = simTotalCounted > 0 ? ((record.present || 0) / simTotalCounted) * 100 : 0
  const simBufferRemaining = Math.max(0, safeBunks - simMiss)
  const simStatus = simPct < stats.target ? 'DANGER' : (simBufferRemaining <= 2 ? 'WARNING' : 'SAFE')

  return (
    <div className={`glass-card border transition-all duration-300 overflow-hidden ${
      status === 'DANGER' ? 'border-red-busy/30 hover:border-red-busy/50 shadow-[0_0_15px_rgba(239,68,68,0.06)]' :
      status === 'WARNING' ? 'border-amber-soon/30 hover:border-amber-soon/50 shadow-[0_0_15px_rgba(245,158,11,0.06)]' :
      'border-emerald-free/30 hover:border-emerald-free/50 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
    }`}>
      <div className="p-5 flex items-start gap-4">
        <CircleProgress pct={stats.currentPct} status={status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-text-primary font-bold text-base leading-snug break-words flex-1" title={record.subject}>
              {record.subject}
            </h3>
            <div className="flex-shrink-0">
              <StatusBadge status={status} />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2.5">
            <SessionTypeBadge type={record.session_type} subject={record.subject} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
            <span className="text-emerald-free font-semibold">{record.present}P</span>
            <span className="text-red-busy font-semibold">{record.absent}A</span>
            {record.pending > 0 && <span className="text-amber-soon font-semibold">{record.pending} Pending</span>}
            {proj.futureLectureCount > 0 && (
              <span className="text-violet-primary/80 font-semibold">{proj.futureLectureCount} upcoming</span>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0 p-1 mt-0.5">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Action / Guidance Bar */}
      <div className={`px-5 pb-3 flex flex-col gap-1.5 text-sm font-semibold ${
        status === 'DANGER' ? 'text-red-busy' :
        status === 'WARNING' ? 'text-amber-soon' :
        'text-emerald-free'
      }`}>
        {status === 'DANGER' ? (
          <>
            {proj.isUnrecoverable ? (
              <span className="flex items-center gap-2">
                <AlertTriangle size={14} />
                ⛔ Unrecoverable — insufficient lectures remaining this semester
              </span>
            ) : (
              <span className="flex items-center gap-2 flex-wrap">
                <AlertTriangle size={14} />
                Recovery Target: Attend next <strong>{requiredToAttend}</strong> lectures to reach {stats.target}%
                {proj.recoveryDate && (
                  <span className="font-normal text-text-muted ml-1">
                    → Expected by <strong className="text-red-busy">{proj.recoveryDate.formatted}</strong>
                  </span>
                )}
              </span>
            )}
          </>
        ) : status === 'WARNING' ? (
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} />
            Critical Buffer: Only <strong>{safeBunks}</strong> {safeBunks === 1 ? 'lecture' : 'lectures'} before dipping below {stats.target}%
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <ShieldCheck size={14} />
            Safety Buffer: <strong>{safeBunks}</strong> lectures available without penalty
          </span>
        )}

        {/* Next lecture chip */}
        {proj.nextLecture && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted mt-0.5">
            <CalendarDays size={11} className="text-violet-primary" />
            Next Scheduled: <strong className="text-text-secondary">{proj.nextLecture.formatted}</strong>
            {proj.nextLecture.time && <span className="text-text-muted">at {proj.nextLecture.time}</span>}
          </span>
        )}
      </div>

      {/* ── Interactive Leave Impact Simulator ── */}
      <div className="px-5 pb-4 pt-2 border-t border-slate-border/30 bg-slate-card/20">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-text-muted flex items-center gap-1.5">
            <Zap size={12} className="text-violet-primary" /> Test Leave Impact:
          </span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => setSimMiss(n)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  simMiss === n
                    ? 'bg-violet-primary text-white shadow-[0_0_10px_rgba(99,91,255,0.4)]'
                    : 'bg-slate-deep border border-slate-border/60 text-text-muted hover:text-text-primary'
                }`}
              >
                {n === 0 ? 'Actual' : `+${n} Miss`}
              </button>
            ))}
          </div>
        </div>

        {simMiss > 0 && (
          <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
            simStatus === 'DANGER'
              ? 'bg-red-busy/10 border-red-busy/30 text-red-busy'
              : simStatus === 'WARNING'
              ? 'bg-amber-soon/10 border-amber-soon/30 text-amber-soon'
              : 'bg-emerald-free/10 border-emerald-free/30 text-emerald-free'
          }`}>
            <div>
              <span>If you miss next <strong>{simMiss}</strong> {simMiss === 1 ? 'class' : 'classes'}:</span>
              <div className="font-bold text-sm mt-0.5 flex items-center gap-2">
                <span>{stats.currentPct.toFixed(1)}% ➔ {simPct.toFixed(1)}%</span>
                <span className="text-xs font-normal opacity-80">
                  ({simStatus === 'DANGER' ? '🚨 Drops below mandatory threshold!' : `Leaves ${simBufferRemaining} buffer classes`})
                </span>
              </div>
            </div>
            <button
              onClick={() => setSimMiss(0)}
              className="text-[10px] underline opacity-70 hover:opacity-100 ml-2"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-border/50 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">

          {/* Flexible Leave Dates */}
          {proj.safeBunkDates && proj.safeBunkDates.length > 0 && (
            <div className="bg-emerald-free/5 border border-emerald-free/20 rounded-xl p-3">
              <p className="text-xs text-emerald-free font-semibold mb-2 flex items-center gap-1">
                <ShieldCheck size={11} /> Flexible Leave Dates (next {proj.safeBunkDates.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {proj.safeBunkDates.map((d, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-free/10 text-emerald-free text-xs font-medium border border-emerald-free/20">
                    {d.day} · {d.formatted}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pending range */}
          {stats.pending > 0 && (
            <div className="bg-amber-soon/5 border border-amber-soon/20 rounded-xl p-3">
              <p className="text-xs text-amber-soon font-semibold mb-1">⏳ Pending Attendance Range</p>
              <p className="text-xs text-text-muted">
                If all {stats.pending} pending → <strong className="text-emerald-free">Present</strong>: {stats.bestCase.toFixed(1)}%
              </p>
              <p className="text-xs text-text-muted">
                If all {stats.pending} pending → <strong className="text-red-busy">Absent</strong>: {stats.worstCase.toFixed(1)}%
              </p>
            </div>
          )}

          {/* Mini progress breakdown */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-emerald-free/10 rounded-lg p-2">
              <p className="text-emerald-free font-bold text-lg">{record.present}</p>
              <p className="text-emerald-free/70 text-[10px] font-semibold">PRESENT</p>
            </div>
            <div className="bg-red-busy/10 rounded-lg p-2">
              <p className="text-red-busy font-bold text-lg">{record.absent}</p>
              <p className="text-red-busy/70 text-[10px] font-semibold">ABSENT</p>
            </div>
            <div className="bg-amber-soon/10 rounded-lg p-2">
              <p className="text-amber-soon font-bold text-lg">{record.pending}</p>
              <p className="text-amber-soon/70 text-[10px] font-semibold">PENDING</p>
            </div>
            <div className="bg-slate-card/80 rounded-lg p-2">
              <p className="text-text-muted font-bold text-lg">{record.no_attendance}</p>
              <p className="text-text-muted/70 text-[10px] font-semibold">N/A</p>
            </div>
          </div>

          {/* Footer meta */}
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Required target: <strong className="text-violet-primary">{record.required_percentage}%</strong></span>
            {proj.semesterEnd && (
              <span className="flex items-center gap-1">
                <CalendarDays size={10} /> Semester ends {proj.semesterEnd}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Daily Attendance Outlook (Leave Feasibility & Morning Decision) ────────

function DailyOutlookCard({ subjects, targetCriteria }) {
  const todayStr = new Date().toISOString().split('T')[0]
  const todayLectures = []

  subjects.forEach(s => {
    const next = s.projection?.nextLecture
    if (next && next.dateStr === todayStr) {
      const stats = calcStats(s, targetCriteria)
      todayLectures.push({
        subject: s.subject,
        session_type: s.session_type,
        time: next.time,
        status: stats.status,
        safeBunks: stats.safeBunks,
        requiredToAttend: stats.requiredToAttend
      })
    }
  })

  // Determine verdict
  let verdict = 'NO_CLASSES'
  if (todayLectures.length > 0) {
    if (todayLectures.some(l => l.status === 'DANGER')) {
      verdict = 'DANGER'
    } else if (todayLectures.some(l => l.status === 'WARNING')) {
      verdict = 'WARNING'
    } else {
      verdict = 'SAFE'
    }
  }

  return (
    <div className={`glass-card p-5 border rounded-2xl relative overflow-hidden transition-all ${
      verdict === 'DANGER' ? 'border-red-busy/40 bg-gradient-to-r from-red-busy/10 via-slate-card/60 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.08)]' :
      verdict === 'WARNING' ? 'border-amber-soon/40 bg-gradient-to-r from-amber-soon/10 via-slate-card/60 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.08)]' :
      verdict === 'SAFE' ? 'border-emerald-free/40 bg-gradient-to-r from-emerald-free/10 via-slate-card/60 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.08)]' :
      'border-slate-border/50 bg-slate-card/40'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold ${
            verdict === 'DANGER' ? 'bg-red-busy/20 text-red-busy border border-red-busy/30' :
            verdict === 'WARNING' ? 'bg-amber-soon/20 text-amber-soon border border-amber-soon/30' :
            verdict === 'SAFE' ? 'bg-emerald-free/20 text-emerald-free border border-emerald-free/30' :
            'bg-slate-border/30 text-text-muted'
          }`}>
            {verdict === 'DANGER' ? '🚨' : verdict === 'WARNING' ? '⚡' : verdict === 'SAFE' ? '🛡️' : '☕'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-text-muted">
                Daily Attendance Outlook
              </span>
              <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                verdict === 'DANGER' ? 'bg-red-busy/20 text-red-busy border border-red-busy/30' :
                verdict === 'WARNING' ? 'bg-amber-soon/20 text-amber-soon border border-amber-soon/30' :
                verdict === 'SAFE' ? 'bg-emerald-free/20 text-emerald-free border border-emerald-free/30' :
                'bg-slate-border text-text-muted'
              }`}>
                {verdict === 'DANGER' ? 'Mandatory Attendance' :
                 verdict === 'WARNING' ? 'Caution Advised' :
                 verdict === 'SAFE' ? 'Low Risk • Leave Feasible' : 'No Classes Scheduled'}
              </span>
            </div>
            <h4 className="text-base font-bold text-text-primary mt-1">
              {verdict === 'DANGER' && 'Critical Lectures Scheduled Today'}
              {verdict === 'WARNING' && 'Low Safety Buffer in Today’s Schedule'}
              {verdict === 'SAFE' && 'All Clear Today — Healthy Safety Buffer'}
              {verdict === 'NO_CLASSES' && 'No Timetable Slots Detected For Today'}
            </h4>
            <p className="text-xs text-text-muted mt-0.5 max-w-xl leading-relaxed">
              {verdict === 'DANGER' && 'You have class in a subject where attendance is below 75%. Attending today is essential to protect exam eligibility.'}
              {verdict === 'WARNING' && 'You have classes with 2 or fewer buffer lectures remaining. Missing today may push you into detention risk.'}
              {verdict === 'SAFE' && 'All subjects scheduled for today have a comfortable attendance cushion. If you have personal matters or an emergency, leave is feasible.'}
              {verdict === 'NO_CLASSES' && 'No scheduled classes today according to your weekly timetable. Enjoy the break or catch up on revisions!'}
            </p>
          </div>
        </div>

        {todayLectures.length > 0 && (
          <div className="flex flex-wrap sm:flex-col gap-1.5 self-stretch sm:self-center justify-end sm:items-end flex-shrink-0 text-xs">
            {todayLectures.map((l, i) => {
              const typeInfo = getSessionTypeBadge(l.session_type, l.subject)
              return (
                <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium border text-[11px] ${
                  l.status === 'DANGER' ? 'bg-red-busy/15 border-red-busy/30 text-red-busy' :
                  l.status === 'WARNING' ? 'bg-amber-soon/15 border-amber-soon/30 text-amber-soon' :
                  'bg-emerald-free/15 border-emerald-free/30 text-emerald-free'
                }`}>
                  <span>{typeInfo.icon}</span>
                  <span className="font-semibold">{l.subject}</span>
                  <span className="opacity-75 text-[10px]">({typeInfo.label})</span>
                  {l.time && <span className="opacity-60">@{l.time}</span>}
                  <span className="font-bold ml-1">• {l.status === 'DANGER' ? 'Must Attend' : `${l.safeBunks} Buffer`}</span>
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── AI Advisor (Phase 5) ───────────────────────────────────────────────────

function AIAdvisorPanel({ dashboardData }) {
  const [advice, setAdvice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analyzed, setAnalyzed] = useState(false)

  function handleAnalyze() {
    if (!dashboardData) return
    setAnalyzed(true)
    setLoading(true)
    fetchWithAuth('/api/attendance/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboardData })
    })
      .then(r => r.json())
      .then(d => {
        if (d.advice) setAdvice(d.advice)
        else setError('Failed to generate advice.')
      })
      .catch(() => setError('Error reaching AI Advisor.'))
      .finally(() => setLoading(false))
  }

  // Reset if dashboard data heavily changes, or keep it simple. Let's just keep the advice unless user clicks again.
  // Actually, keeping the current advice is fine.

  if (!dashboardData) return null

  return (
    <div className="glass-card border border-violet-primary/30 bg-gradient-to-br from-violet-primary/10 to-transparent overflow-hidden mb-6 relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-primary to-emerald-free"></div>
      <div className="p-5 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-violet-primary/15 flex items-center justify-center flex-shrink-0 border border-violet-primary/30 overflow-hidden shadow-[0_0_15px_rgba(99,91,255,0.2)]">
          <Lottie animationData={assistantAnimation} className="w-9 h-9" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-text-primary font-bold flex items-center gap-2">
              Timbel AI Advisory
              <span className="text-[10px] uppercase tracking-wider bg-violet-primary/20 text-violet-primary px-2 py-0.5 rounded-full font-semibold">Gemini Flash</span>
            </h3>
            {!analyzed && (
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-primary hover:bg-violet-hover text-white text-xs font-bold rounded-lg transition-all duration-200"
              >
                <Sparkles size={13} /> Analyse with AI
              </button>
            )}
          </div>
          
          {analyzed && (
            loading ? (
              <div className="space-y-2 mt-3 w-full">
                <div className="h-4 bg-slate-border/50 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-slate-border/50 rounded animate-pulse w-1/2"></div>
              </div>
            ) : error ? (
              <p className="text-xs text-red-busy mt-2">{error}</p>
            ) : (
              <div className="text-sm text-text-muted mt-3 space-y-2 leading-relaxed">
                {advice.split('\n').filter(line => line.trim()).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )
          )}
          
          {!analyzed && (
            <p className="text-xs text-text-muted mt-2">
              Get personalized insights on your attendance using AI.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Exception Panel (Phase 4) ────────────────────────────────────────────────

function ExceptionPanel({ user, subjects, campusId, classCode, onRefreshDashboard }) {
  const [exceptions, setExceptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', session_type: 'LEC', exception_date: '', exception_type: 'CANCELLED', note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchWithAuth(`/api/attendance/exceptions?user_id=${user.id}`)
      .then(r => r.json())
      .then(d => { setExceptions(d.exceptions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  async function handleSave() {
    if (!form.subject || !form.exception_date) {
      setError('Please fill in subject and date.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetchWithAuth('/api/attendance/save-exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id, campus_id: campusId, class_code: classCode,
          subject: form.subject, session_type: form.session_type,
          exception_date: form.exception_date, exception_type: form.exception_type,
          note: form.note
        })
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error)
      const updated = await fetchWithAuth(`/api/attendance/exceptions?user_id=${user.id}`).then(r => r.json())
      setExceptions(updated.exceptions || [])
      setShowForm(false)
      setForm({ subject: '', session_type: 'LEC', exception_date: '', exception_type: 'CANCELLED', note: '' })
      onRefreshDashboard()
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await fetchWithAuth(`/api/attendance/exception/${id}?user_id=${user.id}`, { method: 'DELETE' })
      setExceptions(prev => prev.filter(e => e.id !== id))
      onRefreshDashboard()
    } catch {}
  }

  return (
    <div className="glass-card border border-violet-primary/20 overflow-hidden">
      <div className="p-5 flex items-center justify-between">
        <div>
          <h3 className="text-text-primary font-bold flex items-center gap-2">
            <Zap size={16} className="text-violet-primary" /> Lecture Exceptions
          </h3>
          <p className="text-xs text-text-muted mt-0.5">Report cancelled or extra lectures to improve accuracy</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-primary/10 hover:bg-violet-primary/20 text-violet-primary text-xs font-bold rounded-lg border border-violet-primary/30 transition-all duration-200"
        >
          <PlusCircle size={13} /> Report
        </button>
      </div>

      {showForm && (
        <div className="px-5 pb-5 border-t border-slate-border/50 pt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1.5 block">Subject</label>
              <select
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full bg-slate-deep border border-slate-border text-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-primary transition-all"
              >
                <option value="">Select subject...</option>
                {subjects.map(s => (
                  <option key={`${s.subject}_${s.session_type}`} value={s.subject}>
                    {s.subject} ({s.session_type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1.5 block">Session Type</label>
              <select
                value={form.session_type}
                onChange={e => setForm(f => ({ ...f, session_type: e.target.value }))}
                className="w-full bg-slate-deep border border-slate-border text-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-primary transition-all"
              >
                <option value="LEC">Lecture</option>
                <option value="LAB">Lab</option>
                <option value="TUT">Tutorial</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1.5 block">Date</label>
              <input
                type="date"
                value={form.exception_date}
                onChange={e => setForm(f => ({ ...f, exception_date: e.target.value }))}
                className="w-full bg-slate-deep border border-slate-border text-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-primary transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1.5 block">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm(f => ({ ...f, exception_type: 'CANCELLED' }))}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    form.exception_type === 'CANCELLED'
                      ? 'bg-red-busy/20 border-red-busy text-red-busy'
                      : 'bg-slate-deep border-slate-border text-text-muted hover:border-red-busy/50'
                  }`}
                >
                  <Ban size={13} /> Cancelled
                </button>
                <button
                  onClick={() => setForm(f => ({ ...f, exception_type: 'EXTRA' }))}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    form.exception_type === 'EXTRA'
                      ? 'bg-emerald-free/20 border-emerald-free text-emerald-free'
                      : 'bg-slate-deep border-slate-border text-text-muted hover:border-emerald-free/50'
                  }`}
                >
                  <Zap size={13} /> Extra
                </button>
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="Optional note (e.g. Teacher absent, Makeup class)..."
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            className="w-full bg-slate-deep border border-slate-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-primary transition-all"
          />
          {error && <p className="text-red-busy text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-lg border border-slate-border text-text-muted text-sm font-semibold hover:border-slate-border/70 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] py-2 rounded-lg bg-violet-primary hover:bg-violet-hover disabled:opacity-50 text-white text-sm font-bold transition-all"
            >
              {saving ? 'Saving...' : 'Save Exception'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="px-5 pb-5 text-text-muted text-sm text-center py-4">Loading...</div>
      ) : exceptions.length === 0 && !showForm ? (
        <div className="px-5 pb-5 text-center py-2">
          <p className="text-text-muted text-sm">No exceptions reported yet.</p>
          <p className="text-text-muted/60 text-xs mt-0.5">Use this if a lecture was cancelled or an extra class was held.</p>
        </div>
      ) : (
        <div className="px-5 pb-4 space-y-2 border-t border-slate-border/30 pt-3">
          {exceptions.map(ex => {
            const typeInfo = getSessionTypeBadge(ex.session_type, ex.subject)
            return (
              <div key={ex.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border group ${
                ex.exception_type === 'CANCELLED'
                  ? 'border-red-busy/20 bg-red-busy/5'
                  : 'border-emerald-free/20 bg-emerald-free/5'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  {ex.exception_type === 'CANCELLED'
                    ? <Ban size={13} className="text-red-busy flex-shrink-0" />
                    : <Zap size={13} className="text-emerald-free flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${
                      ex.exception_type === 'CANCELLED' ? 'text-red-busy' : 'text-emerald-free'
                    }`}>
                      {ex.exception_type} — {ex.subject} <span className="font-normal opacity-75">({typeInfo.label})</span>
                    </p>
                    <p className="text-text-muted text-[11px] truncate">
                      {ex.exception_date}{ex.note ? ` · ${ex.note}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(ex.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-busy transition-all duration-200 ml-2 flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AttendancePlannerPage() {
  const { user, selectedCampus } = useAuth()

  // Step 1: Select class  |  Step 2: Input data  |  Step 3: Dashboard
  const [step, setStep] = useState('setup-class')

  // Target Criteria state (flexible: 65, 70, 75, 80, 85 or custom %)
  const [targetCriteria, setTargetCriteria] = useState(75)
  const [criteriaUpdating, setCriteriaUpdating] = useState(false)
  const [criteriaSavedToast, setCriteriaSavedToast] = useState(false)

  // Class selection state
  const [classes, setClasses] = useState([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [selectedClass, setSelectedClass] = useState('')
  const [classDropdownOpen, setClassDropdownOpen] = useState(false)
  const [classSearch, setClassSearch] = useState('')
  const dropdownRef = useRef(null)

  // Subjects loaded from timetable
  const [timetableSubjects, setTimetableSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  // Input form state: { "DBMS_LEC": { present:0, absent:0, pending:0, no_attendance:0 }, ... }
  const [inputData, setInputData] = useState({})
  const [activeSubjects, setActiveSubjects] = useState([]) // [{subject, session_type}, ...]

  // Dashboard state
  const [dashboardData, setDashboardData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // ── Close class dropdown on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setClassDropdownOpen(false)
        setClassSearch('')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // ── Load available classes
  useEffect(() => {
    const campusParam = selectedCampus?.id ? `?campus_id=${selectedCampus.id}` : ''
    fetch(`/api/timetable/classes${campusParam}`)
      .then(r => r.json())
      .then(d => { if (d.classes) setClasses(d.classes); setLoadingClasses(false) })
      .catch(() => setLoadingClasses(false))
  }, [selectedCampus])

  // ── When a class is selected, load its timetable to extract unique subjects
  useEffect(() => {
    if (!selectedClass) return
    setLoadingSubjects(true)
    let url = `/api/timetable/classes/${encodeURIComponent(selectedClass)}`
    if (selectedCampus?.id) url += `?campus_id=${selectedCampus.id}`
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.schedule) {
          // Extract unique subject + session_type combos
          const seen = new Set()
          const subjects = []
          d.schedule.forEach(slot => {
            const key = `${slot.subject}_${slot.session_type || 'LEC'}`
            if (!seen.has(key)) {
              seen.add(key)
              subjects.push({ subject: slot.subject, session_type: slot.session_type || 'LEC' })
            }
          })
          setTimetableSubjects(subjects)
          // Pre-populate activeSubjects and inputData without wiping existing saved data
          setActiveSubjects(subjects)
          setInputData(prev => {
            const nextData = { ...prev }
            subjects.forEach(s => {
              const key = `${s.subject}_${s.session_type}`
              if (!nextData[key]) {
                nextData[key] = { present: 0, absent: 0, pending: 0, no_attendance: 0 }
              }
            })
            return nextData
          })
        }
        setLoadingSubjects(false)
      })
      .catch(() => setLoadingSubjects(false))
  }, [selectedClass])

  // ── Handle input changes
  function handleInputChange(subject, field, value) {
    const key = `${subject.subject}_${subject.session_type}`
    setInputData(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }))
  }

  // ── Remove a subject from the form
  function handleRemoveSubject(subject) {
    const key = `${subject.subject}_${subject.session_type}`
    setActiveSubjects(prev => prev.filter(s => `${s.subject}_${s.session_type}` !== key))
  }

  // ── Save all attendance records & move to dashboard
  async function handleSave() {
    if (!user) return
    setSaving(true)
    setSaveError('')

    const [classCode, ...sectionParts] = selectedClass.split(' ')
    const section = sectionParts.join(' ')

    try {
      for (const subj of activeSubjects) {
        const key = `${subj.subject}_${subj.session_type}`
        const d = inputData[key] || {}
        await fetchWithAuth('/api/attendance/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            campus_id: selectedCampus?.id || null,
            class_code: classCode,
            section,
            subject: subj.subject,
            session_type: subj.session_type,
            present: d.present || 0,
            absent: d.absent || 0,
            pending: d.pending || 0,
            no_attendance: d.no_attendance || 0,
            required_percentage: targetCriteria,
          })
        })
      }
      // Load dashboard
      await fetchDashboard()
      setStep('dashboard')
    } catch (err) {
      setSaveError('Failed to save attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Update criteria across all subjects
  async function handleUpdateCriteria(newVal) {
    if (!user) return
    setCriteriaUpdating(true)
    try {
      await fetchWithAuth('/api/attendance/update-criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          required_percentage: newVal
        })
      })
      setCriteriaSavedToast(true)
      setTimeout(() => setCriteriaSavedToast(false), 3000)
      setDashboardData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          subjects: prev.subjects.map(s => ({ ...s, required_percentage: newVal }))
        }
      })
    } catch (err) {
      console.error('Failed to update criteria:', err)
    } finally {
      setCriteriaUpdating(false)
    }
  }

  async function fetchDashboard() {
    if (!user) return
    const res = await fetchWithAuth(`/api/attendance/dashboard?user_id=${user.id}`)
    const d = await res.json()
    setDashboardData(d)
    if (d.subjects && d.subjects.length > 0 && d.subjects[0]?.required_percentage) {
      setTargetCriteria(Number(d.subjects[0].required_percentage))
    }
  }

  // ── Load dashboard directly if user already has saved data
  useEffect(() => {
    if (!user) return
    fetchWithAuth(`/api/attendance/dashboard?user_id=${user.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.subjects && d.subjects.length > 0) {
          setDashboardData(d)
          if (d.subjects[0]?.required_percentage) {
            setTargetCriteria(Number(d.subjects[0].required_percentage))
          }
          
          // Pre-populate so "Update" works perfectly
          const subjects = []
          const dataMap = {}
          d.subjects.forEach(s => {
            subjects.push({ subject: s.subject, session_type: s.session_type })
            dataMap[`${s.subject}_${s.session_type}`] = {
              present: s.present,
              absent: s.absent,
              pending: s.pending,
              no_attendance: s.no_attendance
            }
          })
          setActiveSubjects(subjects)
          setInputData(dataMap)

          if (d.subjects[0]?.class_code) {
             const cls = d.subjects[0].class_code + (d.subjects[0].section ? ' ' + d.subjects[0].section : '')
             setSelectedClass(cls)
          }

          setStep('dashboard')
        }
      })
      .catch(() => {})
  }, [user])

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────────

  const filteredClasses = classes.filter(c => c.toLowerCase().includes(classSearch.toLowerCase()))

  return (
    <div className="min-h-screen pb-24 relative overflow-x-hidden bg-transparent">
      <QuantumBackground />
      <div className="fixed inset-0 bg-slate-darker/50 z-0 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-violet-primary/15 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 relative z-10">

        {/* ── Hero Header ──────────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-primary/10 border border-violet-primary/30 text-violet-primary text-xs font-bold tracking-wider uppercase mb-4">
            <BarChart2 size={12} /> Smart Attendance Planner
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-text-primary mb-3">
            Know Your <span className="gradient-text">Attendance</span>
          </h1>
          <p className="text-text-muted text-base max-w-lg mx-auto leading-relaxed">
            Don't just know your percentage — know what to do about it. Enter your ERP attendance and we'll tell you exactly how many lectures to attend or safely skip.
          </p>
        </div>

        {/* ── Step Indicator ──────────────────────────────────────────────── */}
        {step !== 'dashboard' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['setup-class', 'input-data'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  step === s ? 'bg-violet-primary border-violet-primary text-white' :
                  (step === 'input-data' && i === 0) ? 'bg-emerald-free border-emerald-free text-white' :
                  'bg-slate-card border-slate-border text-text-muted'
                }`}>
                  {(step === 'input-data' && i === 0) ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-sm font-semibold hidden sm:block ${step === s ? 'text-text-primary' : 'text-text-muted'}`}>
                  {i === 0 ? 'Select Class' : 'Enter Attendance'}
                </span>
                {i < 1 && <div className="w-8 h-px bg-slate-border mx-1" />}
              </div>
            ))}
          </div>
        )}

        {/* ══ STEP 1: Class Selection ══════════════════════════════════════════ */}
        {step === 'setup-class' && (
          <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card p-8 border border-violet-primary/20 shadow-2xl">
              <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
                <BookOpen size={20} className="text-violet-primary" /> Select Your Class
              </h2>
              <p className="text-sm text-text-muted mb-6">
                We'll automatically load your subjects from the timetable.
              </p>

              {loadingClasses ? (
                <div className="flex justify-center py-6">
                  <Lottie animationData={loaderAnimation} className="w-14 h-14" />
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search class code (e.g. CSE5 A)..."
                      value={classDropdownOpen ? classSearch : selectedClass}
                      onChange={e => { setClassSearch(e.target.value); if (!classDropdownOpen) setClassDropdownOpen(true) }}
                      onClick={() => setClassDropdownOpen(true)}
                      className="w-full bg-slate-deep border border-slate-border text-text-primary rounded-xl pl-4 pr-11 py-4 focus:outline-none focus:border-violet-primary focus:ring-1 focus:ring-violet-primary transition-all duration-200"
                    />
                    <div
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text-primary transition-colors"
                      onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                    >
                      <ChevronDown size={20} className={`transition-transform duration-200 ${classDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  {classDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-deep border border-slate-border rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50">
                      {filteredClasses.length > 0 ? filteredClasses.map(c => (
                        <div
                          key={c}
                          onClick={() => { setSelectedClass(c); setClassDropdownOpen(false); setClassSearch('') }}
                          className={`px-4 py-3 hover:bg-violet-primary/20 cursor-pointer text-text-primary transition-colors border-b border-slate-border/50 last:border-0 text-sm ${selectedClass === c ? 'bg-violet-primary/10 text-violet-primary font-semibold' : ''}`}
                        >
                          {c}
                        </div>
                      )) : (
                        <div className="px-4 py-4 text-text-muted text-center text-sm">No classes found</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {loadingSubjects && (
                <div className="flex items-center justify-center gap-2 mt-4 text-text-muted text-sm">
                  <Lottie animationData={loaderAnimation} className="w-8 h-8" />
                  Loading subjects...
                </div>
              )}

              {selectedClass && timetableSubjects.length > 0 && !loadingSubjects && (
                <div className="mt-5">
                  <p className="text-xs text-text-muted mb-2 font-semibold uppercase tracking-wider">Subjects found ({timetableSubjects.length})</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {timetableSubjects.map(s => (
                      <span key={`${s.subject}_${s.session_type}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-deep border border-slate-border/80 text-text-primary text-xs font-semibold">
                        <span>{s.subject}</span>
                        <SessionTypeBadge type={s.session_type} subject={s.subject} />
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep('input-data')}
                    className="w-full flex items-center justify-center gap-2 bg-violet-primary hover:bg-violet-hover text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(99,91,255,0.3)] hover:shadow-[0_0_30px_rgba(99,91,255,0.5)]"
                  >
                    Enter Attendance Data <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ STEP 2: Input Attendance ═════════════════════════════════════════ */}
        {step === 'input-data' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Target Criteria Selector in Entry Step */}
            <CriteriaSelector
              value={targetCriteria}
              onChange={val => setTargetCriteria(val)}
              showSaveBtn={false}
            />

            {/* Info bar */}
            <div className="glass-card p-4 border border-amber-soon/20 bg-amber-soon/5 flex items-start gap-3">
              <Info size={18} className="text-amber-soon flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-muted">
                Enter the exact numbers from your <strong className="text-text-primary">ERP portal</strong> for each subject.
                Calculations will be calibrated against your target of <strong className="text-violet-primary font-bold">{targetCriteria}%</strong>.
              </p>
            </div>

            {/* Subject cards grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {activeSubjects.map(subj => (
                <SubjectInputCard
                  key={`${subj.subject}_${subj.session_type}`}
                  subject={subj}
                  data={inputData[`${subj.subject}_${subj.session_type}`] || {}}
                  onChange={handleInputChange}
                  onRemove={handleRemoveSubject}
                />
              ))}
            </div>

            {saveError && (
              <div className="glass-card p-4 border border-red-busy/30 bg-red-busy/5 mb-4 text-red-busy text-sm">
                {saveError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('setup-class')}
                className="flex-1 py-3 rounded-xl border border-slate-border text-text-muted hover:text-text-primary hover:border-slate-border/70 font-semibold transition-all duration-200"
              >
                ← Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving || activeSubjects.length === 0}
                className="flex-[2] flex items-center justify-center gap-2 bg-violet-primary hover:bg-violet-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(99,91,255,0.3)]"
              >
                {saving ? (
                  <><Lottie animationData={loaderAnimation} className="w-6 h-6" /> Saving...</>
                ) : (
                  <><Save size={16} /> Save & View Dashboard</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Dashboard ════════════════════════════════════════════════ */}
        {step === 'dashboard' && dashboardData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

            {/* Criteria Selector / What-If Simulator */}
            <CriteriaSelector
              value={targetCriteria}
              onChange={val => setTargetCriteria(val)}
              onSaveAsDefault={() => handleUpdateCriteria(targetCriteria)}
              isSaving={criteriaUpdating}
              showSaveBtn={true}
            />

            {/* Toast notification */}
            {criteriaSavedToast && (
              <div className="bg-emerald-free/15 border border-emerald-free/40 text-emerald-free px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
                <span className="flex items-center gap-2">
                  <CheckCircle size={15} /> Saved {targetCriteria}% as your default target criteria across all subjects!
                </span>
                <span className="text-[10px] text-emerald-free/70 font-semibold">Saved to database</span>
              </div>
            )}

            {/* Daily Attendance Outlook Banner */}
            <DailyOutlookCard subjects={dashboardData.subjects} targetCriteria={targetCriteria} />

            {/* AI Advisor Panel (Phase 5) */}
            <AIAdvisorPanel dashboardData={dashboardData} />

            {/* Overall card */}
            <div className="glass-card p-6 border border-violet-primary/30 bg-violet-primary/5 flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center sm:text-left flex-1">
                <p className="text-xs font-bold tracking-widest text-violet-primary uppercase mb-1">Overall Attendance</p>
                <div className="text-6xl font-extrabold gradient-text mb-1">
                  {dashboardData.overall_attendance.toFixed(1)}%
                </div>
                <p className="text-text-muted text-sm">Target Criteria: <strong className="text-violet-primary font-bold">{targetCriteria}%</strong></p>
              </div>
              <div className="flex gap-4 text-center">
                <div className="bg-slate-deep rounded-xl px-5 py-3">
                  <p className="text-emerald-free font-bold text-2xl">{dashboardData.subjects.filter(s => calcStats(s, targetCriteria).status === 'SAFE').length}</p>
                  <p className="text-emerald-free/70 text-xs font-semibold mt-0.5">COMPLIANT</p>
                </div>
                <div className="bg-slate-deep rounded-xl px-5 py-3">
                  <p className="text-amber-soon font-bold text-2xl">{dashboardData.subjects.filter(s => calcStats(s, targetCriteria).status === 'WARNING').length}</p>
                  <p className="text-amber-soon/70 text-xs font-semibold mt-0.5">LOW MARGIN</p>
                </div>
                <div className="bg-slate-deep rounded-xl px-5 py-3">
                  <p className="text-red-busy font-bold text-2xl">{dashboardData.subjects.filter(s => calcStats(s, targetCriteria).status === 'DANGER').length}</p>
                  <p className="text-red-busy/70 text-xs font-semibold mt-0.5">AT RISK</p>
                </div>
              </div>
              <button
                onClick={() => setStep('input-data')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-violet-primary/40 text-violet-primary hover:bg-violet-primary/10 text-sm font-semibold transition-all duration-200"
              >
                <RefreshCw size={14} /> Update Data
              </button>
            </div>

            {/* ── Danger subjects first ── */}
            {['DANGER', 'WARNING', 'SAFE'].map(statusFilter => {
              const filtered = dashboardData.subjects.filter(s => calcStats(s, targetCriteria).status === statusFilter)
              if (filtered.length === 0) return null
              return (
                <div key={statusFilter}>
                  <h2 className={`text-xs font-bold tracking-widest uppercase mb-3 flex items-center gap-2 ${
                    statusFilter === 'DANGER' ? 'text-red-busy' :
                    statusFilter === 'WARNING' ? 'text-amber-soon' : 'text-emerald-free'
                  }`}>
                    {statusFilter === 'DANGER' ? <AlertTriangle size={13} /> :
                     statusFilter === 'WARNING' ? <AlertTriangle size={13} /> : <ShieldCheck size={13} />}
                    {statusFilter === 'DANGER' ? `🚨 Detention Risk (<${targetCriteria}%) — Recovery Required` :
                     statusFilter === 'WARNING' ? `⚡ Low Margin — Protect Safety Buffer` : `🛡️ Compliant (≥${targetCriteria}%) — Safe Buffer`}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {filtered.map(record => (
                      <SubjectDashCard key={`${record.subject}_${record.session_type}`} record={record} targetCriteria={targetCriteria} />
                    ))}
                  </div>
                </div>
              )
            })}
            {/* ── Exceptions Panel ── */}
            <ExceptionPanel
              user={user}
              subjects={dashboardData.subjects.map(s => ({ subject: s.subject, session_type: s.session_type }))}
              campusId={selectedCampus?.id}
              classCode={dashboardData.subjects[0]?.class_code}
              onRefreshDashboard={fetchDashboard}
            />

            {/* Disclaimer */}
            <div className="glass-card p-4 border border-slate-border/40 flex items-start gap-3">
              <Info size={15} className="text-text-muted flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted leading-relaxed">
                Predictions are based on your entered ERP data and your campus academic calendar.
                Use <strong className="text-violet-primary">Lecture Exceptions</strong> to report cancelled or extra lectures — this will update your projections automatically.
                Pending attendance is shown as a risk range.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
