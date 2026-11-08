import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Clock,
  MapPin,
  Search,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
} from 'lucide-react'
import cosenLogo from '../assets/cosen_brand_logo2.svg'
import Hero3D from '../components/Hero3D'
import PixelBlast from '../components/PixelBlast'
import ParticleText from '../components/ParticleText'
import ContributorsMarquee from '../components/ContributorsMarquee'
import PushNotificationManager from '../components/PushNotificationManager'
import CampusLoginModal from '../components/CampusLoginModal'
import { useAuth } from '../context/AuthContext'
import { isUniversityEmail } from '../utils/authUtils'

/* ─── Mouse-tracking 3D tilt on the hero mockup ─── */
function useTilt(strength = 12) {
  const ref = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      setTilt({ x: -dy * strength, y: dx * strength })
    }
    const onLeave = () => setTilt({ x: 4, y: -8 }) // resting tilt
    window.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [strength])

  return { ref, tilt }
}

/* ─── Beacon pulse dot ─── */
function Dot({ color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10, flexShrink: 0 }}>
      <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: color, opacity: 0.35, animation: 'beacon-pulse 1.8s ease-out infinite' }} />
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
    </span>
  )
}

/* ─── Status pill ─── */
function Pill({ status }) {
  const map = {
    free: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: 'Free' },
    'in-use': { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', label: 'In Use' },
    'busy-soon': { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: 'Busy Soon' },
  }
  const s = map[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: s.bg, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 700, color: s.color }}>
      <Dot color={s.color} />
      {s.label}
    </span>
  )
}

/* ─── The central 3D UI Mockup card ─── */
const ROOMS = [
  { name: 'B006', building: 'Block B', subject: 'Discrete Structures', teacher: 'Ms. Geetanjali Rathod', time: '08:00 – 08:55', status: 'free' },
  { name: 'NB201', building: 'Block NB', subject: 'Data Structures', teacher: 'Dr. Amit Shah', time: '08:55 – 09:50', status: 'in-use' },
  { name: 'A104', building: 'Block A', subject: 'Engineering Mathematics', teacher: 'Prof. Priya Desai', time: '10:00 – 10:55', status: 'busy-soon' },
  { name: 'C302', building: 'Block C', subject: 'Operating Systems', teacher: 'Mr. Rohan Mehta', time: '11:00 – 11:55', status: 'in-use' },
  { name: 'D201', building: 'Block D', subject: 'Computer Networks', teacher: 'Dr. Sneha Patel', time: '12:00 – 12:55', status: 'free' },
]

function MockupCard({ tilt }) {
  const freeCount = ROOMS.filter(r => r.status === 'free').length
  const inUseCount = ROOMS.filter(r => r.status === 'in-use').length

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 580,
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.12s ease-out',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {/* Shadow layer for 3D depth */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 20,
        background: 'rgba(99,91,255,0.25)',
        filter: 'blur(40px)',
        transform: 'translateZ(-40px) scale(0.95)',
        pointerEvents: 'none',
      }} />

      {/* Main card */}
      <div
        style={{
          background: 'linear-gradient(145deg, rgba(22,32,60,0.97) 0%, rgba(12,18,40,0.99) 100%)',
          border: '1px solid rgba(99,91,255,0.25)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,91,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* App top bar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(51,65,85,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,22,48,0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Traffic light dots */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['#EF4444','#F59E0B','#10B981'].map((c,i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace' }}>timetable-detector.app / finder</span>
          </div>
          {/* Live badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'dot-blink 1.5s ease-in-out infinite', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>LIVE</span>
          </div>
        </div>

        {/* Filter row */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(51,65,85,0.4)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'rgba(99,91,255,0.15)', border: '1px solid rgba(99,91,255,0.3)' }}>
            <Building2 size={13} style={{ color: '#635BFF' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#635BFF' }}>Block B</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(51,65,85,0.4)' }}>
            <Clock size={13} style={{ color: '#94A3B8' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>TUE · 09:30</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 11, fontWeight: 700, color: '#10B981' }}>
              {freeCount} Free
            </span>
            <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, fontWeight: 700, color: '#EF4444' }}>
              {inUseCount} In Use
            </span>
          </div>
        </div>

        {/* Room rows */}
        <div style={{ padding: '8px 0' }}>
          {ROOMS.map((room, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 20px',
                borderBottom: i < ROOMS.length - 1 ? '1px solid rgba(51,65,85,0.25)' : 'none',
                background: i === 1 ? 'rgba(99,91,255,0.06)' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              {/* Room number */}
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.02em' }}>{room.name}</span>
              </div>
              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {room.subject}
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{room.teacher} · {room.time}</div>
              </div>
              {/* Status pill */}
              <Pill status={room.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Floating orbit cards ─── */
function OrbitCard({ style, animStyle, children }) {
  return (
    <div
      style={{
        position: 'absolute',
        ...style,
        zIndex: 20,
        pointerEvents: 'none',
        ...animStyle,
      }}
    >
      <div
        style={{
          background: 'rgba(12,18,40,0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99,91,255,0.2)',
          borderRadius: 14,
          padding: '12px 16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
          minWidth: 170,
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ─── Step card ─── */
function StepCard({ number, icon: Icon, title, desc, delay }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: 0,
        animation: `fade-up 0.7s ease ${delay}s forwards`,
        background: hovered ? 'rgba(99,91,255,0.06)' : 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(16px)',
        border: hovered ? '1px solid rgba(99,91,255,0.4)' : '1px solid rgba(51,65,85,0.4)',
        borderRadius: 18,
        padding: '28px 24px',
        position: 'relative',
        overflow: 'hidden',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? '0 20px 60px rgba(99,91,255,0.12)' : 'none',
        transition: 'all 0.3s ease',
        cursor: 'default',
      }}
    >
      <div style={{ position: 'absolute', top: -12, right: 12, fontSize: 88, fontWeight: 900, color: 'rgba(99,91,255,0.05)', lineHeight: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', userSelect: 'none' }}>
        {number}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,91,255,0.12)', border: '1px solid rgba(99,91,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={20} style={{ color: '#635BFF' }} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif', margin: 0 }}>{title}</h3>
      </div>
      <p style={{ fontSize: 13.5, color: '#94A3B8', lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  )
}

/* ─── Live ticker ─── */
const LIVE_ROOMS = [
  { room: 'B006', status: 'free', color: '#10B981' },
  { room: 'NB201', status: 'in-use', color: '#EF4444' },
  { room: 'A102', status: 'free', color: '#10B981' },
  { room: 'D304', status: 'busy-soon', color: '#F59E0B' },
  { room: 'C201', status: 'free', color: '#10B981' },
]
function LiveTicker() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setIdx(i => (i + 1) % LIVE_ROOMS.length), 2000)
    return () => clearInterval(iv)
  }, [])
  const r = LIVE_ROOMS[idx]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 18px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,91,255,0.2)', borderRadius: 999, backdropFilter: 'blur(16px)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'dot-blink 1.2s ease-in-out infinite', display: 'inline-block' }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em' }}>LIVE</span>
      <span style={{ fontSize: 12, color: '#475569' }}>·</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{r.room}</span>
      <Dot color={r.color} />
      <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.status === 'free' ? 'Free' : r.status === 'in-use' ? 'In Use' : 'Busy Soon'}</span>
    </div>
  )
}

/* ─── Scroll-driven "How it Works" ─── */
const STEPS = [
  {
    num: '01', label: 'Pick Your Building',
    title: 'Select your campus block',
    desc: 'All buildings with uploaded timetables appear in a dropdown. Block A, B, NB, C, D, Lab — one tap to filter the whole campus.',
    accent: '#635BFF', accentBg: 'rgba(99,91,255,0.1)', accentBorder: 'rgba(99,91,255,0.3)', visual: 'building',
  },
  {
    num: '02', label: 'Set Day & Time',
    title: 'Auto-sync or dial in any time',
    desc: 'The app detects your current day and time automatically. Override it to plan ahead — check availability for any future slot.',
    accent: '#8B5CF6', accentBg: 'rgba(139,92,246,0.1)', accentBorder: 'rgba(139,92,246,0.3)', visual: 'time',
  },
  {
    num: '03', label: 'See Live Room Status',
    title: 'Know every room at a glance',
    desc: 'Each room shows a live badge — Free 🟢, Busy Soon 🟡, In Use 🔴. Tap to see the full day schedule for that classroom.',
    accent: '#10B981', accentBg: 'rgba(16,185,129,0.1)', accentBorder: 'rgba(16,185,129,0.3)', visual: 'rooms',
  },
]

function VisualBuilding() {
  const blocks = [{ id: 'A' }, { id: 'B' }, { id: 'NB' }, { id: 'C' }, { id: 'D' }, { id: 'Lab' }]
  const [selected, setSelected] = useState('B')
  return (
    <div>
      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Select Building</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {blocks.map(b => {
          const isSel = selected === b.id
          return (
            <button key={b.id} onClick={() => setSelected(b.id)} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${isSel ? '#635BFF' : 'rgba(51,65,85,0.5)'}`, background: isSel ? 'rgba(99,91,255,0.15)' : 'rgba(15,23,42,0.6)', color: isSel ? '#635BFF' : '#94A3B8', fontWeight: isSel ? 700 : 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isSel ? '0 0 14px rgba(99,91,255,0.2)' : 'none', transform: isSel ? 'scale(1.06)' : 'scale(1)' }}>
              Block {b.id}
            </button>
          )
        })}
      </div>
      <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(99,91,255,0.06)', border: '1px solid rgba(99,91,255,0.15)', borderRadius: 12 }}>
        <div style={{ fontSize: 12, color: '#635BFF', fontWeight: 700 }}>Block {selected} selected</div>
        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Ready to scan room availability</div>
      </div>
    </div>
  )
}

function VisualTime() {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const [day, setDay] = useState('TUE')
  const [time, setTime] = useState('09:30')
  return (
    <div>
      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Select Day</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {days.map(d => {
          const isSel = day === d
          return <button key={d} onClick={() => setDay(d)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${isSel ? '#8B5CF6' : 'rgba(51,65,85,0.5)'}`, background: isSel ? 'rgba(139,92,246,0.15)' : 'rgba(15,23,42,0.6)', color: isSel ? '#8B5CF6' : '#94A3B8', fontWeight: isSel ? 700 : 500, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isSel ? '0 0 12px rgba(139,92,246,0.2)' : 'none' }}>{d}</button>
        })}
      </div>
      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Time</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, padding: '10px 14px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 10 }}>
          <Clock size={14} style={{ color: '#8B5CF6' }} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#F8FAFC', fontSize: 14, fontWeight: 600, outline: 'none', width: '100%', colorScheme: 'dark' }} />
        </div>
        <div style={{ padding: '10px 12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, fontSize: 11, color: '#8B5CF6', fontWeight: 700, cursor: 'pointer' }}>Now ↺</div>
      </div>
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 10 }}>
        <span style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600 }}>{day} · {time}</span>
        <span style={{ fontSize: 11, color: '#64748B', marginLeft: 8 }}>Scanning availability…</span>
      </div>
    </div>
  )
}

const DEMO_ROOMS = [
  { name: 'B006', status: 'free', info: 'Next: OS Lab at 11:00' },
  { name: 'NB201', status: 'in-use', info: 'Data Structures · Dr. Amit Shah' },
  { name: 'A104', status: 'busy-soon', info: 'Eng. Math starts in 12 min' },
  { name: 'D201', status: 'free', info: 'Free until 12:00' },
]
const SC = {
  free: { color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', label: 'Free' },
  'in-use': { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: 'In Use' },
  'busy-soon': { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'Busy Soon' },
}
function VisualRooms() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {DEMO_ROOMS.map((room, i) => {
        const s = SC[room.status]
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, animation: `fade-up 0.5s ease ${i * 0.09}s both` }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(51,65,85,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#F8FAFC' }}>{room.name}</span>
            </div>
            <div style={{ flex: 1, fontSize: 11, color: '#94A3B8' }}>{room.info}</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: s.bg, border: `1px solid ${s.border}`, fontSize: 10, fontWeight: 700, color: s.color, flexShrink: 0 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block', animation: room.status === 'in-use' ? 'dot-blink 1.5s ease-in-out infinite' : 'none' }} />
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ScrollSteps() {
  const containerRef = useRef(null)
  const [step, setStep] = useState(0)
  const [prog, setProg] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const totalH = el.offsetHeight - window.innerHeight
      const scrolled = -rect.top
      const raw = Math.max(0, Math.min(0.999, scrolled / totalH))
      const stepRaw = raw * 3
      setStep(Math.min(2, Math.floor(stepRaw)))
      setProg(stepRaw - Math.floor(stepRaw))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cur = STEPS[step]

  return (
    <section id="how-it-works" ref={containerRef} style={{ position: 'relative', height: '350vh', borderTop: '1px solid rgba(51,65,85,0.3)' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>

        {/* Dynamic background glow per step */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', transition: 'background 0.9s ease', background: `radial-gradient(ellipse 55% 50% at 72% 50%, ${cur.accent}15 0%, transparent 70%)` }} />

        <div style={{ maxWidth: 1140, margin: '0 auto', width: '100%', padding: '0 24px', position: 'relative', zIndex: 2 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#635BFF', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Three steps, zero friction</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.1 }}>
              How it <span style={{ background: 'linear-gradient(125deg, #635BFF, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>works</span>
            </h2>
          </div>

          {/* Progress stepper */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, marginBottom: 44 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: `2px solid ${i <= step ? s.accent : 'rgba(51,65,85,0.4)'}`,
                    background: i < step ? s.accent : i === step ? `${s.accent}18` : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: i < step ? '#fff' : i === step ? s.accent : '#64748B',
                    transition: 'all 0.5s ease',
                    boxShadow: i === step ? `0 0 20px ${s.accent}50` : 'none',
                  }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, color: i <= step ? s.accent : '#475569', fontWeight: 600, whiteSpace: 'nowrap', transition: 'color 0.4s' }}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{ width: 80, height: 2, background: 'rgba(51,65,85,0.35)', margin: '0 8px', marginBottom: 18, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: i < step ? '100%' : i === step ? `${prog * 100}%` : '0%', background: s.accent, transition: 'width 0.1s linear', borderRadius: 2 }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Two columns: text left, 3D UI right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>

            {/* Left text */}
            <div key={`text-${step}`} style={{ animation: 'fade-up 0.5s ease both' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 13px', borderRadius: 999, background: cur.accentBg, border: `1px solid ${cur.accentBorder}`, marginBottom: 20 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: cur.accent, letterSpacing: '0.12em' }}>STEP {cur.num}</span>
                <span style={{ fontSize: 10, color: cur.accent, opacity: 0.5 }}>·</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: cur.accent, opacity: 0.8 }}>{cur.label}</span>
              </div>
              <h3 style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.4rem)', fontWeight: 800, color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.2, marginBottom: 18, letterSpacing: '-0.02em' }}>
                {cur.title}
              </h3>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.78, marginBottom: 28, maxWidth: 400 }}>
                {cur.desc}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? cur.accent : 'rgba(51,65,85,0.5)', transition: 'all 0.4s ease' }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: '#475569' }}>Scroll to continue</span>
              </div>
            </div>

            {/* Right: 3D app panel */}
            <div style={{ perspective: 900 }}>
              <div key={`panel-${step}`} style={{ transform: 'perspective(900px) rotateY(-7deg) rotateX(3deg)', transition: 'transform 0.7s ease, box-shadow 0.7s ease', animation: 'fade-up 0.6s ease both' }}>
                <div style={{ background: 'linear-gradient(145deg, rgba(20,30,56,0.98), rgba(10,16,36,0.99))', border: `1px solid ${cur.accentBorder}`, borderRadius: 18, overflow: 'hidden', boxShadow: `0 30px 70px rgba(0,0,0,0.55), 0 0 0 1px ${cur.accentBorder}, 0 0 50px ${cur.accent}18`, transition: 'border-color 0.6s, box-shadow 0.6s' }}>
                  {/* Chrome bar */}
                  <div style={{ padding: '11px 16px', borderBottom: '1px solid rgba(51,65,85,0.45)', background: 'rgba(8,13,32,0.85)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {['#EF4444','#F59E0B','#10B981'].map((c,i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
                    </div>
                    <div style={{ flex: 1, height: 18, background: 'rgba(30,41,59,0.5)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>timetable-detector / finder</span>
                    </div>
                    <div style={{ fontSize: 9, color: cur.accent, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: cur.accentBg, border: `1px solid ${cur.accentBorder}` }}>LIVE</div>
                  </div>
                  {/* Step label row */}
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(51,65,85,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: cur.accent, display: 'inline-block', animation: 'dot-blink 1.5s ease-in-out infinite' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: cur.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step {parseInt(cur.num)} — {cur.label}</span>
                  </div>
                  {/* Dynamic visual */}
                  <div style={{ padding: 16 }}>
                    {step === 0 && <VisualBuilding />}
                    {step === 1 && <VisualTime />}
                    {step === 2 && <VisualRooms />}
                  </div>
                </div>
                <div style={{ height: 16, margin: '0 12%', background: `${cur.accent}25`, filter: 'blur(16px)', borderRadius: '50%', marginTop: -8 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      navigate('/sendiyou', { replace: true })
    }
  }, [user, loading, navigate])

  const { ref, tilt } = useTilt(10)

  // Start with a resting tilt that looks natural
  const [ready, setReady] = useState(false)
  
  // Login modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)

  // Smart scroll tracking for ParticleText ambient background
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setTimeout(() => setReady(true), 100)

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true)
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  useEffect(() => {
    const handleTrigger = () => handleInstallClick()
    window.addEventListener('trigger-pwa-install', handleTrigger)
    return () => window.removeEventListener('trigger-pwa-install', handleTrigger)
  }, [deferredPrompt])

  const activeTilt = ready ? tilt : { x: 6, y: -10 }

  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#060C20' }} />
  }

  return (
    <div style={{ overflowX: 'hidden', background: 'transparent' }}>
      {!isStandalone && deferredPrompt && (
        <button
          onClick={handleInstallClick}
          style={{
            position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', background: 'rgba(15,23,42,0.85)',
            border: '1px solid rgba(99,91,255,0.5)', borderRadius: 999,
            color: '#F8FAFC', fontWeight: 700, fontSize: 14,
            backdropFilter: 'blur(12px)', cursor: 'pointer',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(99,91,255,0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,91,255,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.8)' }}
        >
          <Zap size={16} color="#10B981" /> Download App
        </button>
      )}

      {/* ── PixelBlast WebGL Dithered Background ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none', background: '#060C20' }}>
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#635BFF"
          patternScale={2}
          patternDensity={1}
          pixelSizeJitter={0}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid={false}
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.5}
          edgeFade={0.25}
          transparent
          style={{ pointerEvents: 'auto' }}
        />
      </div>

      {/* ── 🌌 Compact Top Interactive ParticleText Bar ── */}
      <section style={{
        position: 'relative',
        zIndex: 5,
        width: '100%',
        height: 95,
        minHeight: 75,
        marginTop: 64, // Clears fixed Navbar (h-16) so it is never hidden or overlapped
        background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(99,91,255,0.1) 0%, rgba(6,12,32,0.7) 100%)',
        borderBottom: '1px solid rgba(99,91,255,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <ParticleText
          text="TIMBEL"
          particleSize={2.0}
          density={2.4}
          color="#ffffff"
          highlightColor="#818cf8"
          scatter={60}
          gatherDuration={1000}
          stagger={160}
          pointerRepel={28}
          repelRadius={70}
          idleDrift={0.35}
          trigger="hover"
          fontSize="clamp(1.8rem, 4.5vw, 2.8rem)"
          fontWeight={800}
          fontFamily="'Inter', -apple-system, sans-serif"
          glow={false}
          style={{ width: '100%', height: '100%', cursor: 'pointer' }}
        />
      </section>
      
      <Hero3D onLoginClick={() => setIsLoginModalOpen(true)} onDownloadClick={handleInstallClick} />

      {/* ── 🎬 Demo Video Showcase ── */}
      <section style={{ padding: '40px 24px 40px', position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%',
          maxWidth: 1040,
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99,91,255,0.25)',
          borderRadius: 24,
          padding: 12,
          boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 40px rgba(99,91,255,0.1)',
          transform: 'translateY(-20px)',
        }}>
          {/* Mac-like Browser Dots */}
          <div style={{ display: 'flex', gap: 6, padding: '8px 12px 16px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
          </div>
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#060C20',
            border: '1px solid rgba(51,65,85,0.5)'
          }}>
            <video 
              autoPlay 
              muted 
              loop 
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
            >
              <source src="https://res.cloudinary.com/dga14nmzn/video/upload/v1782496099/SaaS_Launch_Video_Browser_Window_Showcase_qporwb.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* ── 3D Tilting App Mockup (from original design) ── */}
      <section ref={ref} style={{ padding: '80px 24px 100px', position: 'relative', background: 'transparent', overflow: 'hidden' }}>
        {/* ── Background: radial mesh + grid ── */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Subtle dot grid */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.35,
            backgroundImage: 'radial-gradient(rgba(99,91,255,0.25) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
          }} />
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#635BFF', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Interactive Preview</p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Your Campus Dashboard
            </h2>
          </div>

          {/* Live Status Ticker */}
          <div style={{ marginBottom: 40 }}>
            <LiveTicker />
          </div>
          
          {/* ── 3D Tilting Mockup with floating orbit cards ── */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 700,
            }}
          >
            {/* Floating orbit card — top left: summary stats */}
            <OrbitCard
              style={{ top: -30, left: -20, zIndex: 20 }}
              animStyle={{ animation: 'float-card-1 6s ease-in-out infinite' }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' }}>Right Now</div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[{ val: '8', label: 'Free', c: '#10B981' }, { val: '5', label: 'In Use', c: '#EF4444' }, { val: '2', label: 'Soon', c: '#F59E0B' }].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.c, fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </OrbitCard>

            {/* Floating card — top right: next free room */}
            <OrbitCard
              style={{ top: -20, right: -16, zIndex: 20 }}
              animStyle={{ animation: 'float-card-2 7s ease-in-out infinite 1s' }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: '#10B981', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Dot color="#10B981" /> Nearest Free Room
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>B006</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Block B · Free all morning</div>
            </OrbitCard>

            {/* Floating card — bottom left: clock sync */}
            <OrbitCard
              style={{ bottom: -24, left: -10, zIndex: 20 }}
              animStyle={{ animation: 'float-card-3 8s ease-in-out infinite 0.5s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,91,255,0.12)', border: '1px solid rgba(99,91,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={16} style={{ color: '#635BFF' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>Auto Time Sync</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Always up-to-date</div>
                </div>
              </div>
            </OrbitCard>

            {/* Floating card — bottom right: buildings */}
            <OrbitCard
              style={{ bottom: -16, right: -12, zIndex: 20 }}
              animStyle={{ animation: 'float-card-1 9s ease-in-out infinite 2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={16} style={{ color: '#10B981' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>6 Campus Blocks</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>1,797 slots tracked</div>
                </div>
              </div>
            </OrbitCard>

            {/* The tilting mockup itself */}
            <div style={{ padding: '30px 30px 40px' }}>
              <MockupCard tilt={activeTilt} />
            </div>

            {/* Glow beneath the card */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: 40, background: 'rgba(99,91,255,0.25)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }} />
          </div>
          
        </div>
      </section>

      {/* ═══════════════════════════════ POWERED BY COSEN ═══════════════════════════════ */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(51,65,85,0.3)' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <div style={{
            position: 'relative', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,91,255,0.18)',
            borderRadius: 24, padding: 'clamp(32px, 6vw, 64px)', textAlign: 'center',
            backdropFilter: 'blur(20px)', overflow: 'hidden', boxShadow: '0 0 80px rgba(99,91,255,0.07)',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: 'radial-gradient(circle, rgba(99,91,255,0.12), transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -60, left: -60, width: 180, height: 180, background: 'radial-gradient(circle, rgba(16,185,129,0.09), transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <img src={cosenLogo} alt="Cosen" style={{ height: 72, width: 'auto', margin: '0 auto 22px', opacity: 0.9, display: 'block' }} />
              <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 800, color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 14 }}>
                Powered by <span style={{ background: 'linear-gradient(125deg, #635BFF, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Cosen</span>
              </h2>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7, maxWidth: 460, margin: '0 auto 30px' }}>
                Timetable Detector is a proud utility born from <strong style={{ color: '#F8FAFC' }}>Cosen</strong> — the ultimate campus peer-to-peer platform connecting students for resources, buy/sell, and now finding free spaces.
              </p>
              <a href="https://cosen.online" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', border: '1px solid rgba(99,91,255,0.4)', color: '#F8FAFC', background: 'rgba(99,91,255,0.1)', borderRadius: 999, fontWeight: 500, fontSize: 15, textDecoration: 'none', transition: 'all 0.25s ease', letterSpacing: '-0.02em' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,91,255,0.2)'; e.currentTarget.style.borderColor = '#7C75FF' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,91,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,91,255,0.4)' }}>
                <Users size={16} /> Explore Cosen <ArrowRight size={16} />
              </a>

              {/* ── Secondary Demo Video ── */}
              <div id="secondary-demo-video" style={{
                marginTop: 48,
                position: 'relative',
                width: '100%',
                borderRadius: 16,
                overflow: 'hidden',
                background: '#060C20',
                border: '1px solid rgba(51,65,85,0.5)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}>
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
                >
                  <source src="https://res.cloudinary.com/dga14nmzn/video/upload/v1782495939/3D_Mobile_App_Character_Showcase_z2zt4f.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

            </div>
          </div>
        </div>
      </section>

      <CampusLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* ═══════════════════════════════ CONTRIBUTORS ═══════════════════════════════ */}
      <ContributorsMarquee />

      {/* ═══════════════════════════════ FINAL CTA ═══════════════════════════════ */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid rgba(51,65,85,0.3)', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, rgba(99,91,255,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5.5vw, 3.8rem)', fontWeight: 900, color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: 16 }}>
            Ready to claim<br />
            <span style={{ background: 'linear-gradient(125deg, #635BFF, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>your free room?</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', marginBottom: 40 }}>Login with your university email to get started.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 40px', background: '#635BFF', color: '#fff', borderRadius: 999, fontWeight: 600, fontSize: 16, textDecoration: 'none', border: 'none', cursor: 'pointer', boxShadow: '0 8px 30px rgba(99,91,255,0.25)', transition: 'all 0.25s ease', letterSpacing: '-0.02em' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,91,255,0.4)'; e.currentTarget.style.background = '#7C75FF' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,91,255,0.25)'; e.currentTarget.style.background = '#635BFF' }}
            >
              <Zap size={18} /> Find a Free Room Now <ArrowRight size={18} />
            </button>
          </div>
          
          <div style={{ marginTop: 24 }}>
            <PushNotificationManager />
          </div>
        </div>
      </section>
    </div>
  )
}
