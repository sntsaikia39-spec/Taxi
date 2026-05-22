'use client'

import { useEffect, useRef } from 'react'
import type { Toast } from 'react-hot-toast'
import { resolveValue } from 'react-hot-toast'
import gsap from 'gsap'
import { CheckCircle2, XCircle, Loader2, Info } from 'lucide-react'

const configs = {
  success: {
    Icon: CheckCircle2,
    color: '#4ade80',
    iconBg: 'rgba(74, 222, 128, 0.14)',
    shadow: 'rgba(74, 222, 128, 0.1)',
    accent: 'rgba(74, 222, 128, 0.45)',
  },
  error: {
    Icon: XCircle,
    color: '#f87171',
    iconBg: 'rgba(248, 113, 113, 0.14)',
    shadow: 'rgba(248, 113, 113, 0.1)',
    accent: 'rgba(248, 113, 113, 0.45)',
  },
  loading: {
    Icon: Loader2,
    color: '#ffda00',
    iconBg: 'rgba(255, 218, 0, 0.14)',
    shadow: 'rgba(255, 218, 0, 0.1)',
    accent: 'rgba(255, 218, 0, 0.45)',
  },
  blank: {
    Icon: Info,
    color: '#94a3b8',
    iconBg: 'rgba(148, 163, 184, 0.14)',
    shadow: 'rgba(148, 163, 184, 0.1)',
    accent: 'rgba(148, 163, 184, 0.35)',
  },
}

export default function AppToast({ t }: { t: Toast }) {
  const ref = useRef<HTMLDivElement>(null)
  const cfg = configs[t.type as keyof typeof configs] ?? configs.blank
  const { Icon } = cfg

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current,
      { y: -32, opacity: 0, scale: 0.84 },
      { y: 0, opacity: 1, scale: 1, duration: 0.52, ease: 'back.out(1.8)' }
    )
  }, [])

  useEffect(() => {
    if (!t.visible && ref.current) {
      gsap.to(ref.current, {
        y: -14,
        opacity: 0,
        scale: 0.91,
        duration: 0.3,
        ease: 'power2.in',
      })
    }
  }, [t.visible])

  const message = resolveValue(t.message, t)

  return (
    <div
      ref={ref}
      style={{
        background: 'rgba(22, 17, 14, 0.96)',
        borderLeft: `3px solid ${cfg.accent}`,
        boxShadow: `0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06), 0 6px 28px ${cfg.shadow}`,
      }}
      className="flex items-center gap-3 pl-4 pr-5 py-3.5 rounded-2xl backdrop-blur-2xl min-w-[280px] max-w-[400px] pointer-events-auto"
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: cfg.iconBg }}
      >
        <Icon
          size={17}
          style={{ color: cfg.color }}
          className={t.type === 'loading' ? 'animate-spin' : ''}
        />
      </div>
      <p className="text-white/90 text-[13.5px] font-semibold leading-snug flex-1">
        {message}
      </p>
    </div>
  )
}
