import { useRef, useState, useMemo, useEffect } from "react";
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = {
  occupied: "#EF4444",
  busySoon:  "#F59E0B",
  free:      "#10B981",
  violet:    "#635BFF",
  bg:        "#060C20",
};

const GRID_COLS = 5;
const GRID_ROWS = 4;
const CUBE_SIZE = 0.72;
const GAP       = 1.05;

function buildGrid() {
  const cells = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const idx = r * GRID_COLS + c;
      const isFree = idx === 7;
      const roll   = Math.random();
      const state  = isFree ? "free" : roll < 0.55 ? "occupied" : "busySoon";
      cells.push({
        id:    idx,
        col:   c,
        row:   r,
        state,
        isFree,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.6,
      });
    }
  }
  return cells;
}

// ─── Single Classroom Cube ─────────────────────────────────────────────────────
function ClassroomCube({ col, row, state, isFree, phase, speed, mouseRef }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const clock   = useRef(0);

  const baseX = (col - (GRID_COLS - 1) / 2) * GAP;
  const baseY = (row - (GRID_ROWS - 1) / 2) * GAP * 0.6;
  const baseZ = -(col + row) * 0.18;

  const color = COLORS[state];
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    clock.current += delta;
    const t = clock.current;
    if (!meshRef.current) return;

    const mx = mouseRef.current.x * 0.4;
    const my = mouseRef.current.y * 0.25;

    if (isFree) {
      const floatY = Math.sin(t * speed + phase) * 0.12;
      const floatZ = 0.35 + Math.sin(t * 0.7) * 0.08;
      meshRef.current.position.set(baseX + mx, baseY + floatY + my + 0.18, baseZ + floatZ);
      meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.18 + mx * 0.3;
      meshRef.current.rotation.x = -0.15 + my * 0.2;
      meshRef.current.scale.setScalar(1.18 + Math.sin(t * 1.2) * 0.04);
    } else {
      const pulse = Math.sin(t * speed + phase) * 0.025;
      meshRef.current.position.set(
        baseX + mx * (0.5 + col * 0.06),
        baseY + pulse + my * (0.5 + row * 0.06),
        baseZ
      );
      meshRef.current.scale.setScalar(1.0 + pulse * 0.3);
      meshRef.current.rotation.y = mx * 0.12;
      meshRef.current.rotation.x = my * 0.08;
    }

    if (glowRef.current) {
      const g = 1.3 + Math.sin(t * speed * 1.5 + phase) * 0.3;
      glowRef.current.scale.setScalar(g);
      glowRef.current.material.opacity = isFree
        ? 0.18 + Math.sin(t * 1.8) * 0.06
        : 0.07 + Math.sin(t * speed + phase) * 0.03;
    }
  });

  const emissiveIntensity = isFree ? 2.2 : hovered ? 1.4 : 0.55;

  return (
    <group>
      <mesh ref={glowRef} position={[baseX, baseY, baseZ - 0.02]}>
        <boxGeometry args={[CUBE_SIZE * 1.5, CUBE_SIZE * 1.5, CUBE_SIZE * 1.5]} />
        <meshBasicMaterial color={color} transparent opacity={0.09} side={THREE.BackSide} />
      </mesh>

      <mesh
        ref={meshRef}
        position={[baseX, baseY, baseZ]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial
          color={isFree ? "#0a1628" : "#0d1830"}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          metalness={0.65}
          roughness={0.18}
          transparent
          opacity={0.82}
        />
      </mesh>

      <mesh position={[baseX, baseY, baseZ]}>
        <boxGeometry args={[CUBE_SIZE + 0.01, CUBE_SIZE + 0.01, CUBE_SIZE + 0.01]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={isFree ? 0.55 : 0.18} />
      </mesh>

      <mesh position={[baseX, baseY + CUBE_SIZE / 2 + 0.04, baseZ]}>
        <sphereGeometry args={[0.065, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isFree ? 4 : 1.8}
        />
      </mesh>
    </group>
  );
}

// ─── Floating Orbs ────────────────────────────────────────────────────────────
function FloatingOrbs({ mouseRef }) {
  const orbs = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 5,
      z: (Math.random() - 0.5) * 3 - 1,
      r: 0.04 + Math.random() * 0.09,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
    })), []
  );

  const meshRefs = useRef([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mx = mouseRef.current.x * 0.5;
    const my = mouseRef.current.y * 0.3;
    orbs.forEach((o, i) => {
      const ref = meshRefs.current[i];
      if (!ref) return;
      ref.position.y = o.y + Math.sin(t * o.speed + o.phase) * 0.25 + my;
      ref.position.x = o.x + Math.cos(t * o.speed * 0.7 + o.phase) * 0.15 + mx;
    });
  });

  return (
    <>
      {orbs.map((o, i) => (
        <mesh key={o.id} ref={el => (meshRefs.current[i] = el)} position={[o.x, o.y, o.z]}>
          <sphereGeometry args={[o.r, 8, 8]} />
          <meshStandardMaterial
            color={COLORS.violet}
            emissive={COLORS.violet}
            emissiveIntensity={2.5}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── Ring Accent ──────────────────────────────────────────────────────────────
function RingAccent({ mouseRef }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x = -0.4 + mouseRef.current.y * 0.12 + Math.sin(t * 0.3) * 0.04;
    ref.current.rotation.y = mouseRef.current.x * 0.15 + t * 0.06;
    ref.current.rotation.z = t * 0.04;
  });

  return (
    <mesh ref={ref} position={[0, 0, -2.5]}>
      <torusGeometry args={[3.8, 0.025, 16, 100]} />
      <meshStandardMaterial
        color={COLORS.violet}
        emissive={COLORS.violet}
        emissiveIntensity={1.2}
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

// ─── Inner 3D Scene ───────────────────────────────────────────────────────────
function Scene({ mouseRef }) {
  const cells = useMemo(() => buildGrid(), []);
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.x = -0.28 + mouseRef.current.y * 0.08;
    groupRef.current.rotation.y =  0.22 + mouseRef.current.x * 0.12;
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 4, 3]}  color="#635BFF" intensity={18} distance={14} decay={2} />
      <pointLight position={[3, -2, 2]} color="#10B981" intensity={22} distance={12} decay={2} />
      <pointLight position={[-3, 2, 2]} color="#EF4444" intensity={10} distance={12} decay={2} />
      <pointLight position={[0, 0, 5]}  color="#ffffff" intensity={5}  distance={10} decay={2} />

      <RingAccent mouseRef={mouseRef} />
      <FloatingOrbs mouseRef={mouseRef} />

      <group ref={groupRef}>
        {cells.map(cell => (
          <ClassroomCube key={cell.id} {...cell} mouseRef={mouseRef} />
        ))}
      </group>

      <Sparkles
        count={90}
        scale={[9, 6, 4]}
        size={1.4}
        speed={0.3}
        opacity={0.55}
        color="#635BFF"
        position={[0, 0, -1]}
      />
    </>
  );
}

// ─── Legend Badge ─────────────────────────────────────────────────────────────
function LegendBadge({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{
        width: 10, height: 10, borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
        display: "inline-block",
        flexShrink: 0,
      }} />
      <span style={{
        color: "#94a3b8",
        fontSize: 12,
        fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
        letterSpacing: "0.02em",
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
function useTypewriter(words, typingSpeed = 100, deletingSpeed = 50, pauseDelay = 2000) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    let timer;

    if (isDeleting) {
      if (text === "") {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      } else {
        timer = setTimeout(() => {
          setText(currentWord.substring(0, text.length - 1));
        }, deletingSpeed);
      }
    } else {
      if (text === currentWord) {
        timer = setTimeout(() => setIsDeleting(true), pauseDelay);
      } else {
        timer = setTimeout(() => {
          setText(currentWord.substring(0, text.length + 1));
        }, typingSpeed);
      }
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDelay]);

  return text;
}

export default function Hero3D({ onLoginClick, onDownloadClick }) {
  // Mobile check for layout adjusting
  const [isMobile, setIsMobile] = useState(false);
  const mouseRef     = useRef({ x: 0, y: 0 });
  const containerRef = useRef();
  const typedText = useTypewriter(["free classes.", "teacher status.", "time table."]);

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current.x = ((e.clientX - rect.left)  / rect.width  - 0.5) * 2;
    mouseRef.current.y = ((e.clientY - rect.top)   / rect.height - 0.5) * -2;
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: 0, y: 0 };
  };

  return (
    <section
      style={{
        minHeight: "calc(100vh - 174px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px 60px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Subtle radial bg glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 55% at 65% 50%, rgba(99,91,255,0.09) 0%, transparent 70%)",
      }} />

      {/* Max-width wrapper */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: "64px",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* ── Left: Text content ── */}
        <div style={{ zIndex: 10, animation: "fade-up 0.8s ease forwards" }}>
          {/* Pill badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: '6px 14px', background: 'rgba(99,91,255,0.08)', border: '1px solid rgba(99,91,255,0.25)', borderRadius: 999, backdropFilter: 'blur(10px)',
            marginBottom: 24,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#635BFF",
              boxShadow: "0 0 8px rgba(99,91,255,0.6)",
              display: "inline-block",
              animation: "dot-blink 1.5s ease-in-out infinite"
            }} />
            <span style={{ color: "#818cf8", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: 'uppercase' }}>
              Timetable Detector
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            margin: "0 0 20px",
            fontSize: "clamp(2.4rem, 6vw, 4.8rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            color: "#f8fafc",
            letterSpacing: "-0.03em",
            fontFamily: "'Inter', sans-serif"
          }}>
            Only one click,<br />
            Find{" "}
            <span style={{ whiteSpace: "nowrap" }}>
              <span style={{
                background: "linear-gradient(90deg, #a5b4fc 0%, #635BFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {typedText}
              </span>
              <span className="animate-pulse" style={{ color: "#635BFF" }}>|</span>
            </span>
          </h1>

          {/* Subtext */}
          <p style={{
            margin: "0 0 36px",
            fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
            lineHeight: 1.7,
            color: "#f1f5f9",
            fontWeight: 500,
            maxWidth: 520,
            textShadow: "0px 2px 4px rgba(0,0,0,0.3)"
          }}>
            Why wander the halls? Our system syncs with your live college schedule to instantly show you which classrooms are free right now, and which ones are about to fill up.
          </p>

          {/* CTA */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={onDownloadClick}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 28px",
                borderRadius: 12,
                background: "#635BFF",
                color: "#fff",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(99,91,255,0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,91,255,0.4)'; e.currentTarget.style.background = '#5249ea'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,91,255,0.3)'; e.currentTarget.style.background = '#635BFF'; }}
            >
              Download App
            </button>

            <button
              onClick={onLoginClick}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 24px",
                borderRadius: 12,
                background: "transparent",
                border: "1px solid rgba(148,163,184,0.3)",
                color: "#cbd5e1",
                fontWeight: 500,
                fontSize: 15,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.6)'; e.currentTarget.style.color = '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              Login
            </button>
          </div>

        </div>

        {/* ── Right: 3D Canvas ── */}
        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          maxWidth: 550,
          margin: "0 auto",
          borderRadius: 24,
          overflow: "hidden",
          border: "1px solid rgba(99,91,255,0.15)",
          background: "radial-gradient(ellipse at 60% 40%, rgba(99,91,255,0.07) 0%, transparent 70%)",
          boxShadow: "0 0 80px rgba(99,91,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
          animation: "fade-up 1s ease forwards 0.2s"
        }}>
          {/* Corner accent lines */}
          {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h]) => (
            <div key={`${v}${h}`} style={{
              position: "absolute",
              [v]: 12, [h]: 12,
              width: 18, height: 18,
              borderTop:    v === "top"    ? "2px solid rgba(99,91,255,0.5)" : "none",
              borderBottom: v === "bottom" ? "2px solid rgba(99,91,255,0.5)" : "none",
              borderLeft:   h === "left"   ? "2px solid rgba(99,91,255,0.5)" : "none",
              borderRight:  h === "right"  ? "2px solid rgba(99,91,255,0.5)" : "none",
              zIndex: 5,
              pointerEvents: "none",
            }} />
          ))}

          {/* Free Room chip */}
          <div style={{
            position: "absolute", top: 18, left: 18, zIndex: 5,
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.35)",
            borderRadius: 8, padding: "5px 11px",
            display: "flex", alignItems: "center", gap: 7,
            pointerEvents: "none",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 8px #10B981",
              display: "inline-block",
            }} />
            <span style={{ color: "#10B981", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>
              ROOM AVAILABLE
            </span>
          </div>

          {/* Scan chip */}
          <div style={{
            position: "absolute", bottom: 18, right: 18, zIndex: 5,
            background: "rgba(99,91,255,0.1)",
            border: "1px solid rgba(99,91,255,0.25)",
            borderRadius: 8, padding: "5px 11px",
            pointerEvents: "none",
          }}>
            <span style={{ color: "#a5b4fc", fontSize: 11, fontWeight: 500 }}>
              ⟳ Live scanning campus...
            </span>
          </div>

          <Canvas
            camera={{ position: [0, 0, 7.5], fov: 48 }}
            style={{ background: "transparent", width: "100%", height: "100%" }}
            gl={{ alpha: true, antialias: true }}
            dpr={[1, 1.8]}
          >
            <Scene mouseRef={mouseRef} />
          </Canvas>
        </div>
      </div>
    </section>
  );
}
